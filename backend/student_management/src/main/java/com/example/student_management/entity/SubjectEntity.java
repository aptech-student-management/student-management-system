package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "subjects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubjectEntity {

    @Id
    @Column(length = 10)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false)
    private Integer credits;

    @Column(name = "department_id", nullable = false, length = 10)
    private String departmentId;

    @Column(columnDefinition = "TEXT")
    private String description;
}
