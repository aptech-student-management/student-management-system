package com.example.student_management.auth.dto;

import jakarta.validation.constraints.*;

import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank
    private String oldPassword;

    @NotBlank
    @Size(min = 6)
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Mật khẩu phải chứa chữ và số"
    )
    private String newPassword;
}