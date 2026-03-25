package com.example.student_management.controller;

import com.example.student_management.dto.coursesection.CourseSectionCreateRequest;
import com.example.student_management.dto.coursesection.CourseSectionUpdateRequest;
import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.repository.CourseSectionRepository;
import com.example.student_management.repository.SemesterRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Objects;

@RestController
@RequestMapping("/api/course-sections")
public class CourseSectionController {

    private final CourseSectionRepository repository;
    private final SemesterRepository semesterRepository;

    public CourseSectionController(CourseSectionRepository repository,
                                  SemesterRepository semesterRepository) {
        this.repository = repository;
        this.semesterRepository = semesterRepository;
    }

    @GetMapping
    public ResponseEntity<?> getAll() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        repository.findAll().stream().map(this::applyResolvedStatus).toList(),
                        "Danh sách lớp học phần"
                )
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        CourseSectionEntity section = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        return ResponseEntity.ok(ApiResponse.success(applyResolvedStatus(section), "Chi tiết lớp học phần"));
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody CourseSectionCreateRequest req) {
        if (req.id == null || req.id.isBlank()) {
            req.id = generateCourseSectionId();
        }

        if (repository.existsById(req.id)) {
            throw new IllegalArgumentException("ID lớp học phần đã tồn tại");
        }

        validateCourseSectionRequest(
                req.semesterId,
                req.lecturerId,
                req.classId,
                req.schedule,
                req.maxStudents,
                req.enrolledCount == null ? 0 : req.enrolledCount,
                null
        );

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
                .status(CourseSectionEntity.Status.OPEN)
                .build();

        entity.setStatus(resolveSectionStatus(entity));

        return ResponseEntity.ok(
                ApiResponse.success(repository.save(entity), "Tạo lớp học phần thành công")
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @Valid @RequestBody CourseSectionUpdateRequest req) {
        CourseSectionEntity existing = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        validateCourseSectionRequest(
                req.semesterId,
                req.lecturerId,
                req.classId,
                req.schedule,
                req.maxStudents,
                req.enrolledCount == null ? existing.getEnrolledCount() : req.enrolledCount,
                existing
        );

        existing.setSubjectId(req.subjectId);
        existing.setSemesterId(req.semesterId);
        existing.setLecturerId(req.lecturerId);
        existing.setClassId(req.classId);
        existing.setSchedule(req.schedule);
        existing.setRoom(req.room);
        existing.setMaxStudents(req.maxStudents);
        existing.setEnrolledCount(req.enrolledCount == null ? existing.getEnrolledCount() : req.enrolledCount);
        existing.setStatus(resolveSectionStatus(existing));

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

    private void validateCourseSectionRequest(String semesterId,
                                              String lecturerId,
                                              String classId,
                                              String schedule,
                                              Integer maxStudents,
                                              Integer enrolledCount,
                                              CourseSectionEntity existing) {
        if (schedule == null || !schedule.matches("^\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}-\\d{2}:\\d{2}$")) {
            throw new IllegalArgumentException("Lịch học phải theo định dạng yyyy-MM-dd HH:mm-HH:mm");
        }

        var semester = semesterRepository.findById(semesterId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy học kỳ"));

        if (semester.getEndDate() != null
                && LocalDate.now().isAfter(semester.getEndDate().toLocalDate())) {
            throw new IllegalArgumentException("Không thể mở hoặc cập nhật lớp học phần cho học kỳ đã kết thúc");
        }

        if (maxStudents == null || maxStudents <= 0) {
            throw new IllegalArgumentException("Sĩ số tối đa phải lớn hơn 0");
        }

        if (enrolledCount != null && enrolledCount > maxStudents) {
            throw new IllegalArgumentException("Sĩ số đăng ký không thể lớn hơn sĩ số tối đa");
        }

        boolean classScheduleConflict = repository.existsBySemesterIdAndClassIdAndSchedule(semesterId, classId, schedule);
        boolean lecturerScheduleConflict = repository.existsBySemesterIdAndLecturerIdAndSchedule(semesterId, lecturerId, schedule);

        if (existing != null) {
            boolean sameClassSchedule = Objects.equals(semesterId, existing.getSemesterId())
                    && Objects.equals(classId, existing.getClassId())
                    && Objects.equals(schedule, existing.getSchedule());
            boolean sameLecturerSchedule = Objects.equals(semesterId, existing.getSemesterId())
                    && Objects.equals(lecturerId, existing.getLecturerId())
                    && Objects.equals(schedule, existing.getSchedule());

            if (!sameClassSchedule && classScheduleConflict) {
                throw new IllegalArgumentException("Lớp đã có lịch học trùng trong cùng học kỳ");
            }
            if (!sameLecturerSchedule && lecturerScheduleConflict) {
                throw new IllegalArgumentException("Giảng viên đã có lịch dạy trùng trong cùng học kỳ");
            }
            return;
        }

        if (classScheduleConflict) {
            throw new IllegalArgumentException("Lớp đã có lịch học trùng trong cùng học kỳ");
        }
        if (lecturerScheduleConflict) {
            throw new IllegalArgumentException("Giảng viên đã có lịch dạy trùng trong cùng học kỳ");
        }
    }

    private CourseSectionEntity applyResolvedStatus(CourseSectionEntity section) {
        section.setStatus(resolveSectionStatus(section));
        return section;
    }

    private CourseSectionEntity.Status resolveSectionStatus(CourseSectionEntity section) {
        var semester = semesterRepository.findById(section.getSemesterId()).orElse(null);

        if (semester == null) {
            return section.getStatus() == null ? CourseSectionEntity.Status.OPEN : section.getStatus();
        }

        boolean semesterClosed = semester.getEndDate() != null
                && LocalDate.now().isAfter(semester.getEndDate().toLocalDate());
        boolean semesterNotStarted = semester.getStartDate() != null
                && LocalDate.now().isBefore(semester.getStartDate().toLocalDate());

        if (semesterClosed || semesterNotStarted) {
            return CourseSectionEntity.Status.CLOSED;
        }

        if (section.getMaxStudents() != null
                && section.getEnrolledCount() != null
                && section.getEnrolledCount() >= section.getMaxStudents()) {
            return CourseSectionEntity.Status.FULL;
        }

        return CourseSectionEntity.Status.OPEN;
    }
}
