package com.example.student_management.service;

import com.example.student_management.dto.ChangePasswordRequest;
import com.example.student_management.dto.UpdateUserRequest;
import com.example.student_management.dto.UserResponse;
import com.example.student_management.dto.admin.AdminUpsertUserRequest;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.SchoolClass;
import com.example.student_management.entity.User;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.SchoolClassRepository;
import com.example.student_management.repository.UserRepository;
import jakarta.transaction.Transactional;
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
    private final DepartmentRepository departmentRepository;
    private final SchoolClassRepository classRepository;

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

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String normalizedName = request.getName().trim();
        String normalizedPhone = request.getPhone() == null ? null : request.getPhone().trim();

        if (!user.getEmail().equals(normalizedEmail)) {

            if (userRepository.existsByEmail(normalizedEmail)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Email đã tồn tại"
                );
            }

            user.setEmail(normalizedEmail);
        }

        user.setName(normalizedName);
        user.setPhone(normalizedPhone == null || normalizedPhone.isBlank() ? null : normalizedPhone);

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

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Mật khẩu mới phải khác mật khẩu cũ"
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

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Chỉ chấp nhận file ảnh");
        }

        if (file.getSize() > 2 * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ảnh đại diện phải nhỏ hơn 2MB");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User không tồn tại"));

        try {
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            Path filePath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            String avatarUrl = "/uploads/" + fileName;
            deleteOldAvatarIfNeeded(user.getAvatarUrl(), uploadPath);

            user.setAvatarUrl(avatarUrl);
            userRepository.save(user);

            return avatarUrl;

        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Upload thất bại");
        }
    }

    private void deleteOldAvatarIfNeeded(String avatarUrl, Path uploadPath) {
        if (avatarUrl == null || avatarUrl.isBlank() || !avatarUrl.startsWith("/uploads/")) {
            return;
        }

        String fileName = avatarUrl.substring("/uploads/".length());
        if (fileName.isBlank()) {
            return;
        }

        try {
            Files.deleteIfExists(uploadPath.resolve(fileName));
        } catch (IOException ignored) {
            // Keep profile update successful even if old file cleanup fails.
        }
    }
    // ADMIN FUNCTIONS

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<UserResponse> getUsersByRole(Role role) {
        return userRepository.findByRole(role)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<UserResponse> getStudentsByClass(String classId) {
        if (!classRepository.existsById(classId)) {
            throw new NotFoundException("Không tìm thấy lớp");
        }

        return userRepository.findBySchoolClass_IdAndRole(classId, Role.STUDENT)
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

        String normalizedStudentId = normalizeStudentId(request.getStudentId(), request.getRole(), true);

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Khoa không tồn tại"));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .department(department)
                .phone(request.getPhone())
                .studentId(normalizedStudentId)
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

        String normalizedStudentId = normalizeStudentId(request.getStudentId(), request.getRole(), false);
        if (normalizedStudentId != null
                && !normalizedStudentId.equals(existing.getStudentId())
                && userRepository.existsByStudentId(normalizedStudentId)) {
            throw new BadRequestException("Mã sinh viên đã tồn tại");
        }

        Department department = null;
        if (request.getDepartmentId() != null) {
            department = departmentRepository.findById(request.getDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Khoa không tồn tại"));
        }

        existing.setName(request.getName());
        existing.setEmail(request.getEmail());
        existing.setRole(request.getRole());
        existing.setDepartment(department); // ✅ FIX
        existing.setPhone(request.getPhone());
        existing.setStudentId(normalizedStudentId);

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
                user.getDepartment() != null ? user.getDepartment().getId() : null,
                user.getSchoolClass() != null ? user.getSchoolClass().getId() : null,
                user.getAvatarUrl()
        );
    }

    private String normalizeStudentId(String studentId, Role role, boolean checkUniqueness) {
        String normalized = studentId == null ? null : studentId.trim();

        if (role != Role.STUDENT) {
            return normalized == null || normalized.isBlank() ? null : normalized;
        }

        if (normalized == null || normalized.isBlank()) {
            throw new BadRequestException("Mã sinh viên không được để trống");
        }

        if (checkUniqueness && userRepository.existsByStudentId(normalized)) {
            throw new BadRequestException("Mã sinh viên đã tồn tại");
        }

        return normalized;
    }
    @Transactional
    public void addStudentToClass(Long studentId, String classId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        SchoolClass schoolClass = classRepository.findById(classId)
                .orElseThrow(() -> new RuntimeException("Class not found"));

        if (student.getRole() != Role.STUDENT) {
            throw new BadRequestException("Chỉ có thể thêm tài khoản sinh viên vào lớp");
        }

        if (schoolClass.getDepartment() == null) {
            throw new BadRequestException("Lớp chưa được gán khoa nên không thể thêm sinh viên");
        }

        if (student.getSchoolClass() != null) {
            student.getSchoolClass().removeStudent(student);
        }

        schoolClass.addStudent(student);
        student.setDepartment(schoolClass.getDepartment());
    }

    @Transactional
    public void removeStudentFromClass(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (student.getSchoolClass() != null) {
            student.getSchoolClass().removeStudent(student);
        }
    }
}
