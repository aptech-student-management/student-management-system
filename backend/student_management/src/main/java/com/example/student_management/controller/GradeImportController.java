package com.example.student_management.controller;

import com.example.student_management.dto.importing.GradeImportApplyRequest;
import com.example.student_management.entity.User;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.UserRepository;
import com.example.student_management.service.importing.GradeImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/grades/imports")
@RequiredArgsConstructor
public class GradeImportController {

    private final GradeImportService gradeImportService;
    private final UserRepository userRepository;

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> preview(@RequestParam("file") MultipartFile file,
                                     @RequestParam String courseSectionId,
                                     org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                gradeImportService.preview(file, courseSectionId, getCurrentUser(authentication.getName())),
                "Đã tạo bản xem trước import điểm"
        ));
    }

    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody GradeImportApplyRequest request,
                                   org.springframework.security.core.Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                gradeImportService.apply(request, getCurrentUser(authentication.getName())),
                "Import điểm thành công"
        ));
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }
}
