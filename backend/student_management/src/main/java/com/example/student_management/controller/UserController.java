package com.example.student_management.controller;



import com.example.student_management.dto.ChangePasswordRequest;
import com.example.student_management.dto.UpdateUserRequest;
import com.example.student_management.dto.UserResponse;
import com.example.student_management.entity.Role;
import com.example.student_management.service.UserService;
import com.example.student_management.repository.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(
                ApiResponse.success(userService.getAllUsers(), "Danh sách người dùng")
        );
    }

    @GetMapping("/lecturers")
    public ResponseEntity<?> getLecturers() {
        return ResponseEntity.ok(
                ApiResponse.success(userService.getUsersByRole(Role.LECTURER), "Danh sách giảng viên")
        );
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(
            @Valid @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication
    ) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/me/avatar")
    public ResponseEntity<String> updateAvatar(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(userService.updateAvatar(email, file));
    }
}
