package com.example.student_management.controller;

import com.example.student_management.dto.schoolclass.SchoolClassCreateRequest;
import com.example.student_management.dto.schoolclass.SchoolClassResponse;
import com.example.student_management.dto.schoolclass.SchoolClassUpdateRequest;
import com.example.student_management.service.SchoolClassService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/classes")
public class SchoolClassController {

    private final SchoolClassService service;

    public SchoolClassController(SchoolClassService service) {
        this.service = service;
    }

    // GET ALL
    @GetMapping
    public List<SchoolClassResponse> getAll() {
        return service.getAll();
    }

    // GET ONE
    @GetMapping("/{id}")
    public SchoolClassResponse getById(@PathVariable String id) {
        return service.getById(id);
    }

    // CREATE
    @PostMapping
    public ResponseEntity<SchoolClassResponse> create(@Valid @RequestBody SchoolClassCreateRequest req) {
        SchoolClassResponse created = service.create(req);
        return ResponseEntity.created(URI.create("/api/classes/" + created.id)).body(created);
    }

    // UPDATE
    @PutMapping("/{id}")
    public SchoolClassResponse update(@PathVariable String id, @Valid @RequestBody SchoolClassUpdateRequest req) {
        return service.update(id, req);
    }

    // DELETE
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
