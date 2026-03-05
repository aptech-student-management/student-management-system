package com.example.student_management.dto.admin;

import com.example.student_management.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUpsertUserRequest {

    @NotBlank(message = "Họ tên không được để trống")
    private String name;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotNull(message = "Vai trò không được để trống")
    private Role role;

    private String departmentId;

    private String phone;

    private String studentId;

    @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
    private String password;
}
