package com.qvault.repository;

import com.qvault.model.DecryptedWorkspaceFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for DecryptedWorkspaceFile
 */
@Repository
public interface DecryptedWorkspaceRepository extends JpaRepository<DecryptedWorkspaceFile, UUID> {

    /**
     * Find all workspace files for a user, ordered by decryption time
     */
    List<DecryptedWorkspaceFile> findByUserIdOrderByDecryptedAtDesc(UUID userId);

    /**
     * Check if file is already in user's workspace
     */
    Optional<DecryptedWorkspaceFile> findByUserIdAndEncryptedFileId(UUID userId, UUID encryptedFileId);

    /**
     * Delete file from workspace
     */
    void deleteByUserIdAndEncryptedFileId(UUID userId, UUID encryptedFileId);

    /**
     * Count files in user's workspace
     */
    long countByUserId(UUID userId);
}
