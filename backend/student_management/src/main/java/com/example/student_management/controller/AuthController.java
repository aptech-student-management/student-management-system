package com.example.student_management.controller;

import com.example.student_management.dto.*;
import com.example.student_management.entity.BlacklistedToken;
import com.example.student_management.entity.RefreshRequest;
import com.example.student_management.entity.RefreshToken;
import com.example.student_management.repository.UserRepository;
import com.example.student_management.service.AuthService;
import com.example.student_management.service.RefreshTokenService;
import com.example.student_management.repository.RefreshTokenRepository;
import com.example.student_management.repository.BlacklistedTokenRepository;
import com.example.student_management.security.JwtUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RefreshTokenService refreshTokenService;
    private final BlacklistedTokenRepository blacklistedTokenRepository;
    private final JwtUtil jwtUtil;
    private UserRepository userService;

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @Valid @RequestBody RegisterRequest request) {

        authService.register(request);
        return ResponseEntity.status(201).build();
    }

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> login(
            @Valid @RequestBody LoginRequest request) {

        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<JwtResponse> refresh(@RequestBody RefreshRequest request) {

        RefreshToken refreshToken = refreshTokenRepository
                .findByToken(request.getRefreshToken())
                .orElseThrow(() ->
                        new RuntimeException("Refresh token không tồn tại"));

        refreshTokenService.verifyExpiration(refreshToken);

        String newAccessToken = jwtUtil.generateToken(
                refreshToken.getUser().getEmail(),
                refreshToken.getUser().getRole().name()
        );

        return ResponseEntity.ok(
                new JwtResponse(newAccessToken, refreshToken.getToken())
        );
    }

//    @PostMapping("/logout")
//    public ResponseEntity<?> logout(HttpServletRequest request) {
//
//        String token = extractToken(request);
//
//        blacklistedTokenRepository.save(
//                BlacklistedToken.builder()
//                        .token(token)
//                        .expiryDate(jwtUtil.extractExpiration(token).toInstant())
//                        .build()
//        );
//
//        return ResponseEntity.ok().build();
//    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(
            @RequestParam String email
    ) {
        boolean exists = authService.checkEmailExists(email);

        return ResponseEntity.ok(
                Map.of("exists", exists)
        );
    }

}