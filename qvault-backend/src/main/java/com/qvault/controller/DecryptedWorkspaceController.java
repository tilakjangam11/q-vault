package com.qvault.controller;

import com.qvault.model.DecryptedWorkspaceFile;
import com.qvault.model.EncryptedFile;
import com.qvault.model.User;
import com.qvault.repository.EncryptedFileRepository;
import com.qvault.security.UserPrincipal;
import com.qvault.service.AuthService;
import com.qvault.service.DecryptedWorkspaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Decrypted Workspace Controller
 * 
 * Manages the user's decrypted workspace - files that have been decrypted
 * and are available for quick access.
 */
@RestController
@RequestMapping("/api/workspace")
@RequiredArgsConstructor
public class DecryptedWorkspaceController {

    private final DecryptedWorkspaceService workspaceService;
    private final AuthService authService;
    private final EncryptedFileRepository encryptedFileRepository;

    /**
     * Get all files in user's decrypted workspace
     */
    @GetMapping
    public ResponseEntity<List<WorkspaceFileResponse>> getWorkspaceFiles(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = authService.getUserByFirebaseUid(principal.getUid());
        List<DecryptedWorkspaceFile> files = workspaceService.getWorkspaceFiles(user.getId());

        return ResponseEntity.ok(files.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    /**
     * Add file to workspace (called after successful decryption)
     */
    @PostMapping("/{fileId}")
    public ResponseEntity<WorkspaceFileResponse> addToWorkspace(
            @PathVariable UUID fileId,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = authService.getUserByFirebaseUid(principal.getUid());
        EncryptedFile encryptedFile = encryptedFileRepository.findByIdAndUser(fileId, user)
                .orElseThrow(() -> new RuntimeException("File not found"));

        DecryptedWorkspaceFile workspaceFile = workspaceService.addToWorkspace(user, encryptedFile);

        return ResponseEntity.ok(toResponse(workspaceFile));
    }

    /**
     * Remove file from workspace
     */
    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> removeFromWorkspace(
            @PathVariable UUID fileId,
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = authService.getUserByFirebaseUid(principal.getUid());
        workspaceService.removeFromWorkspace(user.getId(), fileId);

        return ResponseEntity.noContent().build();
    }

    private WorkspaceFileResponse toResponse(DecryptedWorkspaceFile file) {
        return WorkspaceFileResponse.builder()
                .id(file.getEncryptedFileId())
                .originalFilename(file.getOriginalFilename())
                .contentType(file.getContentType())
                .mediaType(file.getMediaType())
                .fileSize(file.getFileSize())
                .decryptedAt(file.getDecryptedAt())
                .build();
    }

    /**
     * Response DTO for workspace files
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class WorkspaceFileResponse {
        private UUID id;
        private String originalFilename;
        private String contentType;
        private String mediaType;
        private Long fileSize;
        private LocalDateTime decryptedAt;
    }
}
