package com.qvault.service;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.qvault.model.AuditLog;
import com.qvault.model.User;
import com.qvault.repository.UserRepository;
import com.qvault.service.OTPService.OTPPurpose;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Authentication Service
 * 
 * Handles user authentication with:
 * - Email verification via Firebase link
 * - Email OTP for login 2FA
 * - Email OTP for sensitive operations (decryption)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final FirebaseAuth firebaseAuth;
    private final UserRepository userRepository;
    private final AuditService auditService;
    private final EmailService emailService;
    private final OTPService otpService;

    /**
     * Register new user
     */
    @Transactional
    public User registerUser(String idToken, String username, String firstName,
            String lastName, String ipAddress)
            throws FirebaseAuthException {
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();

        if (userRepository.findByFirebaseUid(uid).isPresent()) {
            throw new RuntimeException("User already exists");
        }

        String displayName = firstName + " " + lastName;

        User newUser = User.builder()
                .firebaseUid(uid)
                .email(email)
                .username(username)
                .displayName(displayName)
                .firstName(firstName)
                .lastName(lastName)
                .emailVerified(decodedToken.isEmailVerified())
                .build();

        log.info("Registering new user: {}", email);
        User savedUser = userRepository.save(newUser);

        auditService.logEvent(savedUser, AuditLog.EventType.LOGIN, null, ipAddress, true, "User registration");

        return savedUser;
    }

    /**
     * Verify Firebase token and get/create user (Step 1 of 2FA login)
     * Does not complete login - OTP verification still required
     */
    @Transactional
    public User verifyTokenAndGetUser(String idToken, String ipAddress) throws FirebaseAuthException {
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();

        User user = userRepository.findByFirebaseUid(uid)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .firebaseUid(uid)
                            .email(email)
                            .emailVerified(decodedToken.isEmailVerified())
                            .build();
                    log.info("Creating new user (fallback): {}", email);
                    return userRepository.save(newUser);
                });

        // Update email verification status from Firebase
        user.setEmailVerified(decodedToken.isEmailVerified());
        userRepository.save(user);

        // Note: We don't log login event here - it happens after OTP verification
        log.info("Credentials verified for user: {} - OTP required", maskEmail(email));

        return user;
    }

    /**
     * Send Login OTP for 2FA (Step 2a of login)
     */
    public void sendLoginOTP(String idToken) throws FirebaseAuthException {
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        String email = decodedToken.getEmail();

        // Generate OTP using OTPService
        String otp = otpService.generateOTP(email, OTPPurpose.LOGIN);

        // Send OTP via email
        emailService.sendLoginOTPEmail(email, otp);

        log.info("Login OTP sent to email: {}", maskEmail(email));
    }

    /**
     * Verify Login OTP and complete login (Step 2b of login)
     * Returns user if OTP is valid, null otherwise
     */
    @Transactional
    public User verifyLoginOTPAndGetUser(String idToken, String otp, String ipAddress) throws FirebaseAuthException {
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        String uid = decodedToken.getUid();
        String email = decodedToken.getEmail();

        // Verify OTP using OTPService
        boolean valid = otpService.verifyOTP(email, otp, OTPPurpose.LOGIN);

        if (!valid) {
            log.warn("Invalid login OTP for user: {}", maskEmail(email));
            auditService.logEvent(null, AuditLog.EventType.LOGIN, null, ipAddress, false, "Invalid OTP");
            return null;
        }

        // OTP verified - complete login
        User user = userRepository.findByFirebaseUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        auditService.logEvent(user, AuditLog.EventType.LOGIN, null, ipAddress, true, "2FA login successful");
        log.info("Login OTP verified successfully for: {}", maskEmail(email));

        return user;
    }

    /**
     * Send OTP to user's email for sensitive operations (decryption)
     */
    public void sendOTP(String idToken) throws FirebaseAuthException {
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        String email = decodedToken.getEmail();

        // Generate OTP for sensitive operation (reuse LOGIN purpose for simplicity)
        String otp = otpService.generateOTP(email, OTPPurpose.LOGIN);

        // Send OTP via email
        emailService.sendOTPEmail(email, otp, "sensitive operation");

        log.info("OTP sent to email: {}", maskEmail(email));
    }

    /**
     * Verify OTP for sensitive operations
     */
    public boolean verifyOTP(String idToken, String otp) throws FirebaseAuthException {
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(idToken);
        String email = decodedToken.getEmail();

        boolean valid = otpService.verifyOTP(email, otp, OTPPurpose.LOGIN);

        if (valid) {
            log.info("OTP verified successfully for: {}", maskEmail(email));
        } else {
            log.warn("Invalid OTP attempt for: {}", maskEmail(email));
        }

        return valid;
    }

    /**
     * Get user by Firebase UID
     */
    public User getUserByFirebaseUid(String uid) {
        return userRepository.findByFirebaseUid(uid)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Mask email for logging
     */
    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return "***";
        }
        String[] parts = email.split("@");
        String name = parts[0];
        if (name.length() <= 3) {
            return name.charAt(0) + "**@" + parts[1];
        }
        return name.substring(0, 3) + "**@" + parts[1];
    }
}
