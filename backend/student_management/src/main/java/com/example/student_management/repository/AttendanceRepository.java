package com.example.student_management.repository;

import com.example.student_management.entity.AttendanceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceEntity, String> {
    List<AttendanceEntity> findByCourseSectionId(String courseSectionId);
    List<AttendanceEntity> findByCourseSectionIdAndDate(String courseSectionId, LocalDate date);
    List<AttendanceEntity> findByStudentId(String studentId);
    List<AttendanceEntity> findByStudentIdAndCourseSectionId(String studentId, String courseSectionId);
    Optional<AttendanceEntity> findByStudentIdAndCourseSectionIdAndDate(String studentId, String courseSectionId, LocalDate date);
}
