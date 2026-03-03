package com.example.student_management.auth.controller;

import com.example.student_management.entity.SemesterEntity;
import com.example.student_management.repository.SemesterRepository;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/semesters")
public class SemesterController {

    private final SemesterRepository repo;

    public SemesterController(SemesterRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<SemesterEntity> getAll() {
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public SemesterEntity getById(@PathVariable String id) {
        return repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy học kỳ: " + id));
    }

    @PostMapping
    public SemesterEntity create(@RequestBody SemesterEntity req) {
        if (repo.existsById(req.getId())) {
            throw new IllegalArgumentException("ID học kỳ đã tồn tại: " + req.getId());
        }
        return repo.save(req);
    }

    @PutMapping("/{id}")
    public SemesterEntity update(@PathVariable String id, @RequestBody SemesterEntity req) {
        SemesterEntity existing = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy học kỳ: " + id));

        existing.setName(req.getName());
        existing.setAcademicYear(req.getAcademicYear());
        existing.setStartDate(req.getStartDate());
        existing.setEndDate(req.getEndDate());
        existing.setStatus(req.getStatus());
        return repo.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        if (!repo.existsById(id)) throw new IllegalArgumentException("Không tìm thấy học kỳ: " + id);
        repo.deleteById(id);
    }
}
