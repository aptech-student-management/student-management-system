package com.example.student_management.controller;

import com.example.student_management.entity.AttendanceEntity;
import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.AttendanceRepository;
import com.example.student_management.repository.CourseSectionRepository;
import com.example.student_management.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final CourseSectionRepository courseSectionRepository;

    public AttendanceController(AttendanceRepository attendanceRepository,
                                UserRepository userRepository,
                                CourseSectionRepository courseSectionRepository) {
        this.attendanceRepository = attendanceRepository;
        this.userRepository = userRepository;
        this.courseSectionRepository = courseSectionRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String studentId,
                                    @RequestParam(required = false) String courseSectionId,
                                    @RequestParam(required = false) String date,
                                    org.springframework.security.core.Authentication authentication) {
        User currentUser = getCurrentUser(authentication.getName());
        List<AttendanceEntity> data = resolveAttendanceQuery(studentId, courseSectionId, date, currentUser);

        return ResponseEntity.ok(ApiResponse.success(data, "Danh sách điểm danh"));
    }

    @PostMapping
    public ResponseEntity<?> upsert(@RequestBody AttendanceEntity req,
                                    org.springframework.security.core.Authentication authentication) {
        if (req.getStudentId() == null || req.getStudentId().isBlank()) {
            throw new IllegalArgumentException("studentId không được để trống");
        }
        if (req.getCourseSectionId() == null || req.getCourseSectionId().isBlank()) {
            throw new IllegalArgumentException("courseSectionId không được để trống");
        }
        if (req.getDate() == null) {
            throw new IllegalArgumentException("date không được để trống");
        }
        if (req.getStatus() == null) {
            throw new IllegalArgumentException("status không được để trống");
        }

        User currentUser = getCurrentUser(authentication.getName());
        ensureCanManageSection(currentUser, req.getCourseSectionId());

        AttendanceEntity existing = attendanceRepository
                .findByStudentIdAndCourseSectionIdAndDate(req.getStudentId(), req.getCourseSectionId(), req.getDate())
                .orElse(null);

        if (existing != null) {
            existing.setStatus(req.getStatus());
            AttendanceEntity saved = attendanceRepository.save(existing);
            return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật điểm danh thành công"));
        }

        String id = req.getId();
        if (id == null || id.isBlank()) {
            id = "ATT-" + req.getStudentId() + "-" + req.getCourseSectionId() + "-" + req.getDate();
        }

        AttendanceEntity entity = AttendanceEntity.builder()
                .id(id)
                .studentId(req.getStudentId())
                .courseSectionId(req.getCourseSectionId())
                .date(req.getDate())
                .status(req.getStatus())
                .build();

        AttendanceEntity saved = attendanceRepository.save(entity);
        return ResponseEntity.ok(ApiResponse.success(saved, "Lưu điểm danh thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestBody AttendanceEntity req,
                                    org.springframework.security.core.Authentication authentication) {
        AttendanceEntity existing = attendanceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi điểm danh"));
        User currentUser = getCurrentUser(authentication.getName());
        ensureCanManageSection(currentUser, existing.getCourseSectionId());

        if (req.getStatus() != null) {
            existing.setStatus(req.getStatus());
        }

        AttendanceEntity saved = attendanceRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật điểm danh thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id,
                                    org.springframework.security.core.Authentication authentication) {
        AttendanceEntity existing = attendanceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi điểm danh"));
        User currentUser = getCurrentUser(authentication.getName());
        ensureCanManageSection(currentUser, existing.getCourseSectionId());

        attendanceRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa điểm danh thành công"));
    }

    private List<AttendanceEntity> resolveAttendanceQuery(String studentId,
                                                          String courseSectionId,
                                                          String date,
                                                          User currentUser) {
        if (currentUser.getRole() == Role.ADMIN) {
            return queryAttendance(studentId, courseSectionId, date);
        }

        if (currentUser.getRole() == Role.STUDENT) {
            String effectiveStudentId = currentUser.getStudentId();
            if (effectiveStudentId == null || effectiveStudentId.isBlank()) {
                throw new IllegalArgumentException("Tài khoản sinh viên chưa có mã sinh viên");
            }

            return queryAttendance(effectiveStudentId, courseSectionId, date);
        }

        return queryAttendance(studentId, courseSectionId, date).stream()
                .filter(item -> canAccessSection(currentUser, item.getCourseSectionId()))
                .toList();
    }

    private List<AttendanceEntity> queryAttendance(String studentId,
                                                   String courseSectionId,
                                                   String date) {
        if (courseSectionId != null && !courseSectionId.isBlank() && date != null && !date.isBlank()) {
            return attendanceRepository.findByCourseSectionIdAndDate(courseSectionId, LocalDate.parse(date));
        }
        if (courseSectionId != null && !courseSectionId.isBlank()) {
            if (studentId != null && !studentId.isBlank()) {
                return attendanceRepository.findByStudentIdAndCourseSectionId(studentId, courseSectionId);
            }
            return attendanceRepository.findByCourseSectionId(courseSectionId);
        }
        if (studentId != null && !studentId.isBlank()) {
            return attendanceRepository.findByStudentId(studentId);
        }
        return attendanceRepository.findAll();
    }

    private User getCurrentUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng"));
    }

    private void ensureCanManageSection(User currentUser, String courseSectionId) {
        if (!canAccessSection(currentUser, courseSectionId)) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật điểm danh cho lớp học phần này");
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
