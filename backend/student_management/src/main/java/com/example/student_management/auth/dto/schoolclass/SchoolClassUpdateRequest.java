package com.example.student_management.auth.dto.schoolclass;

import jakarta.validation.constraints.*;

public class SchoolClassUpdateRequest {

    @NotBlank
    @Size(max = 255)
    public String name;

    @NotBlank
    @Size(max = 50)
    public String code;

    @NotBlank
    @Size(max = 10)
    public String departmentId;

    @NotNull
    @Min(1)
    public Integer year;

    @Min(0)
    public Integer studentCount;
}
