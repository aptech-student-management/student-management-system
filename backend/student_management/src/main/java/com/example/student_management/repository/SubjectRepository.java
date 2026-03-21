package com.example.student_management.repository;

import com.example.student_management.entity.SubjectEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SubjectRepository extends JpaRepository<SubjectEntity, String> {
    boolean existsByCode(String code);
    Optional<SubjectEntity> findByCode(String code);
    Long countByDepartment_Id(String departmentId);
}
