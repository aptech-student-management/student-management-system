package com.example.student_management.repository;

import com.example.student_management.dto.department.DepartmentResponse;
import com.example.student_management.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, String> {

    Optional<Department> findByCode(String code);

    boolean existsByCode(String code);

    // Query lấy tất cả khoa kèm thống kê (studentCount, subjectCount)
    @Query("""
        SELECT new com.example.student_management.dto.department.DepartmentResponse(
            d.id,
            d.name,
            d.code,
            d.headLecturerId,
            (SELECT COUNT(u.id) FROM User u 
             WHERE u.department.id = d.id 
             AND u.role = com.example.student_management.entity.Role.STUDENT),
            (SELECT COUNT(s.id) FROM Subject s 
             WHERE s.department.id = d.id)
        )
        FROM Department d
        """)
    List<DepartmentResponse> findAllWithStats();

    // Sinh ID: lấy giá trị lớn nhất theo prefix (ví dụ 'D%')
    @Query("SELECT MAX(d.id) FROM Department d WHERE d.id LIKE CONCAT(:prefix, '%')")
    String findMaxIdByPrefix(@Param("prefix") String prefix);
}
