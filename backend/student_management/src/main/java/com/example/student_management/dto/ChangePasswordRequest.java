package com.example.student_management.dto;

import jakarta.validation.constraints.*;

import lombok.Data;

@Data
public class ChangePasswordRequest {


    @NotBlank(message = "Mật khẩu cũ không được để trống")
    private String oldPassword;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6)
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Mật khẩu phải chứa chữ và số"
    )
    private String newPassword;
}
