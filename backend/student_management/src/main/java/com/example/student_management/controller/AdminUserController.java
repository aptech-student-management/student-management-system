package com.example.student_management.controller;

import com.example.student_management.dto.admin.AdminUpsertUserRequest;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success(userService.getAllUsers(), "Danh sách user")
        );
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody AdminUpsertUserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(userService.createUserByAdmin(request), "Tạo user thành công")
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id,
                                    @Valid @RequestBody AdminUpsertUserRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(userService.updateUserByAdmin(id, request), "Cập nhật user thành công")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(
                ApiResponse.success(null, "Xoá user thành công")
        );
    }
}
