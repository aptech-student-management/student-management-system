package com.example.student_management.controller;

import com.example.student_management.dto.ai.EarlyWarningResponse;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.service.ai.EarlyWarningService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EarlyWarningControllerTest {

    @Test
    void getEarlyWarning_shouldReturnSingleStudentResponse_whenStudentIdProvided() {
        EarlyWarningService service = mock(EarlyWarningService.class);
        EarlyWarningController controller = new EarlyWarningController(service);

        EarlyWarningResponse expected = EarlyWarningResponse.builder()
                .studentId("SV001")
                .studentName("Student 1")
                .riskScore(81.2)
                .riskLevel("HIGH")
                .attendanceRate(0.55)
                .failedCourseCount(2)
                .enrolledCourseCount(5)
                .recommendations(List.of("Liên hệ cố vấn"))
                .build();

        when(service.evaluateStudent("SV001")).thenReturn(expected);

        ResponseEntity<?> response = controller.getEarlyWarning("SV001");

        assertEquals(200, response.getStatusCode().value());
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals(expected, body.getData());
    }

    @Test
    void getEarlyWarning_shouldReturnAllStudents_whenStudentIdMissing() {
        EarlyWarningService service = mock(EarlyWarningService.class);
        EarlyWarningController controller = new EarlyWarningController(service);

        List<EarlyWarningResponse> expected = List.of(
                EarlyWarningResponse.builder()
                        .studentId("SV001")
                        .studentName("Student 1")
                        .riskScore(70.0)
                        .riskLevel("HIGH")
                        .attendanceRate(0.6)
                        .failedCourseCount(2)
                        .enrolledCourseCount(4)
                        .recommendations(List.of("Action 1"))
                        .build(),
                EarlyWarningResponse.builder()
                        .studentId("SV002")
                        .studentName("Student 2")
                        .riskScore(30.0)
                        .riskLevel("LOW")
                        .attendanceRate(0.95)
                        .failedCourseCount(0)
                        .enrolledCourseCount(4)
                        .recommendations(List.of("Action 2"))
                        .build()
        );

        when(service.evaluateAllStudents()).thenReturn(expected);

        ResponseEntity<?> response = controller.getEarlyWarning(null);

        assertEquals(200, response.getStatusCode().value());
        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals(expected, body.getData());
    }
}
