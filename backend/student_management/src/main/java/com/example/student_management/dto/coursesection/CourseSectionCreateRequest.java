package com.example.student_management.dto.coursesection;

import com.example.student_management.entity.CourseSectionEntity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CourseSectionCreateRequest {
    @Size(max = 10)
    public String id;

    @NotBlank
    @Size(max = 10)
    public String subjectId;

    @NotBlank
    @Size(max = 10)
    public String semesterId;

    @NotBlank
    @Size(max = 20)
    public String lecturerId;

    @Size(max = 10)
    public String classId;

    public String schedule;
    public String room;

    @NotNull
    public Integer maxStudents;

    public Integer enrolledCount;

    @NotNull
    public CourseSectionEntity.Status status;
}
