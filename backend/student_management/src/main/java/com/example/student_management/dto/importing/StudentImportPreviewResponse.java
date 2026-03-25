package com.example.student_management.dto.importing;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class StudentImportPreviewResponse {
    List<StudentImportRowDto> rows;
    int totalRows;
    int readyRows;
    int createCount;
    int updateCount;
}
