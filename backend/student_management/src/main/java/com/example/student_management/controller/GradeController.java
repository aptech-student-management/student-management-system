package com.example.student_management.controller;

import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.entity.GradeEntity;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.CourseSectionRepository;
import com.example.student_management.repository.GradeRepository;
import com.example.student_management.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/grades")
public class GradeController {

    private final GradeRepository gradeRepository;
    private final UserRepository userRepository;
    private final CourseSectionRepository courseSectionRepository;

    public GradeController(GradeRepository gradeRepository,
                           UserRepository userRepository,
                           CourseSectionRepository courseSectionRepository) {
        this.gradeRepository = gradeRepository;
        this.userRepository = userRepository;
        this.courseSectionRepository = courseSectionRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String studentId,
                                    @RequestParam(required = false) String courseSectionId,
                                    org.springframework.security.core.Authentication authentication) {
        User currentUser = getCurrentUser(authentication.getName());
        List<GradeEntity> data = resolveGradeQuery(studentId, courseSectionId, currentUser);

        return ResponseEntity.ok(ApiResponse.success(data, "Danh sách điểm"));
    }

    @PostMapping
    public ResponseEntity<?> upsert(@RequestBody GradeEntity req,
                                    org.springframework.security.core.Authentication authentication) {
        if (req.getStudentId() == null || req.getStudentId().isBlank()) {
            throw new IllegalArgumentException("studentId không được để trống");
        }
        if (req.getCourseSectionId() == null || req.getCourseSectionId().isBlank()) {
            throw new IllegalArgumentException("courseSectionId không được để trống");
        }

        User currentUser = getCurrentUser(authentication.getName());
        ensureCanManageSection(currentUser, req.getCourseSectionId());

        GradeEntity existing = gradeRepository
                .findByStudentIdAndCourseSectionId(req.getStudentId(), req.getCourseSectionId())
                .orElse(null);

        if (existing != null) {
            applyGradeChanges(existing, req, currentUser);
            GradeEntity saved = gradeRepository.save(existing);
            return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật điểm thành công"));
        }

        String id = req.getId();
        if (id == null || id.isBlank()) {
            id = "GRD-" + req.getStudentId() + "-" + req.getCourseSectionId();
        }

        GradeEntity entity = GradeEntity.builder()
                .id(id)
                .studentId(req.getStudentId())
                .courseSectionId(req.getCourseSectionId())
                .midterm(req.getMidterm())
                .finalScore(req.getFinalScore())
                .attendanceScore(req.getAttendanceScore())
                .totalScore(req.getTotalScore())
                .letterGrade(req.getLetterGrade())
                .gpaPoint(req.getGpaPoint())
                .updatedBy(currentUser.getId().toString())
                .updatedAt(Instant.now())
                .build();

        GradeEntity saved = gradeRepository.save(entity);
        return ResponseEntity.ok(ApiResponse.success(saved, "Lưu điểm thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestBody GradeEntity req,
                                    org.springframework.security.core.Authentication authentication) {
        GradeEntity existing = gradeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi điểm"));
        User currentUser = getCurrentUser(authentication.getName());
        ensureCanManageSection(currentUser, existing.getCourseSectionId());

        applyGradeChanges(existing, req, currentUser);

        GradeEntity saved = gradeRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật điểm thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id,
                                    org.springframework.security.core.Authentication authentication) {
        GradeEntity existing = gradeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi điểm"));
        User currentUser = getCurrentUser(authentication.getName());
        ensureCanManageSection(currentUser, existing.getCourseSectionId());

        gradeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa điểm thành công"));
    }

    private List<GradeEntity> resolveGradeQuery(String studentId,
                                                String courseSectionId,
                                                User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return queryGrades(studentId, courseSectionId);
        }

        if (currentUser.getRole() == Role.STUDENT) {
            String effectiveStudentId = currentUser.getStudentId();
            if (effectiveStudentId == null || effectiveStudentId.isBlank()) {
                throw new IllegalArgumentException("Tài khoản sinh viên chưa có mã sinh viên");
            }

            return queryGrades(effectiveStudentId, courseSectionId);
        }

        return queryGrades(studentId, courseSectionId).stream()
                .filter(item -> canAccessSection(currentUser, item.getCourseSectionId()))
                .toList();
    }

    private List<GradeEntity> queryGrades(String studentId, String courseSectionId) {
        if (studentId != null && !studentId.isBlank() && courseSectionId != null && !courseSectionId.isBlank()) {
            GradeEntity item = gradeRepository.findByStudentIdAndCourseSectionId(studentId, courseSectionId)
                    .orElse(null);
            return item == null ? List.of() : List.of(item);
        }
        if (studentId != null && !studentId.isBlank()) {
            return gradeRepository.findByStudentId(studentId);
        }
        if (courseSectionId != null && !courseSectionId.isBlank()) {
            return gradeRepository.findByCourseSectionId(courseSectionId);
        }
        return gradeRepository.findAll();
    }

    private void applyGradeChanges(GradeEntity target, GradeEntity source, User currentUser) {
        target.setMidterm(source.getMidterm());
        target.setFinalScore(source.getFinalScore());
        target.setAttendanceScore(source.getAttendanceScore());
        target.setTotalScore(source.getTotalScore());
        target.setLetterGrade(source.getLetterGrade());
        target.setGpaPoint(source.getGpaPoint());
        target.setUpdatedBy(currentUser.getId().toString());
        target.setUpdatedAt(Instant.now());
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private void ensureCanManageSection(User currentUser, String courseSectionId) {
        if (!canAccessSection(currentUser, courseSectionId)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật điểm cho lớp học phần này");
        }
    }

    private boolean canAccessSection(User currentUser, String courseSectionId) {
        if (currentUser.getRole() == Role.ADMIN) {
            return true;
        }

        CourseSectionEntity section = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        return currentUser.getRole() == Role.LECTURER
                ? currentUser.getId().toString().equals(section.getLecturerId())
                : currentUser.getStudentId() != null;
    }
}
