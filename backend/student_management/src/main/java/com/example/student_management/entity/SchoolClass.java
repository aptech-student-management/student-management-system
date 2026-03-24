package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "school_class")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchoolClass {

    @Id
    @Column(length = 10)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(nullable = false)
    private Integer year;

    @Column(name = "student_count")
    private Integer studentCount = 0;

    @OneToMany(mappedBy = "schoolClass", cascade = CascadeType.ALL)
    @Builder.Default
    private List<User> students = new ArrayList<>();
    public void addStudent(User student) {
        students.add(student);
        student.setSchoolClass(this);
        this.studentCount = (this.studentCount == null ? 0 : this.studentCount) + 1;
    }

    public void removeStudent(User student) {
        students.remove(student);
        student.setSchoolClass(null);
        this.studentCount = Math.max(0, (this.studentCount == null ? 0 : this.studentCount) - 1);
    }

}