package com.qvault.crypto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import java.io.*;
import java.util.Base64;

/**
 * AES-256-GCM Encryption Service
 * 
 * Provides authenticated encryption for files with:
 * - Confidentiality (AES-256)
 * - Integrity (GCM authentication tag)
 * - Chunked processing for large files
 * - In-memory processing (no plaintext persistence)
 * - Immediate key destruction after use
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EncryptionService {

    private final QuantumSafeKeyService keyService;
    private final PostQuantumKeyWrapper keyWrapper;

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int CHUNK_SIZE = 1024 * 1024; // 1MB chunks

    /**
     * Encrypt a file with AES-256-GCM
     * 
     * @param inputStream Input file stream
     * @param userId      User ID for key binding
     * @param sessionId   Session ID for entropy
     * @return EncryptionResult containing encrypted data, wrapped key, and IV
     */
    public EncryptionResult encryptFile(InputStream inputStream, String userId, String sessionId) {
        try {
            // Generate unique encryption key
            String encodedKey = keyService.generateEncryptionKey(userId, sessionId);
            SecretKey secretKey = keyService.decodeKey(encodedKey);

            // Generate unique IV
            String ivString = keyService.generateIV();
            byte[] iv = Base64.getDecoder().decode(ivString);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);

            // Encrypt in chunks
            ByteArrayOutputStream encryptedOutput = new ByteArrayOutputStream();
            byte[] buffer = new byte[CHUNK_SIZE];
            int bytesRead;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                byte[] output = cipher.update(buffer, 0, bytesRead);
                if (output != null) {
                    encryptedOutput.write(output);
                }
            }

            // Finalize encryption (includes GCM tag)
            byte[] finalBlock = cipher.doFinal();
            encryptedOutput.write(finalBlock);

            byte[] encryptedData = encryptedOutput.toByteArray();

            // Wrap key with post-quantum encryption
            String wrappedKey = keyWrapper.wrapKey(secretKey);

            // Destroy key from memory
            keyService.destroyKey(secretKey.getEncoded());

            log.info("File encrypted successfully. Size: {} bytes", encryptedData.length);

            return EncryptionResult.builder()
                    .encryptedData(encryptedData)
                    .wrappedKey(wrappedKey)
                    .iv(ivString)
                    .algorithm(ALGORITHM)
                    .build();

        } catch (Exception e) {
            log.error("Encryption failed", e);
            throw new RuntimeException("File encryption failed", e);
        }
    }

    /**
     * Decrypt a file with AES-256-GCM
     * 
     * @param encryptedData Encrypted file data
     * @param wrappedKey    Post-quantum wrapped encryption key
     * @param ivString      Base64-encoded IV
     * @return Decrypted file data as byte array
     */
    public byte[] decryptFile(byte[] encryptedData, String wrappedKey, String ivString) {
        SecretKey secretKey = null;
        try {
            // Unwrap key
            secretKey = keyWrapper.unwrapKey(wrappedKey);
            byte[] iv = Base64.getDecoder().decode(ivString);

            // Initialize cipher
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);

            // Decrypt
            byte[] decryptedData = cipher.doFinal(encryptedData);

            log.info("File decrypted successfully. Size: {} bytes", decryptedData.length);

            return decryptedData;

        } catch (Exception e) {
            log.error("Decryption failed", e);
            throw new RuntimeException("File decryption failed", e);
        } finally {
            // CRITICAL: Destroy key immediately after use
            if (secretKey != null) {
                keyService.destroyKey(secretKey.getEncoded());
            }
        }
    }

    /**
     * Result of encryption operation
     */
    @lombok.Data
    @lombok.Builder
    public static class EncryptionResult {
        private byte[] encryptedData;
        private String wrappedKey;
        private String iv;
        private String algorithm;
    }
}
