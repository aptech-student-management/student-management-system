package com.example.student_management.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @NotBlank(message = "Tên không được để trống")
    @Size(min = 3, message = "Tên phải có ít nhất 3 ký tự")
    private String name;

    @Email(message = "Email không hợp lệ")
    @NotBlank(message = "Email không được để trống")
    private String email;

    @Pattern(
            regexp = "^(0|\\+84)[0-9]{8,9}$",
            message = "Số điện thoại không hợp lệ"
    )
    private String phone;

}
