package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "department")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(name = "head_lecturer_id")
    private Long headLecturerId;

    @Builder.Default
    @Column(name = "student_count")
    private Integer studentCount = 0;

    @Builder.Default
    @Column(name = "subject_count")
    private Integer subjectCount = 0;

    @Column(columnDefinition = "TEXT")
    private String description;
}
