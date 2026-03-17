package com.example.student_management.service;

import com.example.student_management.dto.subject.SubjectCreateRequest;
import com.example.student_management.dto.subject.SubjectResponse;
import com.example.student_management.dto.subject.SubjectUpdateRequest;
import com.example.student_management.entity.SubjectEntity;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.SubjectRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepo;
    private final DepartmentRepository deptRepo;

    public SubjectService(SubjectRepository subjectRepo, DepartmentRepository deptRepo) {
        this.subjectRepo = subjectRepo;
        this.deptRepo = deptRepo;
    }

    public List<SubjectResponse> getAll() {
        return subjectRepo.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public SubjectResponse getById(String id) {
        SubjectEntity s = subjectRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy môn học: " + id));
        return toResponse(s);
    }

    @Transactional
    public SubjectResponse create(SubjectCreateRequest req) {
        String newId = req.id;
        if (newId == null || newId.isBlank()) {
            newId = generateSubjectId();
        }

        if (subjectRepo.existsById(newId)) {
            throw new IllegalArgumentException("ID môn học đã tồn tại: " + newId);
        }
        if (subjectRepo.existsByCode(req.code)) {
            throw new IllegalArgumentException("Mã môn học đã tồn tại: " + req.code);
        }
        if (!deptRepo.existsById(Long.valueOf(req.departmentId))) {
            throw new IllegalArgumentException("Không tìm thấy khoa: " + req.departmentId);
        }

        SubjectEntity s = SubjectEntity.builder()
                .id(newId)
                .name(req.name)
                .code(req.code)
                .credits(req.credits)
                .departmentId(req.departmentId)
                .description(req.description)
                .build();

        return toResponse(subjectRepo.save(s));
    }

    @Transactional
    public SubjectResponse update(String id, SubjectUpdateRequest req) {
        SubjectEntity existing = subjectRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy môn học: " + id));

        subjectRepo.findByCode(req.code).ifPresent(found -> {
            if (!found.getId().equals(id)) {
                throw new IllegalArgumentException("Mã môn học đã tồn tại: " + req.code);
            }
        });

        if (!deptRepo.existsById(Long.valueOf(req.departmentId))) {
            throw new IllegalArgumentException("Không tìm thấy khoa: " + req.departmentId);
        }

        existing.setName(req.name);
        existing.setCode(req.code);
        existing.setCredits(req.credits);
        existing.setDepartmentId(req.departmentId);
        existing.setDescription(req.description);

        return toResponse(subjectRepo.save(existing));
    }

    @Transactional
    public void delete(String id) {
        if (!subjectRepo.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy môn học: " + id);
        }
        subjectRepo.deleteById(id);
    }

    private SubjectResponse toResponse(SubjectEntity s) {
        SubjectResponse r = new SubjectResponse();
        r.id = s.getId();
        r.name = s.getName();
        r.code = s.getCode();
        r.credits = s.getCredits();
        r.departmentId = s.getDepartmentId();
        r.description = s.getDescription();
        return r;
    }

    private String generateSubjectId() {
        String candidate;
        do {
            String base36 = Long.toString(System.currentTimeMillis(), 36).toUpperCase();
            String suffix = base36.length() > 7 ? base36.substring(base36.length() - 7) : base36;
            candidate = "SUB" + suffix;
            if (candidate.length() > 10) {
                candidate = candidate.substring(0, 10);
            }
        } while (subjectRepo.existsById(candidate));

        return candidate;
    }
}
