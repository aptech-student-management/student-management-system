package com.example.student_management.controller;

import com.example.student_management.entity.GradeEntity;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.GradeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/grades")
public class                                                                            GradeController {

    private final GradeRepository gradeRepository;

    public GradeController(GradeRepository gradeRepository) {
        this.gradeRepository = gradeRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll(@RequestParam(required = false) String studentId,
                                    @RequestParam(required = false) String courseSectionId) {
        List<GradeEntity> data;

        if (studentId != null && !studentId.isBlank() && courseSectionId != null && !courseSectionId.isBlank()) {
            GradeEntity item = gradeRepository.findByStudentIdAndCourseSectionId(studentId, courseSectionId)
                    .orElse(null);
            data = item == null ? List.of() : List.of(item);
        } else if (studentId != null && !studentId.isBlank()) {
            data = gradeRepository.findByStudentId(studentId);
        } else if (courseSectionId != null && !courseSectionId.isBlank()) {
            data = gradeRepository.findByCourseSectionId(courseSectionId);
        } else {
            data = gradeRepository.findAll();
        }

        return ResponseEntity.ok(ApiResponse.success(data, "Danh sách điểm"));
    }

    @PostMapping
    public ResponseEntity<?> upsert(@RequestBody GradeEntity req) {
        if (req.getStudentId() == null || req.getStudentId().isBlank()) {
            throw new IllegalArgumentException("studentId không được để trống");
        }
        if (req.getCourseSectionId() == null || req.getCourseSectionId().isBlank()) {
            throw new IllegalArgumentException("courseSectionId không được để trống");
        }

        GradeEntity existing = gradeRepository
                .findByStudentIdAndCourseSectionId(req.getStudentId(), req.getCourseSectionId())
                .orElse(null);

        if (existing != null) {
            existing.setMidterm(req.getMidterm());
            existing.setFinalScore(req.getFinalScore());
            existing.setAttendanceScore(req.getAttendanceScore());
            existing.setTotalScore(req.getTotalScore());
            existing.setLetterGrade(req.getLetterGrade());
            existing.setGpaPoint(req.getGpaPoint());
            existing.setUpdatedBy(req.getUpdatedBy());
            existing.setUpdatedAt(Instant.now());
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
                .updatedBy(req.getUpdatedBy())
                .updatedAt(Instant.now())
                .build();

        GradeEntity saved = gradeRepository.save(entity);
        return ResponseEntity.ok(ApiResponse.success(saved, "Lưu điểm thành công"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody GradeEntity req) {
        GradeEntity existing = gradeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy bản ghi điểm"));

        existing.setMidterm(req.getMidterm());
        existing.setFinalScore(req.getFinalScore());
        existing.setAttendanceScore(req.getAttendanceScore());
        existing.setTotalScore(req.getTotalScore());
        existing.setLetterGrade(req.getLetterGrade());
        existing.setGpaPoint(req.getGpaPoint());
        existing.setUpdatedBy(req.getUpdatedBy());
        existing.setUpdatedAt(Instant.now());

        GradeEntity saved = gradeRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.success(saved, "Cập nhật điểm thành công"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        if (!gradeRepository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy bản ghi điểm");
        }
        gradeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Xóa điểm thành công"));
    }
}
