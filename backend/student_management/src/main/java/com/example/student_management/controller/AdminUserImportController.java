package com.example.student_management.controller;

import com.example.student_management.dto.importing.StudentImportApplyRequest;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.service.importing.StudentImportService;
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
@RequestMapping("/api/admin/user-imports")
@RequiredArgsConstructor
public class AdminUserImportController {

    private final StudentImportService studentImportService;

    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> preview(@RequestParam("file") MultipartFile file,
                                     @RequestParam(value = "defaultRole", required = false) String defaultRole) {
        return ResponseEntity.ok(ApiResponse.success(
                studentImportService.preview(file, defaultRole),
                "Đã tạo bản xem trước import tài khoản"
        ));
    }

    @PostMapping("/apply")
    public ResponseEntity<?> apply(@RequestBody StudentImportApplyRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                studentImportService.apply(request),
                "Import tài khoản thành công"
        ));
    }
}
