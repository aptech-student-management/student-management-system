package com.example.student_management.dto.chatbot;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentImportComponent {
 private String type = "student_import";
 private String classId;
 private String departmentId;
 private String sampleData;
 private String instruction;

 public static StudentImportComponent createImportForm(String classId, String departmentId) {
  StudentImportComponent component = new StudentImportComponent();
  component.setClassId(classId);
  component.setDepartmentId(departmentId);
  component.setInstruction("Dán danh sách sinh viên theo định dạng: studentId email fullName phone classId (mỗi dòng 1 sinh viên). Bạn cũng có thể paste dữ liệu raw từ Excel nếu có.");
  return component;
 }

 public static StudentImportComponent createImportResult(int total, int imported, int skipped, List<String> importedIds, List<String> skippedReasons) {
  StudentImportComponent component = new StudentImportComponent();
  component.setType("student_import_result");
  component.setSampleData(String.format("Tổng: %d | Import thành công: %d | Bỏ qua: %d", total, imported, skipped));
  return component;
 }
}
