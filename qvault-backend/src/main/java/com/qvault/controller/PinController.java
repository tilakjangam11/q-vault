package com.qvault.controller;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.qvault.dto.AuthResponse;
import com.qvault.dto.OTPVerifyRequest;
import com.qvault.dto.PinResetRequest;
import com.qvault.dto.SetPinRequest;
import com.qvault.dto.VerifyPinRequest;
import com.qvault.service.PinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * PIN Controller
 * 
 * Handles workspace PIN management:
 * - Set PIN
 * - Verify PIN
 * - PIN status check
 * - OTP-protected PIN reset
 */
@Slf4j
@RestController
@RequestMapping("/api/pin")
@RequiredArgsConstructor
public class PinController {

    private final FirebaseAuth firebaseAuth;
    private final PinService pinService;

    /**
     * Check if user has a PIN set
     */
    @GetMapping("/status")
    public ResponseEntity<AuthResponse> getPinStatus(@RequestHeader("Authorization") String authHeader) {
        try {
            String uid = extractUid(authHeader);
            boolean hasPin = pinService.hasPin(uid);

            return ResponseEntity.ok(AuthResponse.builder()
                    .message(hasPin ? "PIN is set" : "PIN not set")
                    .build());
        } catch (Exception e) {
            log.error("Failed to check PIN status", e);
            return ResponseEntity.status(401).body(AuthResponse.builder()
                    .message("Authentication failed")
                    .build());
        }
    }

    /**
     * Set a new workspace PIN
     */
    @PostMapping("/set")
    public ResponseEntity<AuthResponse> setPin(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody SetPinRequest request) {
        try {
            String uid = extractUid(authHeader);
            pinService.setPin(uid, request.getPin());

            return ResponseEntity.ok(AuthResponse.builder()
                    .message("PIN set successfully")
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message(e.getMessage())
                    .build());
        } catch (Exception e) {
            log.error("Failed to set PIN", e);
            return ResponseEntity.status(500).body(AuthResponse.builder()
                    .message("Failed to set PIN")
                    .build());
        }
    }

    /**
     * Verify PIN for workspace access
     */
    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verifyPin(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody VerifyPinRequest request) {
        try {
            String uid = extractUid(authHeader);
            boolean valid = pinService.verifyPin(uid, request.getPin());

            if (valid) {
                return ResponseEntity.ok(AuthResponse.builder()
                        .message("PIN verified successfully")
                        .build());
            } else {
                return ResponseEntity.status(401).body(AuthResponse.builder()
                        .message("Invalid PIN")
                        .build());
            }
        } catch (Exception e) {
            log.error("PIN verification failed", e);
            return ResponseEntity.status(500).body(AuthResponse.builder()
                    .message("PIN verification failed")
                    .build());
        }
    }

    /**
     * Send OTP for PIN reset
     */
    @PostMapping("/reset/send-otp")
    public ResponseEntity<AuthResponse> sendPinResetOTP(@RequestHeader("Authorization") String authHeader) {
        try {
            String uid = extractUid(authHeader);
            pinService.sendPinResetOTP(uid);

            return ResponseEntity.ok(AuthResponse.builder()
                    .message("OTP sent to your email")
                    .build());
        } catch (Exception e) {
            log.error("Failed to send PIN reset OTP", e);
            return ResponseEntity.status(500).body(AuthResponse.builder()
                    .message("Failed to send OTP")
                    .build());
        }
    }

    /**
     * Verify OTP for PIN reset
     */
    @PostMapping("/reset/verify-otp")
    public ResponseEntity<AuthResponse> verifyPinResetOTP(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody OTPVerifyRequest request) {
        try {
            String uid = extractUid(authHeader);
            boolean valid = pinService.verifyPinResetOTP(uid, request.getOtp());

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
            return ResponseEntity.status(500).body(AuthResponse.builder()
                    .message("OTP verification failed")
                    .build());
        }
    }

    /**
     * Reset PIN after OTP verification
     */
    @PostMapping("/reset")
    public ResponseEntity<AuthResponse> resetPin(
            @RequestHeader("Authorization") String authHeader,
            @Valid @RequestBody PinResetRequest request) {
        try {
            String uid = extractUid(authHeader);
            pinService.resetPin(uid, request.getNewPin());

            return ResponseEntity.ok(AuthResponse.builder()
                    .message("PIN reset successfully")
                    .build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(AuthResponse.builder()
                    .message(e.getMessage())
                    .build());
        } catch (Exception e) {
            log.error("Failed to reset PIN", e);
            return ResponseEntity.status(500).body(AuthResponse.builder()
                    .message("Failed to reset PIN")
                    .build());
        }
    }

    /**
     * Extract Firebase UID from Authorization header
     */
    private String extractUid(String authHeader) throws FirebaseAuthException {
        String token = authHeader.substring(7);
        FirebaseToken decodedToken = firebaseAuth.verifyIdToken(token);
        return decodedToken.getUid();
    }
}
