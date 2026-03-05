package com.example.student_management.repository;

import com.example.student_management.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, String> {
    boolean existsByCode(String code);
}
