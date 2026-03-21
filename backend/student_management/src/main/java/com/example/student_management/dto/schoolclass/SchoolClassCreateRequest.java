package com.example.student_management.dto.schoolclass;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class SchoolClassCreateRequest {

    @NotBlank
    @Size(max = 10)
    public String id;

    @NotBlank
    @Size(max = 255)
    public String name;

    @NotBlank
    @Size(max = 50)
    public String code;

    @Size(max = 10)
    public String departmentId;

    @NotNull
    @Min(1)
    public Integer year;

    @Min(0)
    public Integer studentCount; // optional
}
