package com.example.student_management.dto;

import com.example.student_management.entity.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private String phone;
    private String studentId;
    private String departmentId;
    private String avatarUrl;

    public UserResponse(Long id, String name, String email, Role role, String phone, String studentId, String departmentId, String avatarUrl) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.phone = phone;
        this.studentId = studentId;
        this.departmentId = departmentId;
        this.avatarUrl = avatarUrl;
    }
}
