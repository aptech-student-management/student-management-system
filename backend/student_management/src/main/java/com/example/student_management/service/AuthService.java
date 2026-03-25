package com.example.student_management.service;

import com.example.student_management.dto.*;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.RefreshToken;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.UserRepository;
import com.example.student_management.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;

    public boolean checkEmailExists(String email) {

        String normalizedEmail = normalizeEmail(email);

        if (normalizedEmail == null || normalizedEmail.isBlank()) {
            throw badRequest("Email không được để trống");
        }

        return userRepository.existsByEmail(normalizedEmail);
    }

    //register

    public void register(RegisterRequest request) {

        String email = request.getEmail().trim().toLowerCase();
        String studentId = safeTrim(request.getStudentId());

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Email đã tồn tại"
            );
        }

        if (request.getRole() == Role.STUDENT) {
            if (studentId == null || studentId.isBlank()) {
                throw badRequest("Mã sinh viên không được để trống");
            }

            if (userRepository.existsByStudentId(studentId)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Mã sinh viên đã tồn tại"
                );
            }
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> badRequest("Khoa không tồn tại"));

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .department(department)
                .phone(safeTrim(request.getPhone()))
                .studentId(request.getRole() == Role.STUDENT ? studentId : null)
                .build();

        userRepository.save(user);
    }

    //login

    public JwtResponse login(LoginRequest request) {

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Email hoặc mật khẩu không đúng"
            );
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Người dùng không tồn tại"
                        )
                );

        String accessToken = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name()
        );

        RefreshToken refreshToken =
                refreshTokenService.createRefreshToken(user.getEmail());

        return new JwtResponse(
                accessToken,
                refreshToken.getToken()
        );
    }

    //util

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String safeTrim(String value) {
        return value == null ? null : value.trim();
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
