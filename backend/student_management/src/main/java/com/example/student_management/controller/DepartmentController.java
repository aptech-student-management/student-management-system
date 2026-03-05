package com.example.student_management.controller;

import com.example.student_management.dto.department.DepartmentUpsertRequest;
import com.example.student_management.entity.Department;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.service.DepartmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success(departmentService.getAll(), "Danh sách khoa")
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return ResponseEntity.ok(
                ApiResponse.success(departmentService.getById(id), "Chi tiết khoa")
        );
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody DepartmentUpsertRequest request) {
        Department created = departmentService.create(request);
        return ResponseEntity.ok(
                ApiResponse.success(created, "Tạo khoa thành công")
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @Valid @RequestBody DepartmentUpsertRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(departmentService.update(id, request), "Cập nhật khoa thành công")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        departmentService.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success(null, "Xóa khoa thành công")
        );
    }
}
