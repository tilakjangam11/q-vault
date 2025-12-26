package com.qvault.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "encrypted_files")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EncryptedFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String originalFilename;

    @Column(nullable = false)
    private Long fileSize;

    @Column(nullable = false)
    private String storagePath;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String encryptedKey;

    @Column(nullable = false)
    private String iv;

    @Column(nullable = false)
    private String algorithm;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;

    private LocalDateTime lastAccessedAt;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private String mediaType; // IMAGE, VIDEO, AUDIO, DOCUMENT, ARCHIVE, OTHER
}
