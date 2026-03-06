package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "enrollments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentEntity {

    @Id
    @Column(length = 30)
    private String id;

    @Column(name = "student_id", nullable = false, length = 30)
    private String studentId;

    @Column(name = "course_section_id", nullable = false, length = 20)
    private String courseSectionId;

    @Column(name = "enrolled_at")
    private LocalDate enrolledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    public enum Status {
        ENROLLED,
        DROPPED
    }
}
