package com.example.student_management.dto.importing;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StudentImportApplyRequest {
    private List<StudentImportRowDto> rows = new ArrayList<>();
    private String defaultPassword;
    private String defaultRole;
}
