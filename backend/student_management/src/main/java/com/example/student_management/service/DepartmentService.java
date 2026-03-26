package com.example.student_management.service;

import com.example.student_management.dto.department.DepartmentResponse;
import com.example.student_management.dto.department.DepartmentUpsertRequest;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.SubjectRepository;
import com.example.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final SubjectRepository subjectRepository;

    // ================= GET ALL =================
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAllWithStats();
    }

    // ================= GET BY ID =================
    @Transactional(readOnly = true)
    public DepartmentResponse getById(String id) {
        Department dept = (Department) departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khoa với ID: " + id));

        Long studentCount = userRepository.countByDepartment_IdAndRole(id, Role.STUDENT);
        Long subjectCount = subjectRepository.countByDepartment_Id(id);

        return DepartmentResponse.builder()
                .id(dept.getId())           // String
                .name(dept.getName())
                .code(dept.getCode())
                .headLecturerId(dept.getHeadLecturerId())
                .studentCount(studentCount)
                .subjectCount(subjectCount)
                .build();
    }

    // ================= CREATE =================
    @Transactional
    public DepartmentResponse create(DepartmentUpsertRequest request) {
        validateRequest(request);

        String headLecturerId = request.getHeadLecturerId();
        if (headLecturerId != null) {
            validateHeadLecturer(headLecturerId);  // String
        }

        // Tự động generate ID dạng DP001, DP002,...
        String newId = generateDepartmentId("DP");

        // Generate code (ví dụ: CNTT → CNTT1 nếu trùng)
        String code = generateCodeUnique(request.getName());

        Department department = new Department();
        department.setId(newId);
        department.setName(request.getName().trim());
        department.setCode(code);
        department.setHeadLecturerId(headLecturerId);
        department.setDescription(trim(request.getDescription()));

        Department saved = departmentRepository.save(department);

        return getById(saved.getId());
    }

    // ================= UPDATE =================
    @Transactional
    public DepartmentResponse update(String id, DepartmentUpsertRequest request) {
        Department existing = (Department) departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khoa với ID: " + id));

        validateRequest(request);

        String headLecturerId = request.getHeadLecturerId();
        if (headLecturerId != null) {
            validateHeadLecturer(headLecturerId);
        }

        String newCode = generateCodeUnique(request.getName());

        existing.setName(request.getName().trim());
        existing.setCode(newCode);
        existing.setHeadLecturerId(headLecturerId);
        existing.setDescription(trim(request.getDescription()));

        departmentRepository.save(existing);

        return getById(id);
    }

    // ================= DELETE =================
    @Transactional
    public void delete(String id) {
        Department dept = (Department) departmentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy khoa với ID: " + id));

        long studentCount = userRepository.countByDepartment_IdAndRole(id, Role.STUDENT);
        long lecturerCount = userRepository.countByDepartment_IdAndRole(id, Role.LECTURER);
        long subjectCount = subjectRepository.countByDepartment_Id(id);

        if (studentCount > 0 || lecturerCount > 0 || subjectCount > 0) {
            throw new BadRequestException("Không thể xóa khoa đang có dữ liệu liên quan (sinh viên, giảng viên hoặc môn học)");
        }

        departmentRepository.delete(dept);
    }

    // ================= VALIDATION =================
    private void validateRequest(DepartmentUpsertRequest request) {
        if (request == null) {
            throw new BadRequestException("Dữ liệu không hợp lệ");
        }

        if (request.getName() == null || request.getName().isBlank()) {
            throw new BadRequestException("Tên khoa không được để trống");
        }

        if (request.getName().length() > 255) {
            throw new BadRequestException("Tên khoa quá dài (tối đa 255 ký tự)");
        }
    }

    private void validateHeadLecturer(String lecturerId) {
        if (lecturerId == null || lecturerId.isBlank()) {
            return;
        }

        User user = userRepository.findById(Long.valueOf(lecturerId))
                .orElseThrow(() -> new BadRequestException("Trưởng khoa không tồn tại: " + lecturerId));

        if (user.getRole() != Role.LECTURER) {
            throw new BadRequestException("Trưởng khoa phải là giảng viên (role LECTURER)");
        }
    }

    // ================= UTIL =================
    private String generateCode(String name) {
        return Arrays.stream(name.trim().split("\\s+"))
                .filter(word -> !word.isEmpty())
                .map(word -> word.substring(0, 1).toUpperCase())
                .reduce("", String::concat);
    }

    private String generateCodeUnique(String name) {
        String base = generateCode(name);
        String code = base;
        int counter = 1;

        while (departmentRepository.existsByCode(code)) {
            code = base + counter;
            counter++;
        }

        return code;
    }

    private String generateDepartmentId(String prefix) {
        String maxId = departmentRepository.findMaxIdByPrefix(prefix);

        if (maxId == null) {
            return prefix + "001";
        }

        Matcher matcher = Pattern.compile("^" + Pattern.quote(prefix) + "(\\d+)$")
                .matcher(maxId);
        if (!matcher.matches()) {
            throw new BadRequestException("ID khoa hiện tại không đúng định dạng: " + maxId);
        }

        int nextNumber = Integer.parseInt(matcher.group(1)) + 1;
        return prefix + String.format("%03d", nextNumber);
    }

    private String trim(String val) {
        return val == null ? null : val.trim();
    }
}
