package com.example.student_management.controller;

import com.example.student_management.entity.EnrollmentEntity;
import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.CourseSectionRepository;
import com.example.student_management.repository.EnrollmentRepository;
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

    public EnrollmentController(EnrollmentRepository enrollmentRepository,
                                CourseSectionRepository courseSectionRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseSectionRepository = courseSectionRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String studentId,
                                    @RequestParam(required = false) String courseSectionId,
                                    @RequestParam(required = false) String status) {
        List<EnrollmentEntity> data;

        if (studentId != null && !studentId.isBlank() && status != null && !status.isBlank()) {
            data = enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentEntity.Status.valueOf(status));
        } else if (courseSectionId != null && !courseSectionId.isBlank() && status != null && !status.isBlank()) {
            data = enrollmentRepository.findByCourseSectionIdAndStatus(courseSectionId, EnrollmentEntity.Status.valueOf(status));
        } else if (studentId != null && !studentId.isBlank()) {
            data = enrollmentRepository.findByStudentId(studentId);
        } else if (courseSectionId != null && !courseSectionId.isBlank()) {
            data = enrollmentRepository.findByCourseSectionId(courseSectionId);
        } else {
            data = enrollmentRepository.findAll();
        }

        return ResponseEntity.ok(ApiResponse.success(data, "Danh sách đăng ký học phần"));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> create(@RequestBody EnrollmentEntity req) {
        if (req.getStudentId() == null || req.getStudentId().isBlank()) {
            throw new IllegalArgumentException("studentId không được để trống");
        }
        if (req.getCourseSectionId() == null || req.getCourseSectionId().isBlank()) {
            throw new IllegalArgumentException("courseSectionId không được để trống");
        }

        var section = courseSectionRepository.findById(req.getCourseSectionId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        EnrollmentEntity.Status nextStatus = req.getStatus() == null
                ? EnrollmentEntity.Status.ENROLLED
                : req.getStatus();

        if (nextStatus == EnrollmentEntity.Status.ENROLLED
                && section.getMaxStudents() != null
                && section.getEnrolledCount() != null
                && section.getEnrolledCount() >= section.getMaxStudents()) {
            throw new IllegalArgumentException("Lớp học phần đã đủ số lượng tối đa");
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
                .status(nextStatus)
                .build();

        EnrollmentEntity saved = enrollmentRepository.save(entity);
        syncCourseSectionEnrollment(entity.getCourseSectionId());
        return ResponseEntity.ok(ApiResponse.success(saved, "Đăng ký học phần thành công"));
    }

    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody EnrollmentEntity req) {
        EnrollmentEntity existing = enrollmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi đăng ký"));

        if (req.getStatus() == EnrollmentEntity.Status.ENROLLED
                && existing.getStatus() != EnrollmentEntity.Status.ENROLLED) {
            var section = courseSectionRepository.findById(existing.getCourseSectionId())
                    .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

            if (section.getMaxStudents() != null
                    && section.getEnrolledCount() != null
                    && section.getEnrolledCount() >= section.getMaxStudents()) {
                throw new IllegalArgumentException("Lớp học phần đã đủ số lượng tối đa");
            }
        }

        if (req.getStatus() != null) {
            existing.setStatus(req.getStatus());
        }
        if (req.getEnrolledAt() != null) {
            existing.setEnrolledAt(req.getEnrolledAt());
        }

        EnrollmentEntity saved = enrollmentRepository.save(existing);
        syncCourseSectionEnrollment(existing.getCourseSectionId());
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật đăng ký học phần thành công"));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable String id) {
        EnrollmentEntity existing = enrollmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi đăng ký"));

        enrollmentRepository.deleteById(id);
        syncCourseSectionEnrollment(existing.getCourseSectionId());
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa đăng ký học phần thành công"));
    }

    private void syncCourseSectionEnrollment(String courseSectionId) {
        var section = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        int enrolledCount = enrollmentRepository
                .findByCourseSectionIdAndStatus(courseSectionId, EnrollmentEntity.Status.ENROLLED)
                .size();

        section.setEnrolledCount(enrolledCount);

        if (section.getStatus() != CourseSectionEntity.Status.CLOSED
                && section.getMaxStudents() != null) {
            section.setStatus(enrolledCount >= section.getMaxStudents()
                    ? CourseSectionEntity.Status.FULL
                    : CourseSectionEntity.Status.OPEN);
        }

        courseSectionRepository.save(section);
    }
}
