package com.example.student_management.controller;

import com.example.student_management.entity.AttendanceEntity;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.AttendanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceRepository attendanceRepository;

    public AttendanceController(AttendanceRepository attendanceRepository) {
        this.attendanceRepository = attendanceRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String studentId,
                                    @RequestParam(required = false) String courseSectionId,
                                    @RequestParam(required = false) String date) {
        List<AttendanceEntity> data;

        if (courseSectionId != null && !courseSectionId.isBlank() && date != null && !date.isBlank()) {
            data = attendanceRepository.findByCourseSectionIdAndDate(courseSectionId, LocalDate.parse(date));
        } else if (courseSectionId != null && !courseSectionId.isBlank()) {
            data = attendanceRepository.findByCourseSectionId(courseSectionId);
        } else if (studentId != null && !studentId.isBlank() && courseSectionId != null && !courseSectionId.isBlank()) {
            data = attendanceRepository.findByStudentIdAndCourseSectionId(studentId, courseSectionId);
        } else if (studentId != null && !studentId.isBlank()) {
            data = attendanceRepository.findByStudentId(studentId);
        } else {
            data = attendanceRepository.findAll();
        }

        return ResponseEntity.ok(ApiResponse.success(data, "Danh sách điểm danh"));
    }

    @PostMapping
    public ResponseEntity<?> upsert(@RequestBody AttendanceEntity req) {
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
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody AttendanceEntity req) {
        AttendanceEntity existing = attendanceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi điểm danh"));

        if (req.getStatus() != null) {
            existing.setStatus(req.getStatus());
        }

        AttendanceEntity saved = attendanceRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật điểm danh thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        if (!attendanceRepository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy bản ghi điểm danh");
        }
        attendanceRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa điểm danh thành công"));
    }
}
