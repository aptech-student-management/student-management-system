package com.example.student_management.controller;

import com.example.student_management.repository.ApiResponse;
import com.example.student_management.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classes")
@RequiredArgsConstructor
public class ClassStudentController {

    private final UserService userService;

    @GetMapping("/{classId}/students")
    public ResponseEntity<?> getStudentsByClass(@PathVariable String classId) {
        return ResponseEntity.ok(
                ApiResponse.success(
                        userService.getStudentsByClass(classId),
                        "Danh sách học sinh của lớp"
                )
        );
    }

    @PutMapping("/{classId}/students/{studentId}")
    public ResponseEntity<?> addStudentToClass(
            @PathVariable String classId,
            @PathVariable Long studentId
    ) {
        userService.addStudentToClass(studentId, classId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{classId}/students/{studentId}")
    public ResponseEntity<?> removeStudentFromClass(
            @PathVariable String classId,
            @PathVariable Long studentId
    ) {
        userService.removeStudentFromClass(studentId);
        return ResponseEntity.ok().build();
    }
}
