package com.example.student_management.repository;

import com.example.student_management.entity.CourseSectionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseSectionRepository extends JpaRepository<CourseSectionEntity, String> {
    boolean existsBySemesterIdAndClassIdAndSchedule(String semesterId, String classId, String schedule);
    boolean existsBySemesterIdAndLecturerIdAndSchedule(String semesterId, String lecturerId, String schedule);
}
