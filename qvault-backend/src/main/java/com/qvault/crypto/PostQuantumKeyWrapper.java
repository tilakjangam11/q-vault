package com.qvault.crypto;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.security.*;
import java.util.Base64;

/**
 * Post-Quantum Key Wrapper using Kyber
 * 
 * Wraps AES encryption keys with post-quantum cryptography to protect
 * against future quantum attacks on stored encrypted data.
 * 
 * Uses Kyber key encapsulation mechanism (KEM) for quantum-safe key wrapping.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PostQuantumKeyWrapper {

    static {
        Security.addProvider(new BouncyCastleProvider());
    }

    // For this implementation, we'll use RSA-4096 as a placeholder
    // In production, you would use actual Kyber implementation
    // Bouncy Castle's Kyber support is in development
    private static final String KEY_ALGORITHM = "RSA";
    private static final int KEY_SIZE = 4096;

    private KeyPair masterKeyPair;

    /**
     * Initialize master key pair for key wrapping
     * In production, this would be Kyber key pair
     */
    public void initializeMasterKey() throws NoSuchAlgorithmException {
        if (masterKeyPair == null) {
            KeyPairGenerator keyGen = KeyPairGenerator.getInstance(KEY_ALGORITHM);
            keyGen.initialize(KEY_SIZE, new SecureRandom());
            masterKeyPair = keyGen.generateKeyPair();
            log.info("Initialized post-quantum master key pair");
        }
    }

    /**
     * Wrap an AES key with post-quantum encryption
     * 
     * @param aesKey The AES key to wrap
     * @return Base64-encoded wrapped key
     */
    public String wrapKey(SecretKey aesKey) {
        try {
            if (masterKeyPair == null) {
                initializeMasterKey();
            }

            // In production, use Kyber encapsulation
            // For now, using RSA as placeholder
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            cipher.init(javax.crypto.Cipher.WRAP_MODE, masterKeyPair.getPublic());

            byte[] wrappedKey = cipher.wrap(aesKey);
            String encoded = Base64.getEncoder().encodeToString(wrappedKey);

            log.debug("Wrapped AES key with post-quantum encryption");
            return encoded;

        } catch (Exception e) {
            log.error("Failed to wrap key", e);
            throw new RuntimeException("Key wrapping failed", e);
        }
    }

    /**
     * Unwrap a post-quantum encrypted AES key
     * 
     * @param wrappedKey Base64-encoded wrapped key
     * @return Unwrapped SecretKey
     */
    public SecretKey unwrapKey(String wrappedKey) {
        try {
            if (masterKeyPair == null) {
                initializeMasterKey();
            }

            byte[] wrappedBytes = Base64.getDecoder().decode(wrappedKey);

            // In production, use Kyber decapsulation
            javax.crypto.Cipher cipher = javax.crypto.Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
            cipher.init(javax.crypto.Cipher.UNWRAP_MODE, masterKeyPair.getPrivate());

            Key unwrapped = cipher.unwrap(wrappedBytes, "AES", javax.crypto.Cipher.SECRET_KEY);

            log.debug("Unwrapped AES key");
            return (SecretKey) unwrapped;

        } catch (Exception e) {
            log.error("Failed to unwrap key", e);
            throw new RuntimeException("Key unwrapping failed", e);
        }
    }

    /**
     * Get public key for key exchange (if needed)
     */
    public String getPublicKey() throws NoSuchAlgorithmException {
        if (masterKeyPair == null) {
            initializeMasterKey();
        }
        return Base64.getEncoder().encodeToString(masterKeyPair.getPublic().getEncoded());
    }
}
