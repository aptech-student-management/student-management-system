package com.example.student_management.repository;

import com.example.student_management.entity.EnrollmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<EnrollmentEntity, String> {
    List<EnrollmentEntity> findByStudentId(String studentId);
    List<EnrollmentEntity> findByCourseSectionId(String courseSectionId);
    List<EnrollmentEntity> findByStudentIdAndStatus(String studentId, EnrollmentEntity.Status status);
    List<EnrollmentEntity> findByCourseSectionIdAndStatus(String courseSectionId, EnrollmentEntity.Status status);
    boolean existsByStudentIdAndCourseSectionIdAndStatus(String studentId, String courseSectionId, EnrollmentEntity.Status status);
    java.util.Optional<EnrollmentEntity> findByStudentIdAndCourseSectionId(String studentId, String courseSectionId);
}
