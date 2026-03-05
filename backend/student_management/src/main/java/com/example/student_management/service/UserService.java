package com.example.student_management.service;

import com.example.student_management.dto.ChangePasswordRequest;
import com.example.student_management.dto.UpdateUserRequest;
import com.example.student_management.dto.UserResponse;
import com.example.student_management.dto.admin.AdminUpsertUserRequest;
import com.example.student_management.entity.User;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    // CURRENT USER

    public UserResponse getCurrentUser() {
        User user = getAuthenticatedUser();
        return mapToResponse(user);
    }

    public void updateProfile(String email, UpdateUserRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (!user.getEmail().equals(request.getEmail())) {

            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Email đã tồn tại"
                );
            }

            user.setEmail(request.getEmail());
        }

        user.setName(request.getName());
        user.setPhone(request.getPhone());

        userRepository.save(user);
    }

    public void changePassword(String email, ChangePasswordRequest request) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        if (!passwordEncoder.matches(
                request.getOldPassword(),
                user.getPassword()
        )) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mật khẩu cũ không đúng"
            );
        }

        user.setPassword(
                passwordEncoder.encode(request.getNewPassword())
        );

        userRepository.save(user);
    }

    // AVATAR UPLOAD

    public String updateAvatar(String email, MultipartFile file) {

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File không được rỗng");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));

        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            Path uploadPath = Paths.get("uploads");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/uploads/" + fileName;

            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            return avatarUrl;

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Upload thất bại");
        }
    }
    // ADMIN FUNCTIONS

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public UserResponse createUserByAdmin(AdminUpsertUserRequest request) {
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new BadRequestException("Mật khẩu không được để trống khi tạo user");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã tồn tại");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .departmentId(request.getDepartmentId())
                .phone(request.getPhone())
                .studentId(request.getStudentId())
                .avatarUrl(null)
                .build();

        return mapToResponse(userRepository.save(user));
    }

    public UserResponse updateUserByAdmin(Long id, AdminUpsertUserRequest request) {
        User existing = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy user"));

        if (!existing.getEmail().equals(request.getEmail())
                && userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email đã tồn tại");
        }

        existing.setName(request.getName());
        existing.setEmail(request.getEmail());
        existing.setRole(request.getRole());
        existing.setDepartmentId(request.getDepartmentId());
        existing.setPhone(request.getPhone());
        existing.setStudentId(request.getStudentId());

        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            existing.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        return mapToResponse(userRepository.save(existing));
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy user");
        }
        userRepository.deleteById(id);
    }

    // INTERNAL METHODS

    private User getAuthenticatedUser() {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getPhone(),
                user.getStudentId(),
                user.getDepartmentId(),
                user.getAvatarUrl()
        );
    }
}