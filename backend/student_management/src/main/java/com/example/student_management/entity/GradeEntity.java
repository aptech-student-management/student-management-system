package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "grades")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GradeEntity {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "student_id", nullable = false, length = 30)
    private String studentId;

    @Column(name = "course_section_id", nullable = false, length = 20)
    private String courseSectionId;

    private Double midterm;

    @Column(name = "final_score")
    private Double finalScore;

    @Column(name = "attendance_score")
    private Double attendanceScore;

    @Column(name = "total_score")
    private Double totalScore;

    @Column(name = "letter_grade", length = 5)
    private String letterGrade;

    @Column(name = "gpa_point")
    private Double gpaPoint;

    @Column(name = "updated_by", length = 30)
    private String updatedBy;

    @Column(name = "updated_at")
    private Instant updatedAt;
}
