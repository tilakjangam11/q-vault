package com.qvault.service;

import com.qvault.crypto.EncryptionService;
import com.qvault.model.AuditLog;
import com.qvault.model.EncryptedFile;
import com.qvault.model.User;
import com.qvault.repository.EncryptedFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * File Management Service
 * 
 * Handles file encryption, storage, and decryption.
 * - Phone OTP verification is handled by frontend via Firebase
 * - Files are categorized and stored by type
 * - All operations are logged to history
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileService {

        private final EncryptionService encryptionService;
        private final StorageService storageService;
        private final EncryptedFileRepository fileRepository;
        private final AuditService auditService;
        private final HistoryService historyService;
        private final DecryptedWorkspaceService workspaceService;

        /**
         * Upload and encrypt a file
         * 
         * @param file      Uploaded file
         * @param user      Authenticated user
         * @param sessionId Session ID for key generation
         * @param ipAddress User IP address
         * @return Encrypted file metadata
         */
        @Transactional
        public EncryptedFile uploadAndEncryptFile(MultipartFile file, User user,
                        String sessionId, String ipAddress) {
                try {
                        log.info("🔐 Starting encryption for: {} by user: {}",
                                        file.getOriginalFilename(), user.getEmail());

                        // Encrypt file
                        EncryptionService.EncryptionResult result = encryptionService.encryptFile(
                                        file.getInputStream(),
                                        user.getFirebaseUid(),
                                        sessionId);

                        // Save encrypted file to categorized storage
                        String storagePath = storageService.saveEncryptedFile(
                                        result.getEncryptedData(),
                                        user.getFirebaseUid(),
                                        file.getOriginalFilename());

                        // Get file category and media type
                        String category = storageService.getFileCategory(file.getOriginalFilename());
                        String mediaType = com.qvault.util.MediaTypeUtil.getMediaType(file.getContentType());

                        // Save metadata
                        EncryptedFile encryptedFile = EncryptedFile.builder()
                                        .user(user)
                                        .originalFilename(file.getOriginalFilename())
                                        .fileSize(file.getSize())
                                        .storagePath(storagePath)
                                        .encryptedKey(result.getWrappedKey())
                                        .iv(result.getIv())
                                        .algorithm(result.getAlgorithm())
                                        .contentType(file.getContentType())
                                        .mediaType(mediaType)
                                        .build();

                        encryptedFile = fileRepository.save(encryptedFile);

                        // Log to audit
                        auditService.logEvent(user, AuditLog.EventType.FILE_ENCRYPT, encryptedFile, ipAddress, true,
                                        "File: " + file.getOriginalFilename() + " | Category: " + category);

                        // Log to history (read-only)
                        historyService.logEncryption(user, file.getOriginalFilename(),
                                        file.getContentType(), sessionId, ipAddress);

                        log.info("✅ File encrypted and saved: {} ({}) in /{}",
                                        file.getOriginalFilename(), encryptedFile.getId(), category);

                        return encryptedFile;

                } catch (IOException e) {
                        auditService.logEvent(user, AuditLog.EventType.FILE_UPLOAD, null, ipAddress, false,
                                        e.getMessage());
                        log.error("❌ File upload failed", e);
                        throw new RuntimeException("File upload failed", e);
                }
        }

        /**
         * List user's encrypted files
         */
        public List<EncryptedFile> listUserFiles(User user) {
                return fileRepository.findByUserOrderByUploadedAtDesc(user);
        }

        /**
         * Decrypt and download file
         * 
         * Phone OTP verification is done on frontend via Firebase.
         * Backend verifies file ownership only.
         * 
         * @param fileId    File ID
         * @param user      Authenticated user
         * @param sessionId Session ID
         * @param ipAddress User IP address
         * @return Decrypted file bytes
         */
        @Transactional
        public byte[] decryptAndDownloadFile(UUID fileId, User user,
                        String sessionId, String ipAddress) {
                // Get file metadata (also verifies ownership)
                EncryptedFile encryptedFile = fileRepository.findByIdAndUser(fileId, user)
                                .orElseThrow(() -> {
                                        log.warn("❌ File not found or access denied: {} for user: {}",
                                                        fileId, user.getEmail());
                                        auditService.logEvent(user, AuditLog.EventType.FAILED_DECRYPT, null,
                                                        ipAddress, false, "File not found or access denied");
                                        return new SecurityException(
                                                        "File not found or you don't have permission to access it");
                                });

                try {
                        log.info("🔓 Starting decryption for: {} by user: {}",
                                        encryptedFile.getOriginalFilename(), user.getEmail());

                        // Retrieve encrypted file
                        byte[] encryptedData = storageService.retrieveEncryptedFile(encryptedFile.getStoragePath());

                        // Decrypt file
                        byte[] decryptedData = encryptionService.decryptFile(
                                        encryptedData,
                                        encryptedFile.getEncryptedKey(),
                                        encryptedFile.getIv());

                        // Update last accessed
                        encryptedFile.setLastAccessedAt(LocalDateTime.now());
                        fileRepository.save(encryptedFile);

                        // Log to audit
                        auditService.logEvent(user, AuditLog.EventType.FILE_DECRYPT, encryptedFile, ipAddress, true,
                                        "File: " + encryptedFile.getOriginalFilename());

                        // Log to history (read-only)
                        historyService.logDecryption(user, encryptedFile.getOriginalFilename(),
                                        encryptedFile.getContentType(), sessionId, ipAddress);

                        // Add to decrypted workspace (persists across logins)
                        workspaceService.addToWorkspace(user, encryptedFile);

                        log.info("✅ File decrypted: {} ({})", encryptedFile.getOriginalFilename(), fileId);

                        return decryptedData;

                } catch (Exception e) {
                        auditService.logEvent(user, AuditLog.EventType.FAILED_DECRYPT, encryptedFile, ipAddress, false,
                                        e.getMessage());
                        log.error("❌ File decryption failed", e);
                        throw new RuntimeException("File decryption failed", e);
                }
        }

        /**
         * Delete encrypted file
         */
        @Transactional
        public void deleteFile(UUID fileId, User user, String ipAddress) {
                EncryptedFile encryptedFile = fileRepository.findByIdAndUser(fileId, user)
                                .orElseThrow(() -> new RuntimeException("File not found"));

                // Delete from storage
                storageService.deleteFile(encryptedFile.getStoragePath());

                // Delete metadata
                fileRepository.delete(encryptedFile);

                // Log deletion
                auditService.logEvent(user, AuditLog.EventType.FILE_DELETE, encryptedFile, ipAddress, true,
                                "File: " + encryptedFile.getOriginalFilename());

                log.info("🗑️ File deleted: {} ({})", encryptedFile.getOriginalFilename(), fileId);
        }

        /**
         * Get file by ID (with ownership check)
         */
        public EncryptedFile getFile(UUID fileId, User user) {
                return fileRepository.findByIdAndUser(fileId, user)
                                .orElseThrow(() -> new SecurityException("File not found or access denied"));
        }
}
