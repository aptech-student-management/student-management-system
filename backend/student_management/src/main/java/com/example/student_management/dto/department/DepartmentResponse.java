package com.example.student_management.dto.department;

import lombok.*;

@Data
@NoArgsConstructor
@Builder
public class DepartmentResponse {

    private String id;
    private String name;
    private String code;
    private String headLecturerId;
    private Long studentCount;
    private Long subjectCount;

    public DepartmentResponse(String id, String name, String code,
                              String headLecturerId,
                              Long studentCount, Long subjectCount) {
        this.id = id;
        this.name = name;
        this.code = code;
        this.headLecturerId = headLecturerId;
        this.studentCount = studentCount;
        this.subjectCount = subjectCount;
    }
}