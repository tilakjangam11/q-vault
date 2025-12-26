package com.qvault.controller;

import com.google.firebase.auth.FirebaseAuthException;
import com.qvault.dto.AuthResponse;
import com.qvault.model.User;
import com.qvault.security.UserPrincipal;
import com.qvault.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.qvault.dto.RegisterRequest;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * 
 * Handles:
 * - User registration
 * - Token verification
 * - Email OTP for sensitive operations
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * Register new user
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody RegisterRequest request,
            HttpServletRequest servletRequest) {
        try {
            String token = authHeader.substring(7);
            String ipAddress = servletRequest.getRemoteAddr();

            User user = authService.registerUser(
                    token,
                    request.getUsername(),
                    request.getFirstName(),
                    request.getLastName(),
                    ipAddress);

            AuthResponse response = AuthResponse.builder()
                    .userId(user.getId().toString())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .displayName(user.getDisplayName())
                    .firstName(user.getFirstName())
                    .lastName(user.getLastName())
                    .emailVerified(user.getEmailVerified())
                    .message("Registration successful. Please verify your email.")
                    .build();

            return ResponseEntity.ok(response);

        } catch (FirebaseAuthException e) {
            log.error("Registration failed: Invalid token", e);
            return ResponseEntity.status(401).body(AuthResponse.builder().message("Invalid token").build());
        } catch (Exception e) {
            log.error("Registration failed", e);
            return ResponseEntity.badRequest().body(AuthResponse.builder().message(e.getMessage()).build());
        }
    }

    /**
     * Verify Firebase token and authenticate user
     * Step 1 of 2FA: Verifies credentials, returns pending status for OTP
     */
    @PostMapping("/verify-token")
    public ResponseEntity<AuthResponse> verifyToken(
            @RequestHeader("Authorization") String authHeader,
            HttpServletRequest request) {
        try {
            String token = authHeader.substring(7);
            String ipAddress = request.getRemoteAddr();

            User user = authService.verifyTokenAndGetUser(token, ipAddress);

            AuthResponse response = AuthResponse.builder()
                    .userId(user.getId().toString())
                    .email(user.getEmail())
                    .username(user.getUsername())
                    .displayName(user.getDisplayName())
                    .emailVerified(user.getEmailVerified())
                    .message("Credentials verified. OTP required.")
                    .build();

            return ResponseEntity.ok(response);

        } catch (FirebaseAuthException e) {
            log.error("Token verification failed", e);
            return ResponseEntity.status(401).body(
                    AuthResponse.builder()
                            .message("Invalid or expired token")
                            .build());
        }
    }

    /**
     * Send Login OTP for 2FA
     * Step 2a of 2FA: Sends OTP to user's email
     */
    @PostMapping("/login/send-otp")
    public ResponseEntity<AuthResponse> sendLoginOTP(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            authService.sendLoginOTP(token);

            return ResponseEntity.ok(AuthResponse.builder()
                    .message("Login OTP sent to your email")
                    .build());
        } catch (Exception e) {
            log.error("Failed to send login OTP", e);
            return ResponseEntity.status(500).body(AuthResponse.builder()
                    .message("Failed to send OTP")
                    .build());
        }
    }

    /**
     * Verify Login OTP for 2FA
     * Step 2b of 2FA: Verifies OTP and completes login
     */
    @PostMapping("/login/verify-otp")
    public ResponseEntity<AuthResponse> verifyLoginOTP(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String otp,
            HttpServletRequest request) {
        try {
            String token = authHeader.substring(7);
            String ipAddress = request.getRemoteAddr();

            User user = authService.verifyLoginOTPAndGetUser(token, otp, ipAddress);

            if (user != null) {
                AuthResponse response = AuthResponse.builder()
                        .userId(user.getId().toString())
                        .email(user.getEmail())
                        .username(user.getUsername())
                        .displayName(user.getDisplayName())
                        .firstName(user.getFirstName())
                        .lastName(user.getLastName())
                        .emailVerified(user.getEmailVerified())
                        .message("Login successful")
                        .build();
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(401).body(AuthResponse.builder()
                        .message("Invalid or expired OTP")
                        .build());
            }
        } catch (Exception e) {
            log.error("Login OTP verification failed", e);
            return ResponseEntity.status(401).body(AuthResponse.builder()
                    .message("OTP verification failed")
                    .build());
        }
    }

    /**
     * Get current user info
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        User user = authService.getUserByFirebaseUid(principal.getUid());

        AuthResponse response = AuthResponse.builder()
                .userId(user.getId().toString())
                .email(user.getEmail())
                .username(user.getUsername())
                .displayName(user.getDisplayName())
                .emailVerified(user.getEmailVerified())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * Send OTP to user's email (for sensitive operations like decryption)
     */
    @PostMapping("/send-otp")
    public ResponseEntity<AuthResponse> sendOTP(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            authService.sendOTP(token);

            return ResponseEntity.ok(AuthResponse.builder()
                    .message("OTP sent to your email")
                    .build());
        } catch (Exception e) {
            log.error("Failed to send OTP", e);
            return ResponseEntity.status(500).body(AuthResponse.builder()
                    .message("Failed to send OTP")
                    .build());
        }
    }

    /**
     * Verify OTP
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOTP(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String otp) {
        try {
            String token = authHeader.substring(7);
            boolean valid = authService.verifyOTP(token, otp);

            if (valid) {
                return ResponseEntity.ok(AuthResponse.builder()
                        .message("OTP verified successfully")
                        .build());
            } else {
                return ResponseEntity.status(401).body(AuthResponse.builder()
                        .message("Invalid or expired OTP")
                        .build());
            }

        } catch (Exception e) {
            log.error("OTP verification failed", e);
            return ResponseEntity.status(401).body(AuthResponse.builder()
                    .message("OTP verification failed")
                    .build());
        }
    }
}
