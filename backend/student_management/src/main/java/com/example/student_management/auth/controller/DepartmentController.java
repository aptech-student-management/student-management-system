package com.example.student_management.auth.controller;

import com.example.student_management.auth.dto.department.DepartmentRequest;
import com.example.student_management.auth.dto.department.DepartmentResponse;
import com.example.student_management.auth.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/department")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    public List<DepartmentResponse> getAll() {
        return departmentService.getAll();
    }

    @GetMapping("/{id}")
    public DepartmentResponse getById(@PathVariable Long id) {
        return departmentService.getById(id);
    }

    @PostMapping
    public DepartmentResponse create(@RequestBody DepartmentRequest request) {
        return departmentService.create(request);
    }

    @PutMapping("/{id}")
    public DepartmentResponse update(
            @PathVariable Long id,
            @RequestBody DepartmentRequest request
    ) {
        return departmentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        departmentService.delete(id);
    }
}
