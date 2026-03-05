package com.example.student_management.dto.department;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DepartmentUpsertRequest {

    @Size(max = 10, message = "ID khoa tối đa 10 ký tự")
    private String id;

    @NotBlank(message = "Tên khoa không được để trống")
    private String name;

    @NotBlank(message = "Mã khoa không được để trống")
    @Size(max = 20, message = "Mã khoa tối đa 20 ký tự")
    private String code;

    private String headLecturerId;

    private String description;
}
