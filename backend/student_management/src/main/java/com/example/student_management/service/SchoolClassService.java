package com.example.student_management.service;

import com.example.student_management.dto.schoolclass.SchoolClassCreateRequest;
import com.example.student_management.dto.schoolclass.SchoolClassResponse;
import com.example.student_management.dto.schoolclass.SchoolClassUpdateRequest;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.SchoolClass;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.SchoolClassRepository;
import com.example.student_management.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SchoolClassService {

    private final SchoolClassRepository classRepo;
    private final DepartmentRepository deptRepo;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    public SchoolClassService(
            SchoolClassRepository classRepo,
            DepartmentRepository deptRepo,
            DepartmentRepository departmentRepository,
            UserRepository userRepository
    ) {
        this.classRepo = classRepo;
        this.deptRepo = deptRepo;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
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
        Department department = null;
        if (req.getDepartmentId() != null) {
            department = departmentRepository.findById(req.getDepartmentId())
                    .orElseThrow(() -> new BadRequestException("Khoa không tồn tại"));
        }
        SchoolClass c = SchoolClass.builder()
                .id(req.id)
                .name(req.name)
                .code(req.code)
                .department(department)
                .year(req.year)
                .studentCount(0)
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
        Department department = deptRepo.findById(req.departmentId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy khoa"));


        existing.setName(req.name);
        existing.setCode(req.code);
        existing.setDepartment(department);
        existing.setYear(req.year);
        existing.setStudentCount(resolveStudentCount(existing.getId()).intValue());

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
        r.departmentId = c.getDepartment() != null
                ? c.getDepartment().getId()
                : null;
        r.year = c.getYear();
        r.studentCount = resolveStudentCount(c.getId()).intValue();
        return r;
    }

    private Long resolveStudentCount(String classId) {
        return userRepository.countBySchoolClass_IdAndRole(classId, Role.STUDENT);
    }
}
