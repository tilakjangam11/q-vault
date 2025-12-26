package com.qvault.repository;

import com.qvault.model.AuditLog;
import com.qvault.model.EncryptedFile;
import com.qvault.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {
    Page<AuditLog> findByUserOrderByTimestampDesc(User user, Pageable pageable);

    Page<AuditLog> findByFileOrderByTimestampDesc(EncryptedFile file, Pageable pageable);
}
