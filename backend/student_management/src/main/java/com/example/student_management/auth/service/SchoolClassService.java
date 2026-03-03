package com.example.student_management.auth.service;

import com.example.student_management.auth.dto.schoolclass.SchoolClassCreateRequest;
import com.example.student_management.auth.dto.schoolclass.SchoolClassResponse;
import com.example.student_management.auth.dto.schoolclass.SchoolClassUpdateRequest;
import com.example.student_management.entity.SchoolClass;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.SchoolClassRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SchoolClassService {

    private final SchoolClassRepository classRepo;
    private final DepartmentRepository deptRepo;

    public SchoolClassService(SchoolClassRepository classRepo, DepartmentRepository deptRepo) {
        this.classRepo = classRepo;
        this.deptRepo = deptRepo;
    }

    public List<SchoolClassResponse> getAll() {
        return classRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SchoolClassResponse getById(String id) {
        SchoolClass c = classRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp: " + id));
        return toResponse(c);
    }

    @Transactional
    public SchoolClassResponse create(SchoolClassCreateRequest req) {
        if (classRepo.existsById(req.id)) {
            throw new BadRequestException("ID lớp đã tồn tại: " + req.id);
        }
        if (classRepo.existsByCode(req.code)) {
            throw new BadRequestException("Mã lớp đã tồn tại: " + req.code);
        }
        if (!deptRepo.existsById(req.departmentId)) {
            throw new NotFoundException("Không tìm thấy khoa: " + req.departmentId);
        }

        SchoolClass c = SchoolClass.builder()
                .id(req.id)
                .name(req.name)
                .code(req.code)
                .departmentId(req.departmentId)
                .year(req.year)
                .studentCount(req.studentCount == null ? 0 : req.studentCount)
                .build();

        return toResponse(classRepo.save(c));
    }

    @Transactional
    public SchoolClassResponse update(String id, SchoolClassUpdateRequest req) {
        SchoolClass existing = classRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp: " + id));

        // check unique code nếu đổi code
        classRepo.findByCode(req.code).ifPresent(found -> {
            if (!found.getId().equals(id)) {
                throw new BadRequestException("Mã lớp đã tồn tại: " + req.code);
            }
        });

        if (!deptRepo.existsById(req.departmentId)) {
            throw new NotFoundException("Không tìm thấy khoa: " + req.departmentId);
        }

        existing.setName(req.name);
        existing.setCode(req.code);
        existing.setDepartmentId(req.departmentId);
        existing.setYear(req.year);
        existing.setStudentCount(req.studentCount == null ? existing.getStudentCount() : req.studentCount);

        return toResponse(classRepo.save(existing));
    }

    @Transactional
    public void delete(String id) {
        if (!classRepo.existsById(id)) {
            throw new NotFoundException("Không tìm thấy lớp: " + id);
        }
        classRepo.deleteById(id);
    }

    private SchoolClassResponse toResponse(SchoolClass c) {
        SchoolClassResponse r = new SchoolClassResponse();
        r.id = c.getId();
        r.name = c.getName();
        r.code = c.getCode();
        r.departmentId = c.getDepartmentId();
        r.year = c.getYear();
        r.studentCount = c.getStudentCount();
        return r;
    }
}
