package com.qvault.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Email Service for OTP Delivery
 * 
 * Handles sending OTP codes via email for secure file operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:qvault@example.com}")
    private String fromEmail;

    @Value("${app.name:Q-Vault}")
    private String appName;

    /**
     * Send OTP email to the user
     * 
     * @param toEmail Recipient email address
     * @param otp     The OTP code to send
     * @param purpose Purpose of the OTP (e.g., "file encryption", "file
     *                decryption", "account verification")
     */
    @Async
    public void sendOTPEmail(String toEmail, String otp, String purpose) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Q-Vault Security");
            helper.setTo(toEmail);
            helper.setSubject("🔐 " + appName + " - Your Security Code");

            String htmlContent = buildOTPEmailTemplate(otp, purpose);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ OTP email sent successfully to: {}", maskEmail(toEmail));

        } catch (MessagingException e) {
            log.error("❌ Failed to send OTP email to: {}", maskEmail(toEmail), e);
            throw new RuntimeException("Failed to send OTP email. Please try again.", e);
        } catch (java.io.UnsupportedEncodingException e) {
            log.error("❌ Encoding error for email to: {}", maskEmail(toEmail), e);
            throw new RuntimeException("Failed to send OTP email. Please try again.", e);
        }
    }

    /**
     * Send Login OTP email for 2FA
     * 
     * @param toEmail Recipient email address
     * @param otp     The 6-digit OTP code
     */
    @Async
    public void sendLoginOTPEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Q-Vault Security");
            helper.setTo(toEmail);
            helper.setSubject("Q-Vault Login OTP Verification");

            String htmlContent = buildLoginOTPEmailTemplate(otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Login OTP email sent successfully to: {}", maskEmail(toEmail));

        } catch (MessagingException e) {
            log.error("❌ Failed to send login OTP email to: {}", maskEmail(toEmail), e);
            throw new RuntimeException("Failed to send OTP email. Please try again.", e);
        } catch (java.io.UnsupportedEncodingException e) {
            log.error("❌ Encoding error for email to: {}", maskEmail(toEmail), e);
            throw new RuntimeException("Failed to send OTP email. Please try again.", e);
        }
    }

    /**
     * Send PIN Reset OTP email
     * 
     * @param toEmail Recipient email address
     * @param otp     The 6-digit OTP code
     */
    @Async
    public void sendPinResetOTPEmail(String toEmail, String otp) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Q-Vault Security");
            helper.setTo(toEmail);
            helper.setSubject("Q-Vault PIN Reset OTP");

            String htmlContent = buildPinResetOTPEmailTemplate(otp);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ PIN Reset OTP email sent successfully to: {}", maskEmail(toEmail));

        } catch (MessagingException e) {
            log.error("❌ Failed to send PIN reset OTP email to: {}", maskEmail(toEmail), e);
            throw new RuntimeException("Failed to send OTP email. Please try again.", e);
        } catch (java.io.UnsupportedEncodingException e) {
            log.error("❌ Encoding error for email to: {}", maskEmail(toEmail), e);
            throw new RuntimeException("Failed to send OTP email. Please try again.", e);
        }
    }

    /**
     * Build HTML email template for OTP
     */
    private String buildOTPEmailTemplate(String otp, String purpose) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 16px; border-radius: 16px;">
                                <span style="font-size: 32px;">🔐</span>
                            </div>
                            <h1 style="color: #f8fafc; margin-top: 20px; font-size: 28px; font-weight: 700;">Q-Vault Security Code</h1>
                        </div>

                        <!-- Main Content Card -->
                        <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                            <p style="color: #94a3b8; font-size: 16px; margin: 0 0 24px 0;">
                                You requested a security code for <strong style="color: #f8fafc;">%s</strong>. Use the code below to proceed:
                            </p>

                            <!-- OTP Code Box -->
                            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                                <div style="font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                                    %s
                                </div>
                            </div>

                            <!-- Expiry Notice -->
                            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 24px 0;">
                                <p style="color: #f59e0b; font-size: 14px; margin: 0; text-align: center;">
                                    ⏰ This code expires in <strong>5 minutes</strong>
                                </p>
                            </div>

                            <!-- Security Warning -->
                            <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
                                🛡️ <strong>Security Notice:</strong> Never share this code with anyone. Q-Vault will never ask for your OTP via phone or chat.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; color: #64748b; font-size: 12px;">
                            <p style="margin: 0 0 8px 0;">This email was sent by Q-Vault Quantum-Safe Encryption Platform</p>
                            <p style="margin: 0;">If you didn't request this code, please ignore this email.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(purpose, otp);
    }

    /**
     * Build HTML email template for Login OTP
     */
    private String buildLoginOTPEmailTemplate(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 16px; border-radius: 16px;">
                                <span style="font-size: 32px;">🔑</span>
                            </div>
                            <h1 style="color: #f8fafc; margin-top: 20px; font-size: 28px; font-weight: 700;">Login Verification</h1>
                        </div>

                        <!-- Main Content Card -->
                        <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                            <p style="color: #94a3b8; font-size: 16px; margin: 0 0 24px 0;">
                                Enter the code below to complete your <strong style="color: #f8fafc;">Q-Vault login</strong>:
                            </p>

                            <!-- OTP Code Box -->
                            <div style="background: linear-gradient(135deg, #10b981, #059669); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                                <div style="font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                                    %s
                                </div>
                            </div>

                            <!-- Expiry Notice -->
                            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 24px 0;">
                                <p style="color: #f59e0b; font-size: 14px; margin: 0; text-align: center;">
                                    ⏰ This code expires in <strong>5 minutes</strong>
                                </p>
                            </div>

                            <!-- Security Warning -->
                            <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
                                🛡️ <strong>Security Notice:</strong> If you didn't attempt to login, please secure your account immediately.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; color: #64748b; font-size: 12px;">
                            <p style="margin: 0 0 8px 0;">This email was sent by Q-Vault Quantum-Safe Encryption Platform</p>
                            <p style="margin: 0;">If you didn't request this code, please ignore this email.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(otp);
    }

    /**
     * Build HTML email template for PIN Reset OTP
     */
    private String buildPinResetOTPEmailTemplate(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        <!-- Header -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); padding: 16px; border-radius: 16px;">
                                <span style="font-size: 32px;">🔒</span>
                            </div>
                            <h1 style="color: #f8fafc; margin-top: 20px; font-size: 28px; font-weight: 700;">PIN Reset Request</h1>
                        </div>

                        <!-- Main Content Card -->
                        <div style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 1px solid #334155; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                            <p style="color: #94a3b8; font-size: 16px; margin: 0 0 24px 0;">
                                Enter the code below to <strong style="color: #f8fafc;">reset your workspace PIN</strong>:
                            </p>

                            <!-- OTP Code Box -->
                            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                                <div style="font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: 12px; font-family: 'Courier New', monospace;">
                                    %s
                                </div>
                            </div>

                            <!-- Expiry Notice -->
                            <div style="background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; margin: 24px 0;">
                                <p style="color: #f59e0b; font-size: 14px; margin: 0; text-align: center;">
                                    ⏰ This code expires in <strong>5 minutes</strong>
                                </p>
                            </div>

                            <!-- Security Warning -->
                            <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
                                🛡️ <strong>Security Notice:</strong> If you didn't request a PIN reset, please ignore this email and secure your account.
                            </p>
                        </div>

                        <!-- Footer -->
                        <div style="text-align: center; color: #64748b; font-size: 12px;">
                            <p style="margin: 0 0 8px 0;">This email was sent by Q-Vault Quantum-Safe Encryption Platform</p>
                            <p style="margin: 0;">If you didn't request this code, please ignore this email.</p>
                        </div>
                    </div>
                </body>
                </html>
                """
                .formatted(otp);
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
