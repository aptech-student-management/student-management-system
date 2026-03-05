package com.example.student_management.controller;



import com.example.student_management.dto.ChangePasswordRequest;
import com.example.student_management.dto.UpdateUserRequest;
import com.example.student_management.dto.UserResponse;
import com.example.student_management.service.UserService;
import com.example.student_management.entity.User;
import com.example.student_management.repository.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

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
        String avatarUrl = userService.updateAvatar(email, file);
        return ResponseEntity.ok(avatarUrl);
    }
}
