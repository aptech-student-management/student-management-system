package com.example.student_management.dto.importing;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class GradeImportApplyRequest {
    private String courseSectionId;
    private List<GradeImportRowDto> rows = new ArrayList<>();
}
