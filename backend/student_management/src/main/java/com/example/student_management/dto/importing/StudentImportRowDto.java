package com.example.student_management.dto.importing;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StudentImportRowDto {
    private Integer rowNumber;
    private String name;
    private String email;
    private String role;
    private String studentId;
    private String departmentId;
    private String phone;
    private String operation;
    private boolean ready;
    private List<String> issues = new ArrayList<>();
}
