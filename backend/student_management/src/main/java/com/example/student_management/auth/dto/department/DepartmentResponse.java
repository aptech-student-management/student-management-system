package com.example.student_management.auth.dto.department;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentResponse {

    private Long id;
    private String name;
    private String code;
    private Long headLecturerId;
    private Integer studentCount;
    private Integer subjectCount;
    private String description;

}
