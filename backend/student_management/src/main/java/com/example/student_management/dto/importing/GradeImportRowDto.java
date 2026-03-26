package com.example.student_management.dto.importing;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class GradeImportRowDto {
    private Integer rowNumber;
    private String studentId;
    private String studentName;
    private Double attendanceScore;
    private Double midterm;
    private Double finalScore;
    private Double totalScore;
    private String letterGrade;
    private Double gpaPoint;
    private String operation;
    private boolean ready;
    private List<String> issues = new ArrayList<>();
}
