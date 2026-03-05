package com.example.student_management.controller;

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
        if (req.getId() == null || req.getId().isBlank()) {
            req.setId(generateSemesterId());
        }

        if (repo.existsById(req.getId())) {
            throw new IllegalArgumentException("ID học kỳ đã tồn tại: " + req.getId());
        }
        return repo.save(req);
    }

    private String generateSemesterId() {
        String candidate;
        do {
            String base36 = Long.toString(System.currentTimeMillis(), 36).toUpperCase();
            String suffix = base36.length() > 8 ? base36.substring(base36.length() - 8) : base36;
            candidate = "SEM" + suffix;
            if (candidate.length() > 10) {
                candidate = candidate.substring(0, 10);
            }
        } while (repo.existsById(candidate));

        return candidate;
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
