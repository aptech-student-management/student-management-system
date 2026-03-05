package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_sections")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class CourseSectionEntity {

    @Id
    @Column(length = 10)
    private String id;

    @Column(name = "subject_id", nullable = false, length = 10)
    private String subjectId;

    @Column(name = "semester_id", nullable = false, length = 10)
    private String semesterId;

    @Column(name = "lecturer_id", nullable = false, length = 20)
    private String lecturerId;

    @Column(name = "class_id", length = 10)
    private String classId;

    private String schedule;
    private String room;

    @Column(name = "max_students")
    private Integer maxStudents;

    @Column(name = "enrolled_count")
    private Integer enrolledCount;

    @Enumerated(EnumType.STRING)
    private Status status;

    public enum Status { OPEN, FULL, CLOSED }
}
