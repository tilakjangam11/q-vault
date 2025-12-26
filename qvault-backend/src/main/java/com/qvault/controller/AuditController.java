package com.qvault.controller;

import com.qvault.dto.AuditLogResponse;
import com.qvault.model.AuditLog;
import com.qvault.model.User;
import com.qvault.security.UserPrincipal;
import com.qvault.service.AuditService;
import com.qvault.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    private final AuthService authService;

    /**
     * Get user's audit logs
     */
    @GetMapping("/logs")
    public ResponseEntity<Page<AuditLogResponse>> getUserLogs(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        User user = authService.getUserByFirebaseUid(principal.getUid());
        Pageable pageable = PageRequest.of(page, size);

        Page<AuditLog> logs = auditService.getUserLogs(user, pageable);
        Page<AuditLogResponse> response = logs.map(this::mapToResponse);

        return ResponseEntity.ok(response);
    }

    private AuditLogResponse mapToResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .eventType(log.getEventType().name())
                .fileName(log.getFile() != null ? log.getFile().getOriginalFilename() : null)
                .timestamp(log.getTimestamp())
                .ipAddress(log.getIpAddress())
                .success(log.getSuccess())
                .metadata(log.getMetadata())
                .build();
    }
}
