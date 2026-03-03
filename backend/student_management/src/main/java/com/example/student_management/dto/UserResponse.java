package com.example.student_management.auth.dto;

import com.example.student_management.entity.Role;

public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private String phone;
    private String studentId;
    private String departmentId;

    public UserResponse(Long id, String name, String email,
                        Role role, String phone,
                        String studentId, String departmentId) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.studentId = studentId;
        this.departmentId = departmentId;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public String getPhone() {
        return phone;
    }

    public String getStudentId() {
        return studentId;
    }

    public String getDepartmentId() {
        return departmentId;
    }
}
