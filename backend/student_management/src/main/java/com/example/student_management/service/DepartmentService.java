package com.example.student_management.service;

import com.example.student_management.dto.department.DepartmentUpsertRequest;
import com.example.student_management.entity.Department;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.DepartmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public List<Department> getAll() {
        return departmentRepository.findAll();
    }

    public Department getById(String id) {
        return departmentRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khoa"));
    }

    @Transactional
    public Department create(DepartmentUpsertRequest request) {
        String id = request.getId();
        if (id == null || id.isBlank()) {
            throw new BadRequestException("ID khoa không được để trống");
        }

        if (departmentRepository.existsById(Long.valueOf(id))) {
            throw new BadRequestException("ID khoa đã tồn tại");
        }
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Mã khoa đã tồn tại");
        }

        Department department = new Department();
        department.setId(id);
        department.setName(request.getName());
        department.setCode(request.getCode());
        department.setHeadLecturerId(request.getHeadLecturerId());
        department.setDescription(request.getDescription());
        department.setStudentCount(0);
        department.setSubjectCount(0);

        return departmentRepository.save(department);
    }

    @Transactional
    public Department update(String id, DepartmentUpsertRequest request) {
        Department existing = departmentRepository.findById(Long.valueOf(id))
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khoa"));

        if (!existing.getCode().equals(request.getCode())
                && departmentRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Mã khoa đã tồn tại");
        }

        existing.setName(request.getName());
        existing.setCode(request.getCode());
        existing.setHeadLecturerId(request.getHeadLecturerId());
        existing.setDescription(request.getDescription());

        return departmentRepository.save(existing);
    }

    @Transactional
    public void delete(String id) {
        if (!departmentRepository.existsById(Long.valueOf(id))) {
            throw new NotFoundException("Không tìm thấy khoa");
        }
        departmentRepository.deleteById(Long.valueOf(id));
    }
}
