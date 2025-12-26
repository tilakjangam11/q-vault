package com.qvault.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OTP Service
 * 
 * Handles secure OTP generation and verification for:
 * - Login 2FA
 * - PIN Reset
 * 
 * Security Rules:
 * - 6-digit OTP
 * - 5-minute expiry
 * - Single-use (invalidated after successful verification)
 * - Max 3 verification attempts
 * - Never logged or stored permanently
 */
@Slf4j
@Service
public class OTPService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;

    // Separate stores for different OTP purposes
    private final ConcurrentHashMap<String, OTPData> loginOtpStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, OTPData> pinResetOtpStore = new ConcurrentHashMap<>();

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * OTP Purpose enum
     */
    public enum OTPPurpose {
        LOGIN,
        PIN_RESET
    }

    /**
     * Internal OTP data class
     */
    private static class OTPData {
        private final String otp;
        private final LocalDateTime expiresAt;
        private int attempts;

        public OTPData(String otp) {
            this.otp = otp;
            this.expiresAt = LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES);
            this.attempts = 0;
        }

        public boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }

        public boolean hasExceededMaxAttempts() {
            return attempts >= MAX_ATTEMPTS;
        }

        public void incrementAttempts() {
            attempts++;
        }

        public String getOtp() {
            return otp;
        }
    }

    /**
     * Generate a new OTP for the given email and purpose
     * 
     * @param email   User's email
     * @param purpose LOGIN or PIN_RESET
     * @return Generated 6-digit OTP
     */
    public String generateOTP(String email, OTPPurpose purpose) {
        // Generate 6-digit OTP
        int otpNumber = 100000 + secureRandom.nextInt(900000);
        String otp = String.valueOf(otpNumber);

        // Store OTP
        OTPData otpData = new OTPData(otp);
        getStore(purpose).put(email.toLowerCase(), otpData);

        log.info("OTP generated for {} (purpose: {})", maskEmail(email), purpose);
        return otp;
    }

    /**
     * Verify OTP for the given email and purpose
     * 
     * @param email   User's email
     * @param otp     OTP to verify
     * @param purpose LOGIN or PIN_RESET
     * @return true if OTP is valid, false otherwise
     */
    public boolean verifyOTP(String email, String otp, OTPPurpose purpose) {
        ConcurrentHashMap<String, OTPData> store = getStore(purpose);
        String key = email.toLowerCase();
        OTPData otpData = store.get(key);

        if (otpData == null) {
            log.warn("No OTP found for {} (purpose: {})", maskEmail(email), purpose);
            return false;
        }

        // Check expiry
        if (otpData.isExpired()) {
            log.warn("OTP expired for {} (purpose: {})", maskEmail(email), purpose);
            store.remove(key);
            return false;
        }

        // Check max attempts
        if (otpData.hasExceededMaxAttempts()) {
            log.warn("Max OTP attempts exceeded for {} (purpose: {})", maskEmail(email), purpose);
            store.remove(key);
            return false;
        }

        // Increment attempt count
        otpData.incrementAttempts();

        // Verify OTP
        if (otpData.getOtp().equals(otp)) {
            log.info("OTP verified successfully for {} (purpose: {})", maskEmail(email), purpose);
            // Remove OTP after successful verification (single-use)
            store.remove(key);
            return true;
        }

        log.warn("Invalid OTP attempt for {} (purpose: {}, attempts: {})",
                maskEmail(email), purpose, otpData.attempts);
        return false;
    }

    /**
     * Check if an OTP exists and is valid for the given email and purpose
     * 
     * @param email   User's email
     * @param purpose LOGIN or PIN_RESET
     * @return true if valid OTP exists
     */
    public boolean hasValidOTP(String email, OTPPurpose purpose) {
        OTPData otpData = getStore(purpose).get(email.toLowerCase());
        return otpData != null && !otpData.isExpired() && !otpData.hasExceededMaxAttempts();
    }

    /**
     * Invalidate OTP for the given email and purpose
     * 
     * @param email   User's email
     * @param purpose LOGIN or PIN_RESET
     */
    public void invalidateOTP(String email, OTPPurpose purpose) {
        getStore(purpose).remove(email.toLowerCase());
        log.info("OTP invalidated for {} (purpose: {})", maskEmail(email), purpose);
    }

    /**
     * Get remaining attempts for an OTP
     * 
     * @param email   User's email
     * @param purpose LOGIN or PIN_RESET
     * @return Remaining attempts, or 0 if no OTP exists
     */
    public int getRemainingAttempts(String email, OTPPurpose purpose) {
        OTPData otpData = getStore(purpose).get(email.toLowerCase());
        if (otpData == null || otpData.isExpired()) {
            return 0;
        }
        return MAX_ATTEMPTS - otpData.attempts;
    }

    /**
     * Get the appropriate store based on purpose
     */
    private ConcurrentHashMap<String, OTPData> getStore(OTPPurpose purpose) {
        return purpose == OTPPurpose.LOGIN ? loginOtpStore : pinResetOtpStore;
    }

    /**
     * Mask email for logging (privacy)
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        String localPart = parts[0];
        String domain = parts[1];

        if (localPart.length() <= 2) {
            return localPart.charAt(0) + "***@" + domain;
        }

        return localPart.charAt(0) + "***" + localPart.charAt(localPart.length() - 1) + "@" + domain;
    }
}
