package com.example.student_management.auth.controller;

import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.repository.CourseSectionRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-sections")
public class CourseSectionController {

    private final CourseSectionRepository repo;

    public CourseSectionController(CourseSectionRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<CourseSectionEntity> getAll() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public CourseSectionEntity getById(@PathVariable String id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lớp học phần: " + id));
    }

    @PostMapping
    public CourseSectionEntity create(@RequestBody CourseSectionEntity req) {
        if (repo.existsById(req.getId())) {
            throw new IllegalArgumentException("ID lớp học phần đã tồn tại: " + req.getId());
        }
        if (req.getEnrolledCount() == null) req.setEnrolledCount(0);
        if (req.getStatus() == null) req.setStatus(CourseSectionEntity.Status.OPEN);
        return repo.save(req);
    }

    @PutMapping("/{id}")
    public CourseSectionEntity update(@PathVariable String id, @RequestBody CourseSectionEntity req) {
        CourseSectionEntity existing = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy lớp học phần: " + id));

        existing.setSubjectId(req.getSubjectId());
        existing.setSemesterId(req.getSemesterId());
        existing.setLecturerId(req.getLecturerId());
        existing.setClassId(req.getClassId());
        existing.setSchedule(req.getSchedule());
        existing.setRoom(req.getRoom());
        existing.setMaxStudents(req.getMaxStudents());
        // enrolledCount thường không cho sửa bằng tay, nhưng nếu bạn muốn:
        existing.setEnrolledCount(req.getEnrolledCount());
        existing.setStatus(req.getStatus());
        return repo.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        if (!repo.existsById(id)) throw new IllegalArgumentException("Không tìm thấy lớp học phần: " + id);
        repo.deleteById(id);
    }
}
