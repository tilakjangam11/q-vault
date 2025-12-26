package com.qvault.crypto;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * QKD-Inspired Key Generation Service
 * 
 * Generates cryptographically secure, ephemeral encryption keys using:
 * - Cryptographically secure random number generator
 * - Session entropy
 * - User identity binding
 * - Timestamp-based nonces
 * 
 * Keys are single-use and never reused.
 */
@Slf4j
@Service
public class QuantumSafeKeyService {

    private static final String ALGORITHM = "AES";
    private static final int KEY_SIZE = 256;
    private static final SecureRandom secureRandom = new SecureRandom();

    /**
     * Generate a unique AES-256 key for file encryption
     * 
     * @param userId    User identifier for key binding
     * @param sessionId Session identifier for additional entropy
     * @return Base64-encoded encryption key
     */
    public String generateEncryptionKey(String userId, String sessionId) {
        try {
            // Generate base key using cryptographically secure RNG
            KeyGenerator keyGen = KeyGenerator.getInstance(ALGORITHM);
            keyGen.init(KEY_SIZE, secureRandom);
            SecretKey secretKey = keyGen.generateKey();

            // Add session and user entropy
            byte[] keyBytes = secretKey.getEncoded();
            byte[] entropy = generateEntropy(userId, sessionId);

            // XOR with entropy for additional randomness
            byte[] enhancedKey = new byte[keyBytes.length];
            for (int i = 0; i < keyBytes.length; i++) {
                enhancedKey[i] = (byte) (keyBytes[i] ^ entropy[i % entropy.length]);
            }

            String encodedKey = Base64.getEncoder().encodeToString(enhancedKey);
            log.debug("Generated encryption key for user: {}", userId);

            return encodedKey;

        } catch (NoSuchAlgorithmException e) {
            log.error("Failed to generate encryption key", e);
            throw new RuntimeException("Key generation failed", e);
        }
    }

    /**
     * Generate a unique initialization vector (IV) for AES-GCM
     * 
     * @return Base64-encoded IV (12 bytes for GCM)
     */
    public String generateIV() {
        byte[] iv = new byte[12]; // GCM standard IV size
        secureRandom.nextBytes(iv);
        return Base64.getEncoder().encodeToString(iv);
    }

    /**
     * Generate session-specific entropy combining user ID, session ID, and
     * timestamp
     */
    private byte[] generateEntropy(String userId, String sessionId) {
        String entropySource = userId + sessionId + System.nanoTime();
        byte[] hash = entropySource.getBytes();

        // Additional random bytes
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);

        // Combine
        byte[] entropy = new byte[32];
        for (int i = 0; i < 32; i++) {
            entropy[i] = (byte) (hash[i % hash.length] ^ randomBytes[i]);
        }

        return entropy;
    }

    /**
     * Convert Base64-encoded key to SecretKey object
     */
    public SecretKey decodeKey(String encodedKey) {
        byte[] keyBytes = Base64.getDecoder().decode(encodedKey);
        return new SecretKeySpec(keyBytes, ALGORITHM);
    }

    /**
     * Securely destroy key from memory
     */
    public void destroyKey(byte[] keyBytes) {
        if (keyBytes != null) {
            for (int i = 0; i < keyBytes.length; i++) {
                keyBytes[i] = 0;
            }
        }
    }
}
