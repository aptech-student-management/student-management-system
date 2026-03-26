package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "department")
public class Department {
    @Id
    @Column(name = "id", length = 10)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String code;

    private String headLecturerId;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "department")
    private List<User> users;

    @OneToMany(mappedBy = "department")
    private List<SubjectEntity> subjects;

    @OneToMany(mappedBy = "department")
    private List<SchoolClass> schoolClasses;

}
