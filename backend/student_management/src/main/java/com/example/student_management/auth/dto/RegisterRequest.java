package com.example.student_management.auth.dto;


import jakarta.validation.constraints.*;

import com.example.student_management.entity.Role;

public class RegisterRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 3, message = "Họ tên phải ít nhất 3 ký tự")
    private String name;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải ít nhất 6 ký tự")
    @Pattern(
            regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
            message = "Mật khẩu phải chứa cả chữ và số"
    )
    private String password;

    @NotNull(message = "Vai trò không được để trống")
    private Role role;

    @NotBlank(message = "Khoa không được để trống")
    private String departmentId;

    @Pattern(
            regexp = "^(0|\\+84)[0-9]{8,9}$",
            message = "Số điện thoại không hợp lệ"
    )
    private String phone;

    private String studentId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public com.example.student_management.entity.Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStudentId() {
        return studentId;
    }

    public void setStudentId(String studentId) {
        this.studentId = studentId;
    }
}