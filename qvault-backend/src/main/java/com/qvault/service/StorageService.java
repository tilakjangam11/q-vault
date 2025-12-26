package com.qvault.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

/**
 * Storage Service with File Categorization
 * 
 * Files are stored in category-based folders:
 * - /encrypted/{userId}/images - .jpg, .jpeg, .png
 * - /encrypted/{userId}/videos - .mp4
 * - /encrypted/{userId}/audios - .mp3
 * - /encrypted/{userId}/documents - all others
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class StorageService {

    @Value("${storage.local.encrypted-path}")
    private String encryptedBasePath;

    @Value("${storage.local.decrypted-path}")
    private String decryptedBasePath;

    // File extension categories - expanded for all media types
    private static final Set<String> IMAGE_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tiff", "heic", "heif");
    private static final Set<String> VIDEO_EXTENSIONS = Set.of(
            "mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v", "mpeg", "mpg", "3gp");
    private static final Set<String> AUDIO_EXTENSIONS = Set.of(
            "mp3", "wav", "aac", "flac", "ogg", "wma", "m4a", "aiff", "opus");
    private static final Set<String> DOCUMENT_EXTENSIONS = Set.of(
            "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "rtf", "csv", "odt", "ods", "odp");
    private static final Set<String> ARCHIVE_EXTENSIONS = Set.of(
            "zip", "rar", "7z", "tar", "gz", "bz2", "xz");

    /**
     * Get file category based on extension
     */
    public String getFileCategory(String filename) {
        String extension = getFileExtension(filename).toLowerCase();

        if (IMAGE_EXTENSIONS.contains(extension)) {
            return "images";
        } else if (VIDEO_EXTENSIONS.contains(extension)) {
            return "videos";
        } else if (AUDIO_EXTENSIONS.contains(extension)) {
            return "audios";
        } else if (DOCUMENT_EXTENSIONS.contains(extension)) {
            return "documents";
        } else if (ARCHIVE_EXTENSIONS.contains(extension)) {
            return "archives";
        } else {
            return "documents"; // fallback for unknown types
        }
    }

    /**
     * Get file extension
     */
    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0) {
            return filename.substring(lastDot + 1);
        }
        return "";
    }

    /**
     * Store encrypted file in categorized folder
     */
    public String saveEncryptedFile(byte[] encryptedData, String userId, String originalFilename) {
        try {
            String category = getFileCategory(originalFilename);
            Path categoryDir = Paths.get(encryptedBasePath, userId, category);
            Files.createDirectories(categoryDir);

            String encryptedFilename = UUID.randomUUID().toString() + ".enc";
            Path filePath = categoryDir.resolve(encryptedFilename);

            Files.write(filePath, encryptedData);
            log.info("Stored encrypted file: {} in category: {} for user: {}",
                    encryptedFilename, category, userId);

            return userId + "/" + category + "/" + encryptedFilename;
        } catch (IOException e) {
            log.error("Failed to save encrypted file", e);
            throw new RuntimeException("Storage operation failed", e);
        }
    }

    /**
     * Store encrypted file (backwards compatible - uses default category)
     */
    public String saveEncryptedFile(byte[] encryptedData, String userId) {
        return saveEncryptedFile(encryptedData, userId, "file.bin");
    }

    /**
     * Retrieve encrypted file
     */
    public byte[] retrieveEncryptedFile(String storagePath) {
        try {
            Path filePath = Paths.get(encryptedBasePath, storagePath);

            if (!Files.exists(filePath)) {
                throw new RuntimeException("File not found: " + storagePath);
            }

            byte[] data = Files.readAllBytes(filePath);
            log.info("Retrieved encrypted file: {}", storagePath);
            return data;

        } catch (IOException e) {
            log.error("Failed to retrieve file: {}", storagePath, e);
            throw new RuntimeException("File retrieval failed", e);
        }
    }

    /**
     * Delete encrypted file
     */
    public void deleteFile(String storagePath) {
        try {
            Path filePath = Paths.get(encryptedBasePath, storagePath);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted file: {}", storagePath);
            }

        } catch (IOException e) {
            log.error("Failed to delete file: {}", storagePath, e);
            throw new RuntimeException("File deletion failed", e);
        }
    }

    /**
     * Store decrypted file in categorized folder
     */
    public String storeDecryptedFile(byte[] decryptedData, String userId, String originalFilename) {
        try {
            String category = getFileCategory(originalFilename);
            Path categoryDir = Paths.get(decryptedBasePath, userId, category);
            Files.createDirectories(categoryDir);

            Path filePath = categoryDir.resolve(originalFilename);
            Files.write(filePath, decryptedData);
            log.info("Stored decrypted file: {} in category: {} for user: {}",
                    originalFilename, category, userId);

            return userId + "/" + category + "/" + originalFilename;
        } catch (IOException e) {
            log.error("Failed to store decrypted file", e);
            throw new RuntimeException("Storage operation failed", e);
        }
    }

    /**
     * Retrieve decrypted file
     */
    public byte[] retrieveDecryptedFile(String storagePath) {
        try {
            Path filePath = Paths.get(decryptedBasePath, storagePath);

            if (!Files.exists(filePath)) {
                throw new RuntimeException("Decrypted file not found: " + storagePath);
            }

            byte[] data = Files.readAllBytes(filePath);
            log.info("Retrieved decrypted file: {}", storagePath);

            // Delete after retrieval (temporary file)
            Files.delete(filePath);

            return data;

        } catch (IOException e) {
            log.error("Failed to retrieve decrypted file: {}", storagePath, e);
            throw new RuntimeException("Decrypted file retrieval failed", e);
        }
    }
}
