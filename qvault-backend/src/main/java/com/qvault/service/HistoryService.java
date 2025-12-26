package com.qvault.service;

import com.qvault.model.EncryptionHistory;
import com.qvault.model.User;
import com.qvault.repository.EncryptionHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * History Service (Read-Only)
 * 
 * Logs and retrieves encryption/decryption history.
 * History entries are immutable - cannot be edited or deleted.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HistoryService {

    private final EncryptionHistoryRepository historyRepository;
    private final StorageService storageService;

    /**
     * Log an encryption event
     */
    @Transactional
    public void logEncryption(User user, String fileName, String contentType,
            String sessionId, String ipAddress) {
        String category = storageService.getFileCategory(fileName);

        EncryptionHistory history = EncryptionHistory.builder()
                .fileName(fileName)
                .fileType(contentType)
                .fileCategory(category)
                .operation(EncryptionHistory.OperationType.ENCRYPT)
                .sessionId(sessionId)
                .userId(user.getId())
                .userEmail(user.getEmail())
                .ipAddress(ipAddress)
                .build();

        historyRepository.save(history);
        log.info("📝 Logged encryption: {} for user: {}", fileName, user.getEmail());
    }

    /**
     * Log a decryption event
     */
    @Transactional
    public void logDecryption(User user, String fileName, String contentType,
            String sessionId, String ipAddress) {
        String category = storageService.getFileCategory(fileName);

        EncryptionHistory history = EncryptionHistory.builder()
                .fileName(fileName)
                .fileType(contentType)
                .fileCategory(category)
                .operation(EncryptionHistory.OperationType.DECRYPT)
                .sessionId(sessionId)
                .userId(user.getId())
                .userEmail(user.getEmail())
                .ipAddress(ipAddress)
                .build();

        historyRepository.save(history);
        log.info("📝 Logged decryption: {} for user: {}", fileName, user.getEmail());
    }

    /**
     * Get all history for a user (read-only)
     */
    public List<EncryptionHistory> getUserHistory(UUID userId) {
        return historyRepository.findByUserIdOrderByTimestampDesc(userId);
    }

    /**
     * Get encryption history only
     */
    public List<EncryptionHistory> getEncryptionHistory(UUID userId) {
        return historyRepository.findByUserIdAndOperationOrderByTimestampDesc(
                userId, EncryptionHistory.OperationType.ENCRYPT);
    }

    /**
     * Get decryption history only
     */
    public List<EncryptionHistory> getDecryptionHistory(UUID userId) {
        return historyRepository.findByUserIdAndOperationOrderByTimestampDesc(
                userId, EncryptionHistory.OperationType.DECRYPT);
    }
}
