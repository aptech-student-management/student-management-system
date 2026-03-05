package com.example.student_management.controller;

import com.example.student_management.dto.coursesection.CourseSectionCreateRequest;
import com.example.student_management.dto.coursesection.CourseSectionUpdateRequest;
import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.CourseSectionRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/course-sections")
public class CourseSectionController {

    private final CourseSectionRepository repository;

    public CourseSectionController(CourseSectionRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success(repository.findAll(), "Danh sách lớp học phần")
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        CourseSectionEntity section = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        return ResponseEntity.ok(ApiResponse.success(section, "Chi tiết lớp học phần"));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CourseSectionCreateRequest req) {
        if (req.id == null || req.id.isBlank()) {
            req.id = generateCourseSectionId();
        }

        if (repository.existsById(req.id)) {
            throw new IllegalArgumentException("ID lớp học phần đã tồn tại");
        }

        CourseSectionEntity entity = CourseSectionEntity.builder()
                .id(req.id)
                .subjectId(req.subjectId)
                .semesterId(req.semesterId)
                .lecturerId(req.lecturerId)
                .classId(req.classId)
                .schedule(req.schedule)
                .room(req.room)
                .maxStudents(req.maxStudents)
                .enrolledCount(req.enrolledCount == null ? 0 : req.enrolledCount)
                .status(req.status)
                .build();

        return ResponseEntity.ok(
                ApiResponse.success(repository.save(entity), "Tạo lớp học phần thành công")
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @Valid @RequestBody CourseSectionUpdateRequest req) {
        CourseSectionEntity existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        existing.setSubjectId(req.subjectId);
        existing.setSemesterId(req.semesterId);
        existing.setLecturerId(req.lecturerId);
        existing.setClassId(req.classId);
        existing.setSchedule(req.schedule);
        existing.setRoom(req.room);
        existing.setMaxStudents(req.maxStudents);
        existing.setEnrolledCount(req.enrolledCount == null ? existing.getEnrolledCount() : req.enrolledCount);
        existing.setStatus(req.status);

        return ResponseEntity.ok(
                ApiResponse.success(repository.save(existing), "Cập nhật lớp học phần thành công")
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Không tìm thấy lớp học phần");
        }
        repository.deleteById(id);

        return ResponseEntity.ok(
                ApiResponse.success(null, "Xóa lớp học phần thành công")
        );
    }

    private String generateCourseSectionId() {
        String candidate;
        do {
            String base36 = Long.toString(System.currentTimeMillis(), 36).toUpperCase();
            String suffix = base36.length() > 7 ? base36.substring(base36.length() - 7) : base36;
            candidate = "CS" + suffix;
            if (candidate.length() > 10) {
                candidate = candidate.substring(0, 10);
            }
        } while (repository.existsById(candidate));

        return candidate;
    }
}
