package com.example.student_management.repository;

import com.example.student_management.entity.SchoolClass;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SchoolClassRepository extends JpaRepository<SchoolClass, String> {
    boolean existsByCode(String code);
    Optional<SchoolClass> findByCode(String code);
}
