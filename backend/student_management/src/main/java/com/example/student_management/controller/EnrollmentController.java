package com.example.student_management.controller;

import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.entity.EnrollmentEntity;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.CourseSectionRepository;
import com.example.student_management.repository.EnrollmentRepository;
import com.example.student_management.repository.SemesterRepository;
import com.example.student_management.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
public class EnrollmentController {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final SemesterRepository semesterRepository;
    private final UserRepository userRepository;

    public EnrollmentController(EnrollmentRepository enrollmentRepository,
                                CourseSectionRepository courseSectionRepository,
                                SemesterRepository semesterRepository,
                                UserRepository userRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseSectionRepository = courseSectionRepository;
        this.semesterRepository = semesterRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String studentId,
                                    @RequestParam(required = false) String courseSectionId,
                                    @RequestParam(required = false) String status,
                                    org.springframework.security.core.Authentication authentication) {
        User currentUser = getCurrentUser(authentication.getName());
        List<EnrollmentEntity> data = resolveEnrollmentQuery(studentId, courseSectionId, status, currentUser);

        return ResponseEntity.ok(ApiResponse.success(data, "Danh sách đăng ký học phần"));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody EnrollmentEntity req,
                                    org.springframework.security.core.Authentication authentication) {
        if (req.getStudentId() == null || req.getStudentId().isBlank()) {
            throw new IllegalArgumentException("studentId không được để trống");
        }
        if (req.getCourseSectionId() == null || req.getCourseSectionId().isBlank()) {
            throw new IllegalArgumentException("courseSectionId không được để trống");
        }

        User currentUser = getCurrentUser(authentication.getName());
        ensureStudentOwner(currentUser, req.getStudentId());

        CourseSectionEntity section = courseSectionRepository.findById(req.getCourseSectionId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        validateEnrollmentAllowed(req.getStudentId(), section, null);

        EnrollmentEntity existing = enrollmentRepository
                .findByStudentIdAndCourseSectionId(req.getStudentId(), req.getCourseSectionId())
                .orElse(null);

        if (existing != null) {
            if (existing.getStatus() == EnrollmentEntity.Status.ENROLLED) {
                throw new IllegalArgumentException("Sinh viên đã đăng ký lớp học phần này");
            }

            existing.setStatus(EnrollmentEntity.Status.ENROLLED);
            existing.setEnrolledAt(req.getEnrolledAt() == null ? LocalDate.now() : req.getEnrolledAt());
            EnrollmentEntity saved = enrollmentRepository.save(existing);
            syncCourseSectionEnrollment(existing.getCourseSectionId());
            return ResponseEntity.ok(ApiResponse.success(saved, "Đăng ký học phần thành công"));
        }

        String id = req.getId();
        if (id == null || id.isBlank()) {
            id = "ENR-" + req.getStudentId() + "-" + req.getCourseSectionId();
        }

        EnrollmentEntity entity = EnrollmentEntity.builder()
                .id(id)
                .studentId(req.getStudentId())
                .courseSectionId(req.getCourseSectionId())
                .enrolledAt(req.getEnrolledAt() == null ? LocalDate.now() : req.getEnrolledAt())
                .status(EnrollmentEntity.Status.ENROLLED)
                .build();

        EnrollmentEntity saved = enrollmentRepository.save(entity);
        syncCourseSectionEnrollment(entity.getCourseSectionId());
        return ResponseEntity.ok(ApiResponse.success(saved, "Đăng ký học phần thành công"));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestBody EnrollmentEntity req,
                                    org.springframework.security.core.Authentication authentication) {
        EnrollmentEntity existing = enrollmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi đăng ký"));
        User currentUser = getCurrentUser(authentication.getName());
        ensureStudentOwner(currentUser, existing.getStudentId());

        EnrollmentEntity.Status nextStatus = req.getStatus() == null ? existing.getStatus() : req.getStatus();

        if (nextStatus == EnrollmentEntity.Status.ENROLLED
                && existing.getStatus() != EnrollmentEntity.Status.ENROLLED) {
            CourseSectionEntity section = courseSectionRepository.findById(existing.getCourseSectionId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));
            validateEnrollmentAllowed(existing.getStudentId(), section, existing.getCourseSectionId());
        }

        existing.setStatus(nextStatus);
        if (req.getEnrolledAt() != null) {
            existing.setEnrolledAt(req.getEnrolledAt());
        }

        EnrollmentEntity saved = enrollmentRepository.save(existing);
        syncCourseSectionEnrollment(existing.getCourseSectionId());
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật đăng ký học phần thành công"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable String id,
                                    org.springframework.security.core.Authentication authentication) {
        EnrollmentEntity existing = enrollmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi đăng ký"));
        User currentUser = getCurrentUser(authentication.getName());
        ensureStudentOwner(currentUser, existing.getStudentId());

        enrollmentRepository.deleteById(id);
        syncCourseSectionEnrollment(existing.getCourseSectionId());
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa đăng ký học phần thành công"));
    }

    private List<EnrollmentEntity> resolveEnrollmentQuery(String studentId,
                                                          String courseSectionId,
                                                          String status,
                                                          User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return queryEnrollments(studentId, courseSectionId, status);
        }

        if (currentUser.getRole() == Role.STUDENT) {
            String effectiveStudentId = currentUser.getStudentId();
            if (effectiveStudentId == null || effectiveStudentId.isBlank()) {
                throw new IllegalArgumentException("Tài khoản sinh viên chưa có mã sinh viên");
            }

            if (courseSectionId != null && !courseSectionId.isBlank()) {
                return queryEnrollments(effectiveStudentId, courseSectionId, status);
            }

            return queryEnrollments(effectiveStudentId, null, status);
        }

        return queryEnrollments(studentId, courseSectionId, status).stream()
                .filter(item -> canAccessSection(currentUser, item.getCourseSectionId()))
                .toList();
    }

    private List<EnrollmentEntity> queryEnrollments(String studentId,
                                                    String courseSectionId,
                                                    String status) {
        if (studentId != null && !studentId.isBlank() && status != null && !status.isBlank()) {
            return enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentEntity.Status.valueOf(status));
        }
        if (courseSectionId != null && !courseSectionId.isBlank() && status != null && !status.isBlank()) {
            return enrollmentRepository.findByCourseSectionIdAndStatus(courseSectionId, EnrollmentEntity.Status.valueOf(status));
        }
        if (studentId != null && !studentId.isBlank()) {
            return courseSectionId != null && !courseSectionId.isBlank()
                    ? enrollmentRepository.findByStudentIdAndCourseSectionId(studentId, courseSectionId).stream().toList()
                    : enrollmentRepository.findByStudentId(studentId);
        }
        if (courseSectionId != null && !courseSectionId.isBlank()) {
            return enrollmentRepository.findByCourseSectionId(courseSectionId);
        }
        return enrollmentRepository.findAll();
    }

    private void validateEnrollmentAllowed(String studentId,
                                           CourseSectionEntity section,
                                           String currentCourseSectionId) {
        CourseSectionEntity.Status resolvedStatus = resolveSectionStatus(section);

        if (resolvedStatus == CourseSectionEntity.Status.CLOSED) {
            throw new IllegalArgumentException("Lớp học phần đã đóng hoặc học kỳ đã kết thúc");
        }

        if (resolvedStatus == CourseSectionEntity.Status.FULL) {
            throw new IllegalArgumentException("Lớp học phần đã đủ số lượng tối đa");
        }

        if (enrollmentRepository.existsByStudentIdAndCourseSectionIdAndStatus(
                studentId,
                section.getId(),
                EnrollmentEntity.Status.ENROLLED
        )) {
            throw new IllegalArgumentException("Sinh viên đã đăng ký lớp học phần này");
        }

        List<EnrollmentEntity> currentEnrollments = enrollmentRepository
                .findByStudentIdAndStatus(studentId, EnrollmentEntity.Status.ENROLLED);

        for (EnrollmentEntity enrollment : currentEnrollments) {
            if (enrollment.getCourseSectionId().equals(currentCourseSectionId)) {
                continue;
            }

            CourseSectionEntity enrolledSection = courseSectionRepository.findById(enrollment.getCourseSectionId())
                    .orElse(null);

            if (enrolledSection == null) {
                continue;
            }

            boolean sameSemester = enrolledSection.getSemesterId() != null
                    && enrolledSection.getSemesterId().equals(section.getSemesterId());
            boolean sameSchedule = enrolledSection.getSchedule() != null
                    && enrolledSection.getSchedule().equals(section.getSchedule());

            if (sameSemester && sameSchedule) {
                throw new IllegalArgumentException("Sinh viên bị trùng lịch với lớp học phần đã đăng ký");
            }
        }
    }

    private CourseSectionEntity.Status resolveSectionStatus(CourseSectionEntity section) {
        var semester = semesterRepository.findById(section.getSemesterId()).orElse(null);

        if (semester == null) {
            return section.getStatus() == null ? CourseSectionEntity.Status.OPEN : section.getStatus();
        }

        LocalDate today = LocalDate.now();
        if (semester.getEndDate() != null && today.isAfter(semester.getEndDate().toLocalDate())) {
            return CourseSectionEntity.Status.CLOSED;
        }
        if (semester.getStartDate() != null && today.isBefore(semester.getStartDate().toLocalDate())) {
            return CourseSectionEntity.Status.CLOSED;
        }
        if (section.getMaxStudents() != null
                && section.getEnrolledCount() != null
                && section.getEnrolledCount() >= section.getMaxStudents()) {
            return CourseSectionEntity.Status.FULL;
        }

        return CourseSectionEntity.Status.OPEN;
    }

    private void syncCourseSectionEnrollment(String courseSectionId) {
        CourseSectionEntity section = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        int enrolledCount = enrollmentRepository
                .findByCourseSectionIdAndStatus(courseSectionId, EnrollmentEntity.Status.ENROLLED)
                .size();

        section.setEnrolledCount(enrolledCount);
        section.setStatus(resolveSectionStatus(section));
        courseSectionRepository.save(section);
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private void ensureStudentOwner(User currentUser, String studentId) {
        if (currentUser.getRole() != Role.STUDENT) {
            return;
        }
        if (currentUser.getStudentId() == null || !currentUser.getStudentId().equals(studentId)) {
            throw new IllegalArgumentException("Bạn không có quyền thao tác dữ liệu đăng ký của sinh viên khác");
        }
    }

    private boolean canAccessSection(User currentUser, String courseSectionId) {
        if (currentUser.getRole() == Role.ADMIN) {
            return true;
        }

        CourseSectionEntity section = courseSectionRepository.findById(courseSectionId).orElse(null);
        return section != null && currentUser.getId().toString().equals(section.getLecturerId());
    }
}
