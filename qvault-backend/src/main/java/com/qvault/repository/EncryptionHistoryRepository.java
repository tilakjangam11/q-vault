package com.qvault.repository;

import com.qvault.model.EncryptionHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for EncryptionHistory (Read-Only Operations)
 */
@Repository
public interface EncryptionHistoryRepository extends JpaRepository<EncryptionHistory, UUID> {

    /**
     * Find all history entries for a user, ordered by timestamp descending
     */
    List<EncryptionHistory> findByUserIdOrderByTimestampDesc(UUID userId);

    /**
     * Find history entries by operation type
     */
    List<EncryptionHistory> findByUserIdAndOperationOrderByTimestampDesc(
            UUID userId, EncryptionHistory.OperationType operation);
}
