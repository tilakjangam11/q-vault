package com.qvault.controller;

import com.qvault.model.EncryptionHistory;
import com.qvault.model.User;
import com.qvault.security.UserPrincipal;
import com.qvault.service.AuthService;
import com.qvault.service.HistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * History Controller (Read-Only)
 * 
 * Provides read-only access to encryption/decryption history.
 * History entries cannot be edited or deleted.
 */
@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;
    private final AuthService authService;

    /**
     * Get all history for the current user
     */
    @GetMapping
    public ResponseEntity<List<HistoryResponse>> getAllHistory(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = authService.getUserByFirebaseUid(principal.getUid());
        List<EncryptionHistory> history = historyService.getUserHistory(user.getId());

        return ResponseEntity.ok(history.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    /**
     * Get encryption history only
     */
    @GetMapping("/encryptions")
    public ResponseEntity<List<HistoryResponse>> getEncryptionHistory(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = authService.getUserByFirebaseUid(principal.getUid());
        List<EncryptionHistory> history = historyService.getEncryptionHistory(user.getId());

        return ResponseEntity.ok(history.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    /**
     * Get decryption history only
     */
    @GetMapping("/decryptions")
    public ResponseEntity<List<HistoryResponse>> getDecryptionHistory(
            @AuthenticationPrincipal UserPrincipal principal) {

        User user = authService.getUserByFirebaseUid(principal.getUid());
        List<EncryptionHistory> history = historyService.getDecryptionHistory(user.getId());

        return ResponseEntity.ok(history.stream()
                .map(this::toResponse)
                .collect(Collectors.toList()));
    }

    /**
     * Convert history entity to response DTO
     */
    private HistoryResponse toResponse(EncryptionHistory history) {
        return HistoryResponse.builder()
                .id(history.getId())
                .fileName(history.getFileName())
                .fileType(history.getFileType())
                .fileCategory(history.getFileCategory())
                .operation(history.getOperation().name())
                .timestamp(history.getTimestamp())
                .build();
    }

    /**
     * Response DTO for history entries
     */
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class HistoryResponse {
        private UUID id;
        private String fileName;
        private String fileType;
        private String fileCategory;
        private String operation;
        private LocalDateTime timestamp;
    }
}
