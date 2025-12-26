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
public class FileMetadataResponse {
    private UUID id;
    private String originalFilename;
    private Long fileSize;
    private String contentType;
    private String mediaType;
    private LocalDateTime uploadedAt;
    private LocalDateTime lastAccessedAt;
}
