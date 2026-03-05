package com.example.student_management.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "semesters")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class SemesterEntity {

    @Id
    @Column(length = 10)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(name = "academic_year")
    private String academicYear;

    @Column(name = "start_date")
    private java.sql.Date startDate;

    @Column(name = "end_date")
    private java.sql.Date endDate;

    @Enumerated(EnumType.STRING)
    private SemesterStatus status;

    public enum SemesterStatus { ACTIVE, UPCOMING, CLOSED }
}
