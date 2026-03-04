package com.example.student_management.repository;

import com.example.student_management.entity.SemesterEntity;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SemesterRepository extends JpaRepository<SemesterEntity, String> {}
