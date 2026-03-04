package com.example.student_management.auth.service;

import com.example.student_management.auth.dto.department.DepartmentRequest;
import com.example.student_management.auth.dto.department.DepartmentResponse;
import com.example.student_management.entity.Department;
import com.example.student_management.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public List<DepartmentResponse> getAll() {

        return departmentRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public DepartmentResponse getById(Long id) {

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        return toResponse(department);
    }

    public DepartmentResponse create(DepartmentRequest request) {

        Department department = Department.builder()
                .name(request.getName())
                .code(request.getCode())
                .headLecturerId(request.getHeadLecturerId())
                .description(request.getDescription())
                .build();

        return toResponse(departmentRepository.save(department));
    }

    public DepartmentResponse update(Long id, DepartmentRequest request) {

        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        department.setName(request.getName());
        department.setCode(request.getCode());
        department.setHeadLecturerId(request.getHeadLecturerId());
        department.setDescription(request.getDescription());

        return toResponse(departmentRepository.save(department));
    }

    public void delete(Long id) {
        departmentRepository.deleteById(id);
    }

    private DepartmentResponse toResponse(Department department) {

        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .code(department.getCode())
                .headLecturerId(department.getHeadLecturerId())
                .studentCount(department.getStudentCount())
                .subjectCount(department.getSubjectCount())
                .description(department.getDescription())
                .build();
    }
}
