package com.example.student_management.dto.importing;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class GradeImportPreviewResponse {
    String courseSectionId;
    List<GradeImportRowDto> rows;
    int totalRows;
    int readyRows;
    int createCount;
    int updateCount;
}
