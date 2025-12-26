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
 * Encryption History Entity (Read-Only)
 * 
 * Records all encryption and decryption operations for audit and security
 * review.
 * This table is immutable - entries cannot be edited or deleted.
 */
@Entity
@Table(name = "encryption_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EncryptionHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String fileName;

    @Column(nullable = false)
    private String fileType;

    @Column(nullable = false)
    private String fileCategory; // images, videos, audios, documents

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OperationType operation;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime timestamp;

    private String sessionId;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private String userEmail;

    private String ipAddress;

    public enum OperationType {
        ENCRYPT,
        DECRYPT
    }
}
