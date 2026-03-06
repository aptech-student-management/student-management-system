package com.example.student_management.repository;

import com.example.student_management.entity.GradeEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GradeRepository extends JpaRepository<GradeEntity, String> {
    List<GradeEntity> findByStudentId(String studentId);
    List<GradeEntity> findByCourseSectionId(String courseSectionId);
    Optional<GradeEntity> findByStudentIdAndCourseSectionId(String studentId, String courseSectionId);
}
