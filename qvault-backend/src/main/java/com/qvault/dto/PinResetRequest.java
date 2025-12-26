package com.qvault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PinResetRequest {

    @NotBlank(message = "New PIN is required")
    @Size(min = 4, max = 10, message = "PIN must be 4-10 characters")
    private String newPin;
}
