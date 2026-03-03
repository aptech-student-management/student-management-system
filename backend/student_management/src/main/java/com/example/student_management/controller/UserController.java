package com.example.student_management.auth.controller;



import com.example.student_management.auth.dto.UpdateUserRequest;
import com.example.student_management.auth.dto.UserResponse;
import com.example.student_management.auth.service.UserService;
import com.example.student_management.entity.User;
import com.example.student_management.repository.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.tomcat.util.net.openssl.ciphers.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

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
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(
                userService.updateCurrentUser(request)
        );
    }

    @PostMapping("/me/avatar")
    public ResponseEntity<?> uploadAvatar(
            @RequestParam("file") MultipartFile file) throws IOException {

        String url = userService.uploadAvatar(file);

        return ResponseEntity.ok(
                ApiResponse.success(url, "Upload avatar thành công")
        );
    }

    @PatchMapping("/me")
    public ResponseEntity<?> updateMe(
            @RequestBody UpdateUserRequest request,
            Authentication authentication
    ) {
        String email = authentication.name();
        User updatedUser = userService.updateUser(email, request);
        return ResponseEntity.ok(updatedUser);
    }
}
