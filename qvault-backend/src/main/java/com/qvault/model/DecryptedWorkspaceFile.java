package com.qvault.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Decrypted Workspace File Entity
 * 
 * Tracks files that have been decrypted and are available in the user's
 * decrypted workspace. This persists across logins.
 */
@Entity
@Table(name = "decrypted_workspace_files")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DecryptedWorkspaceFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID encryptedFileId;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private String mediaType;

    @Column(nullable = false)
    private Long fileSize;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime decryptedAt;
}
