package com.qvault.service;

import com.qvault.model.User;
import com.qvault.repository.UserRepository;
import com.qvault.service.OTPService.OTPPurpose;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * PIN Service
 * 
 * Handles workspace PIN management:
 * - Set PIN with BCrypt hashing
 * - Verify PIN for workspace access
 * - Reset PIN via OTP verification
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PinService {

    private final UserRepository userRepository;
    private final OTPService otpService;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Check if user has a PIN set
     * 
     * @param firebaseUid User's Firebase UID
     * @return true if PIN is set
     */
    public boolean hasPin(String firebaseUid) {
        User user = getUserByFirebaseUid(firebaseUid);
        return user.getWorkspacePin() != null && !user.getWorkspacePin().isEmpty();
    }

    /**
     * Set a new workspace PIN
     * 
     * @param firebaseUid User's Firebase UID
     * @param pin         PIN to set (4-10 characters)
     * @throws IllegalArgumentException if PIN doesn't meet requirements
     */
    @Transactional
    public void setPin(String firebaseUid, String pin) {
        validatePin(pin);

        User user = getUserByFirebaseUid(firebaseUid);
        String hashedPin = passwordEncoder.encode(pin);
        user.setWorkspacePin(hashedPin);
        userRepository.save(user);

        log.info("PIN set successfully for user: {}", firebaseUid);
    }

    /**
     * Verify workspace PIN
     * 
     * @param firebaseUid User's Firebase UID
     * @param pin         PIN to verify
     * @return true if PIN matches
     */
    public boolean verifyPin(String firebaseUid, String pin) {
        User user = getUserByFirebaseUid(firebaseUid);

        if (user.getWorkspacePin() == null) {
            log.warn("PIN verification attempted but no PIN set for user: {}", firebaseUid);
            return false;
        }

        boolean matches = passwordEncoder.matches(pin, user.getWorkspacePin());
        if (matches) {
            log.info("PIN verified successfully for user: {}", firebaseUid);
        } else {
            log.warn("Invalid PIN attempt for user: {}", firebaseUid);
        }

        return matches;
    }

    /**
     * Send OTP for PIN reset
     * 
     * @param firebaseUid User's Firebase UID
     */
    public void sendPinResetOTP(String firebaseUid) {
        User user = getUserByFirebaseUid(firebaseUid);
        String email = user.getEmail();

        String otp = otpService.generateOTP(email, OTPPurpose.PIN_RESET);
        emailService.sendPinResetOTPEmail(email, otp);

        log.info("PIN reset OTP sent for user: {}", firebaseUid);
    }

    /**
     * Verify OTP for PIN reset
     * 
     * @param firebaseUid User's Firebase UID
     * @param otp         OTP to verify
     * @return true if OTP is valid
     */
    public boolean verifyPinResetOTP(String firebaseUid, String otp) {
        User user = getUserByFirebaseUid(firebaseUid);
        String email = user.getEmail();

        return otpService.verifyOTP(email, otp, OTPPurpose.PIN_RESET);
    }

    /**
     * Reset PIN after OTP verification
     * 
     * @param firebaseUid User's Firebase UID
     * @param newPin      New PIN to set
     */
    @Transactional
    public void resetPin(String firebaseUid, String newPin) {
        validatePin(newPin);

        User user = getUserByFirebaseUid(firebaseUid);
        String hashedPin = passwordEncoder.encode(newPin);
        user.setWorkspacePin(hashedPin);
        userRepository.save(user);

        log.info("PIN reset successfully for user: {}", firebaseUid);
    }

    /**
     * Validate PIN format
     * 
     * @param pin PIN to validate
     * @throws IllegalArgumentException if invalid
     */
    private void validatePin(String pin) {
        if (pin == null || pin.length() < 4 || pin.length() > 10) {
            throw new IllegalArgumentException("PIN must be 4-10 characters");
        }
    }

    /**
     * Get user by Firebase UID
     * 
     * @param firebaseUid Firebase UID
     * @return User
     * @throws RuntimeException if not found
     */
    private User getUserByFirebaseUid(String firebaseUid) {
        return userRepository.findByFirebaseUid(firebaseUid)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
