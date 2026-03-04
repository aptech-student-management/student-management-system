package com.example.student_management.dto.subject;

import jakarta.validation.constraints.*;

public class SubjectCreateRequest {

    @NotBlank
    @Size(max = 10)
    public String id;

    @NotBlank
    @Size(max = 255)
    public String name;

    @NotBlank
    @Size(max = 20)
    public String code;

    @NotNull
    @Min(1)
    public Integer credits;

    @NotBlank
    @Size(max = 10)
    public String departmentId;

    public String description;
}
