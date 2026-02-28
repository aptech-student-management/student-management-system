package com.example.student_management.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table
public class Department {

    @Id
    @Column(length = 10)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;

    private String headLecturerId;

    private Integer studentCount = 0;

    private Integer subjectCount = 0;

    @Column(columnDefinition = "TEXT")
    private String description;
}
