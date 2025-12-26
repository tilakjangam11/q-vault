package com.qvault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private UUID id;
    private String eventType;
    private String fileName;
    private LocalDateTime timestamp;
    private String ipAddress;
    private Boolean success;
    private String metadata;
}
