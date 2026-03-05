package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "classes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClassEntity {

    @Id
    @Column(length = 10)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(nullable = false)
    private Integer year;

    private Integer studentCount;

    @ManyToOne
    @JoinColumn(name = "department_id")
    private Department department;
}