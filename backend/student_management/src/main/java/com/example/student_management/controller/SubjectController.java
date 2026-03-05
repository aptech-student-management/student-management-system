package com.example.student_management.controller;

import com.example.student_management.dto.subject.SubjectCreateRequest;
import com.example.student_management.dto.subject.SubjectResponse;
import com.example.student_management.dto.subject.SubjectUpdateRequest;
import com.example.student_management.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService service;

    public SubjectController(SubjectService service) {
        this.service = service;
    }

    @GetMapping
    public List<SubjectResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public SubjectResponse getById(@PathVariable String id) {
        return service.getById(id);
    }

    @PostMapping
    public ResponseEntity<SubjectResponse> create(@Valid @RequestBody SubjectCreateRequest req) {
        SubjectResponse created = service.create(req);
        return ResponseEntity.created(URI.create("/api/subjects/" + created.id)).body(created);
    }

    @PutMapping("/{id}")
    public SubjectResponse update(@PathVariable String id, @Valid @RequestBody SubjectUpdateRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
