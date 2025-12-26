package com.qvault.service;

import com.qvault.model.DecryptedWorkspaceFile;
import com.qvault.model.EncryptedFile;
import com.qvault.model.User;
import com.qvault.repository.DecryptedWorkspaceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Decrypted Workspace Service
 * 
 * Manages the user's decrypted workspace - files that have been decrypted
 * and are available for quick access without re-decryption.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DecryptedWorkspaceService {

    private final DecryptedWorkspaceRepository workspaceRepository;

    /**
     * Add a file to the user's decrypted workspace
     */
    @Transactional
    public DecryptedWorkspaceFile addToWorkspace(User user, EncryptedFile encryptedFile) {
        // Check if already in workspace
        var existing = workspaceRepository.findByUserIdAndEncryptedFileId(
                user.getId(), encryptedFile.getId());

        if (existing.isPresent()) {
            log.info("File {} already in workspace for user {}",
                    encryptedFile.getOriginalFilename(), user.getEmail());
            return existing.get();
        }

        DecryptedWorkspaceFile workspaceFile = DecryptedWorkspaceFile.builder()
                .userId(user.getId())
                .encryptedFileId(encryptedFile.getId())
                .originalFilename(encryptedFile.getOriginalFilename())
                .contentType(encryptedFile.getContentType())
                .mediaType(encryptedFile.getMediaType())
                .fileSize(encryptedFile.getFileSize())
                .build();

        workspaceFile = workspaceRepository.save(workspaceFile);
        log.info("✅ Added file {} to workspace for user {}",
                encryptedFile.getOriginalFilename(), user.getEmail());

        return workspaceFile;
    }

    /**
     * Get all files in user's workspace
     */
    public List<DecryptedWorkspaceFile> getWorkspaceFiles(UUID userId) {
        return workspaceRepository.findByUserIdOrderByDecryptedAtDesc(userId);
    }

    /**
     * Remove file from workspace
     */
    @Transactional
    public void removeFromWorkspace(UUID userId, UUID encryptedFileId) {
        workspaceRepository.deleteByUserIdAndEncryptedFileId(userId, encryptedFileId);
        log.info("🗑️ Removed file {} from workspace", encryptedFileId);
    }

    /**
     * Check if file is in workspace
     */
    public boolean isInWorkspace(UUID userId, UUID encryptedFileId) {
        return workspaceRepository.findByUserIdAndEncryptedFileId(userId, encryptedFileId).isPresent();
    }
}
