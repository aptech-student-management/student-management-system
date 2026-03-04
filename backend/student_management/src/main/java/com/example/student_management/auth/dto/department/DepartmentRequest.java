package com.example.student_management.auth.dto.department;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class DepartmentRequest {

    private String name;
    private String code;
    private Long headLecturerId;
    private String description;

}
