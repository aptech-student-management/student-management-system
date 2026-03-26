package com.example.student_management.repository;

import com.example.student_management.entity.User;
import com.example.student_management.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository
        extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByStudentId(String studentId);

    List<User> findByRole(Role role);
    List<User> findBySchoolClass_IdAndRole(String classId, Role role);
    Optional<User> findByStudentId(String studentId);

    long countByRole(Role role);
    Long countByDepartment_IdAndRole(String departmentId, Role role);
    Long countBySchoolClass_IdAndRole(String classId, Role role);
}
