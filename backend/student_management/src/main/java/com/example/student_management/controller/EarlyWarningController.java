package com.example.student_management.controller;

import com.example.student_management.repository.ApiResponse;
import com.example.student_management.service.ai.EarlyWarningService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/early-warning")
public class EarlyWarningController {

    private final EarlyWarningService earlyWarningService;

    public EarlyWarningController(EarlyWarningService earlyWarningService) {
        this.earlyWarningService = earlyWarningService;
    }

    @GetMapping
    public ResponseEntity<?> getEarlyWarning(@RequestParam(required = false) String studentId) {
        if (studentId != null && !studentId.isBlank()) {
            return ResponseEntity.ok(ApiResponse.success(
                    earlyWarningService.evaluateStudent(studentId),
                    "Kết quả cảnh báo sớm cho sinh viên"
            ));
        }

        return ResponseEntity.ok(ApiResponse.success(
                earlyWarningService.evaluateAllStudents(),
                "Danh sách cảnh báo sớm cho sinh viên"
        ));
    }
}
