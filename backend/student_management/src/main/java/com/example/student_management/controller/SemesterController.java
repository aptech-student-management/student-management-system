package com.example.student_management.controller;

import com.example.student_management.entity.SemesterEntity;
import com.example.student_management.repository.SemesterRepository;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
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
        return repo.findAll().stream()
                .map(this::applyResolvedStatus)
                .toList();
    }

    @GetMapping("/{id}")
    public SemesterEntity getById(@PathVariable String id) {
        return repo.findById(id)
                .map(this::applyResolvedStatus)
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
        req.setStatus(resolveSemesterStatus(req));
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
        existing.setStatus(resolveSemesterStatus(existing));
        return repo.save(existing);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable String id) {
        if (!repo.existsById(id)) throw new IllegalArgumentException("Không tìm thấy học kỳ: " + id);
        repo.deleteById(id);
    }

    private SemesterEntity applyResolvedStatus(SemesterEntity semester) {
        semester.setStatus(resolveSemesterStatus(semester));
        return semester;
    }

    private SemesterEntity.SemesterStatus resolveSemesterStatus(SemesterEntity semester) {
        LocalDate today = LocalDate.now();
        LocalDate startDate = semester.getStartDate() == null ? null : semester.getStartDate().toLocalDate();
        LocalDate endDate = semester.getEndDate() == null ? null : semester.getEndDate().toLocalDate();

        if (startDate == null || endDate == null) {
            return semester.getStatus() == null ? SemesterEntity.SemesterStatus.UPCOMING : semester.getStatus();
        }

        if (today.isBefore(startDate)) {
            return SemesterEntity.SemesterStatus.UPCOMING;
        }

        if (today.isAfter(endDate)) {
            return SemesterEntity.SemesterStatus.CLOSED;
        }

        return SemesterEntity.SemesterStatus.ACTIVE;
    }
}
