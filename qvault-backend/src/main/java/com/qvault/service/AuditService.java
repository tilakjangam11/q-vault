package com.qvault.service;

import com.qvault.model.AuditLog;
import com.qvault.model.EncryptedFile;
import com.qvault.model.User;
import com.qvault.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Audit Logging Service
 * 
 * Logs all security-critical events for compliance and monitoring.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log an event
     */
    @Transactional
    public void logEvent(User user, AuditLog.EventType eventType, EncryptedFile file,
            String ipAddress, boolean success, String metadata) {
        AuditLog auditLog = AuditLog.builder()
                .user(user)
                .eventType(eventType)
                .file(file)
                .ipAddress(ipAddress)
                .success(success)
                .metadata(metadata)
                .build();

        auditLogRepository.save(auditLog);
        log.info("Audit log created: {} - {} - {}", eventType, user.getEmail(), success ? "SUCCESS" : "FAILED");
    }

    /**
     * Get user's audit logs
     */
    public Page<AuditLog> getUserLogs(User user, Pageable pageable) {
        return auditLogRepository.findByUserOrderByTimestampDesc(user, pageable);
    }

    /**
     * Get file-specific audit logs
     */
    public Page<AuditLog> getFileLogs(EncryptedFile file, Pageable pageable) {
        return auditLogRepository.findByFileOrderByTimestampDesc(file, pageable);
    }
}
