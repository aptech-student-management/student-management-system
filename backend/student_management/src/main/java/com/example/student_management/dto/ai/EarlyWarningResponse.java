package com.example.student_management.dto.ai;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class EarlyWarningResponse {
    String studentId;
    String studentName;
    double riskScore;
    String riskLevel;
    double attendanceRate;
    Double averageGpa;
    int failedCourseCount;
    int enrolledCourseCount;
    List<String> recommendations;
}
