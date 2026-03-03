package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class SchoolClass {

    @Id
    @Column(length = 10)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "department_id", nullable = false, length = 10)
    private String departmentId;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "student_count")
    private Integer studentCount;
}
