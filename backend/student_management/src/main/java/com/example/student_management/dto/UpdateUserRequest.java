package com.example.student_management.auth.dto;

import jakarta.validation.constraints.*;

public class UpdateUserRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(min = 3, message = "Họ tên ít nhất 3 ký tự")
    private String name;

    @Pattern(
            regexp = "^(0|\\+84)[0-9]{8,9}$",
            message = "Số điện thoại không hợp lệ"
    )
    private String email;

    private String phone;

    private String studentId;

    private String departmentId;

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

    public String getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(String departmentId) {
        this.departmentId = departmentId;
    }
}
