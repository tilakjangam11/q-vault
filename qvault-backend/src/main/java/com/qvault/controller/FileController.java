package com.qvault.controller;

import com.qvault.model.EncryptedFile;
import com.qvault.model.User;
import com.qvault.repository.EncryptedFileRepository;
import com.qvault.security.UserPrincipal;
import com.qvault.service.FileService;
import com.qvault.service.StorageService;
import com.qvault.service.AuthService;
import com.qvault.dto.FileMetadataResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * File Controller
 * 
 * Handles file upload, encryption, download, and deletion.
 * Phone OTP verification is handled by Firebase on frontend.
 */
@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

        private final FileService fileService;
        private final StorageService storageService;
        private final EncryptedFileRepository fileRepository;
        private final AuthService authService;

        /**
         * Upload and encrypt file
         * (Phone OTP is verified by Firebase on frontend before this call)
         */
        @PostMapping("/upload")
        public ResponseEntity<FileMetadataResponse> uploadFile(
                        @RequestParam("file") MultipartFile file,
                        @AuthenticationPrincipal UserPrincipal principal,
                        HttpServletRequest request) {

                User user = authService.getUserByFirebaseUid(principal.getUid());
                String sessionId = request.getSession().getId();
                String ipAddress = request.getRemoteAddr();

                EncryptedFile encryptedFile = fileService.uploadAndEncryptFile(
                                file, user, sessionId, ipAddress);

                return ResponseEntity.ok(toResponse(encryptedFile));
        }

        /**
         * List user's files
         */
        @GetMapping
        public ResponseEntity<List<FileMetadataResponse>> listFiles(
                        @AuthenticationPrincipal UserPrincipal principal) {

                User user = authService.getUserByFirebaseUid(principal.getUid());
                List<EncryptedFile> files = fileService.listUserFiles(user);

                List<FileMetadataResponse> response = files.stream()
                                .map(this::toResponse)
                                .collect(Collectors.toList());

                return ResponseEntity.ok(response);
        }

        /**
         * Download encrypted file (no OTP required - file is still encrypted)
         */
        @GetMapping("/{id}/download-encrypted")
        public ResponseEntity<Resource> downloadEncrypted(
                        @PathVariable UUID id,
                        @AuthenticationPrincipal UserPrincipal principal) {

                User user = authService.getUserByFirebaseUid(principal.getUid());

                EncryptedFile encryptedFile = fileRepository.findByIdAndUser(id, user)
                                .orElseThrow(() -> new RuntimeException("File not found"));

                byte[] encryptedData = storageService.retrieveEncryptedFile(encryptedFile.getStoragePath());

                ByteArrayResource resource = new ByteArrayResource(encryptedData);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=\"" + encryptedFile.getOriginalFilename()
                                                                + ".enc\"")
                                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                                .contentLength(encryptedData.length)
                                .body(resource);
        }

        /**
         * Decrypt and download file
         * (Phone OTP is verified by Firebase on frontend before this call)
         */
        @PostMapping("/{id}/download")
        public ResponseEntity<Resource> downloadFile(
                        @PathVariable UUID id,
                        @AuthenticationPrincipal UserPrincipal principal,
                        HttpServletRequest request) {

                User user = authService.getUserByFirebaseUid(principal.getUid());
                String sessionId = request.getSession().getId();
                String ipAddress = request.getRemoteAddr();

                byte[] decryptedData = fileService.decryptAndDownloadFile(
                                id, user, sessionId, ipAddress);

                EncryptedFile encryptedFile = fileRepository.findByIdAndUser(id, user)
                                .orElseThrow(() -> new RuntimeException("File not found"));

                ByteArrayResource resource = new ByteArrayResource(decryptedData);

                return ResponseEntity.ok()
                                .header(HttpHeaders.CONTENT_DISPOSITION,
                                                "attachment; filename=\"" + encryptedFile.getOriginalFilename() + "\"")
                                .contentType(MediaType.parseMediaType(encryptedFile.getContentType()))
                                .contentLength(decryptedData.length)
                                .body(resource);
        }

        /**
         * Delete file
         */
        @DeleteMapping("/{id}")
        public ResponseEntity<Void> deleteFile(
                        @PathVariable UUID id,
                        @AuthenticationPrincipal UserPrincipal principal,
                        HttpServletRequest request) {

                User user = authService.getUserByFirebaseUid(principal.getUid());
                String ipAddress = request.getRemoteAddr();

                fileService.deleteFile(id, user, ipAddress);

                return ResponseEntity.noContent().build();
        }

        private FileMetadataResponse toResponse(EncryptedFile file) {
                return FileMetadataResponse.builder()
                                .id(file.getId())
                                .originalFilename(file.getOriginalFilename())
                                .fileSize(file.getFileSize())
                                .contentType(file.getContentType())
                                .mediaType(file.getMediaType())
                                .uploadedAt(file.getUploadedAt())
                                .lastAccessedAt(file.getLastAccessedAt())
                                .build();
        }
}
