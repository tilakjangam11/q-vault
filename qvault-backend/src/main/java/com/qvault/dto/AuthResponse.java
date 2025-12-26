package com.qvault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String userId;
    private String email;
    private String username;
    private String displayName;
    private String firstName;
    private String lastName;
    private Boolean emailVerified;
    private String token;
    private String refreshToken;
    private String message;
}
