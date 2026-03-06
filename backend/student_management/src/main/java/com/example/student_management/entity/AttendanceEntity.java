package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "attendance_records")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceEntity {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "student_id", nullable = false, length = 30)
    private String studentId;

    @Column(name = "course_section_id", nullable = false, length = 20)
    private String courseSectionId;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    public enum Status {
        PRESENT,
        ABSENT,
        LATE
    }
}
