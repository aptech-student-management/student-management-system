package com.example.student_management.service.chatbot;

import com.example.student_management.dto.schoolclass.SchoolClassCreateRequest;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.SchoolClass;
import com.example.student_management.entity.User;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.SchoolClassRepository;
import com.example.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentBulkImportService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DepartmentRepository departmentRepository;
    private final SchoolClassRepository schoolClassRepository;

    private static final String DEFAULT_PASSWORD = "12345678";

    /**
     * Parse raw student data and import to database
     * Format: studentId enrollDate email fullName passwordHash phone role studentIdRaw classId deptId
     * Example: 2035 2026-03-01 08:00:00.000000 sv2035@uni.local Le Hoang Yen $10$.... 0902000035 STUDENT SV2026035 DP004 CLNNA01
     */
    @Transactional
    public BulkImportResult importStudents(List<String> rawLines, String adminUserId) {
        BulkImportResult result = new BulkImportResult();
        List<User> usersToSave = new ArrayList<>();
        Map<String, Department> deptCache = new HashMap<>();
        Map<String, SchoolClass> classCache = new HashMap<>();

        int validCount = 0;
        int errorCount = 0;

        for (String line : rawLines) {
            String trimmed = line.trim();
            if (trimmed.isBlank()) continue;

            try {
                StudentParseResult parsed = parseStudentLine(trimmed);

                // Validate and get department
                Department dept = null;
                if (parsed.deptId != null && !parsed.deptId.isBlank()) {
                    dept = deptCache.get(parsed.deptId);
                    if (dept == null) {
                        dept = departmentRepository.findById(parsed.deptId)
                                .orElseThrow(() -> new RuntimeException("Khoa không tồn tại: " + parsed.deptId));
                        deptCache.put(parsed.deptId, dept);
                    }
                }

                // Validate and get class
                SchoolClass schoolClass = null;
                if (parsed.classId != null && !parsed.classId.isBlank()) {
                    schoolClass = classCache.get(parsed.classId);
                    if (schoolClass == null) {
                        schoolClass = schoolClassRepository.findById(parsed.classId)
                                .orElseThrow(() -> new RuntimeException("Lớp không tồn tại: " + parsed.classId));
                        classCache.put(parsed.classId, schoolClass);
                    }

                    // Ensure class department matches
                    if (dept == null) {
                        dept = schoolClass.getDepartment();
                    }
                }

                // Check if student already exists
                if (userRepository.existsByStudentId(parsed.studentId)) {
                    result.getSkipped().add(new BulkImportResult.StudentRecord(parsed.studentId, "Đã tồn tại"));
                    errorCount++;
                    continue;
                }

                // Check if email already exists
                if (userRepository.existsByEmail(parsed.email)) {
                    result.getSkipped().add(new BulkImportResult.StudentRecord(parsed.studentId, "Email đã tồn tại"));
                    errorCount++;
                    continue;
                }

                // Create user
                User user = User.builder()
                        .studentId(parsed.studentId)
                        .email(parsed.email)
                        .name(parsed.fullName)
                        .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                        .role(Role.STUDENT)
                        .department(dept)
                        .schoolClass(schoolClass)
                        .phone(parsed.phone)
                        .build();

                usersToSave.add(user);
                result.getImported().add(new BulkImportResult.StudentRecord(
                        parsed.studentId,
                        parsed.email,
                        parsed.fullName,
                        parsed.classId
                ));
                validCount++;

            } catch (Exception ex) {
                log.error("Failed to import line: {}", trimmed, ex);
                result.getErrors().add(new BulkImportResult.StudentError(trimmed, ex.getMessage()));
                errorCount++;
            }
        }

        // Bulk save
        if (!usersToSave.isEmpty()) {
            userRepository.saveAll(usersToSave);
            log.info("Bulk imported {} students", usersToSave.size());
        }

        result.setTotal(rawLines.size());
        result.setImportedCount(validCount);
        result.setSkippedCount(errorCount);

        return result;
    }

    private StudentParseResult parseStudentLine(String line) {
        // Format: studentId enrollDate email fullName passwordHash phone role studentIdRaw classId deptId
        // Example: 2035 2026-03-01 08:00:00.000000 sv2035@uni.local Le Hoang Yen $10$.... 0902000035 STUDENT SV2026035 DP004 CLNNA01

        // Split by whitespace, but we need to handle multi-word names
        // Let's use a smarter parsing approach

        String[] parts = line.split("\\s+");

        if (parts.length < 9) {
            throw new RuntimeException("Invalid format: expected at least 9 fields");
        }

        StudentParseResult result = new StudentParseResult();

        // studentId (first field)
        result.studentId = parts[0].trim();

        // Skip enrollDate (could be 2 fields: date + time)
        int idx = 1;

        // Find email (contains @)
        String email = null;
        int emailIdx = -1;
        for (int i = idx; i < parts.length; i++) {
            if (parts[i].contains("@")) {
                email = parts[i];
                emailIdx = i;
                break;
            }
        }

        if (email == null) {
            throw new RuntimeException("Không tìm thấy email");
        }
        result.email = email;

        // fullName: from idx to emailIdx-1
        StringBuilder fullName = new StringBuilder();
        for (int i = idx; i < emailIdx; i++) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(parts[i]);
        }
        result.fullName = fullName.toString().trim();

        // Continue after email
        idx = emailIdx + 1;

        // Skip password hash (starts with $)
        if (idx < parts.length && parts[idx].startsWith("$")) {
            idx++;
        }

        // phone
        if (idx < parts.length) {
            result.phone = parts[idx++];
        }

        // role (should be STUDENT)
        if (idx < parts.length) {
            idx++; // skip role
        }

        // studentIdRaw (skip, we already have studentId)
        if (idx < parts.length) {
            idx++;
        }

        // classId
        if (idx < parts.length) {
            result.classId = parts[idx++];
        }

        // deptId
        if (idx < parts.length) {
            result.deptId = parts[idx];
        }

        return result;
    }

    /**
     * Parse a simpler format: studentId email fullName phone classId
     * Admin can paste this format directly
     */
    @Transactional
    public BulkImportResult importStudentsSimple(List<String> rawLines, String adminUserId) {
        BulkImportResult result = new BulkImportResult();
        List<User> usersToSave = new ArrayList<>();
        Map<String, Department> deptCache = new HashMap<>();
        Map<String, SchoolClass> classCache = new HashMap<>();

        int validCount = 0;
        int errorCount = 0;

        for (String line : rawLines) {
            String trimmed = line.trim();
            if (trimmed.isBlank()) continue;

            try {
                // Format: studentId email fullName phone classId (tab or space separated)
                String[] parts = trimmed.split("\\s+");

                if (parts.length < 4) {
                    throw new RuntimeException("Format sai: cần studentId, email, fullName, phone, classId");
                }

                String studentId = parts[0];
                String email = parts[1];
                String phone = parts[parts.length - 2]; // second to last
                String classId = parts[parts.length - 1]; // last

                // fullName is everything in between
                StringBuilder fullName = new StringBuilder();
                for (int i = 2; i < parts.length - 2; i++) {
                    if (fullName.length() > 0) fullName.append(" ");
                    fullName.append(parts[i]);
                }

                // Get department from class
                SchoolClass schoolClass = classCache.get(classId);
                if (schoolClass == null) {
                    schoolClass = schoolClassRepository.findById(classId)
                            .orElseThrow(() -> new RuntimeException("Lớp không tồn tại: " + classId));
                    classCache.put(classId, schoolClass);
                }

                Department dept = schoolClass.getDepartment();
                if (dept != null) {
                    deptCache.put(dept.getId(), dept);
                }

                // Check duplicates
                if (userRepository.existsByStudentId(studentId)) {
                    result.getSkipped().add(new BulkImportResult.StudentRecord(studentId, "Đã tồn tại"));
                    errorCount++;
                    continue;
                }

                if (userRepository.existsByEmail(email)) {
                    result.getSkipped().add(new BulkImportResult.StudentRecord(studentId, "Email đã tồn tại"));
                    errorCount++;
                    continue;
                }

                // Create user
                User user = User.builder()
                        .studentId(studentId)
                        .email(email.toLowerCase())
                        .name(fullName.toString().trim())
                        .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                        .role(Role.STUDENT)
                        .department(dept)
                        .schoolClass(schoolClass)
                        .phone(phone)
                        .build();

                usersToSave.add(user);
                result.getImported().add(new BulkImportResult.StudentRecord(
                        studentId,
                        email,
                        fullName.toString().trim(),
                        classId
                ));
                validCount++;

            } catch (Exception ex) {
                log.error("Failed to import line: {}", trimmed, ex);
                result.getErrors().add(new BulkImportResult.StudentError(trimmed, ex.getMessage()));
                errorCount++;
            }
        }

        // Bulk save
        if (!usersToSave.isEmpty()) {
            userRepository.saveAll(usersToSave);
            log.info("Bulk imported {} students (simple format)", usersToSave.size());
        }

        result.setTotal(rawLines.size());
        result.setImportedCount(validCount);
        result.setSkippedCount(errorCount);

        return result;
    }

    /**
     * Generate sample data for testing
     */
    public List<String> generateSampleData(int count, String classId, String deptId) {
        List<String> samples = new ArrayList<>();

        for (int i = 1; i <= count; i++) {
            int studentNum = 2000 + i;
            String studentId = "SV" + studentNum;
            String email = "sv" + studentNum + "@uni.local";
            String name = "Sinh Vien " + studentNum;
            String phone = "090" + String.format("%07d", i);
            String line = String.format("%s\t%s\t%s\t%s\t%s", studentId, email, name, phone, classId);
            samples.add(line);
        }

        return samples;
    }
/**  * Import students with auto-create class if class doesn't exist  * Format: studentId email fullName phone classId [deptId]  */ @Transactional public BulkImportResult importStudentsWithAutoClass(List<String> rawLines, String adminUserId) {  BulkImportResult result = new BulkImportResult();  List<User> usersToSave = new ArrayList<>();  Map<String, Department> deptCache = new HashMap<>();  Map<String, SchoolClass> classCache = new HashMap<>();  int validCount = 0;  int errorCount = 0;  for (String line : rawLines) {   String trimmed = line.trim();   if (trimmed.isBlank()) continue;   try {    StudentParseResult parsed = parseStudentLine(trimmed);    Department dept = null;    if (parsed.deptId != null && !parsed.deptId.isBlank()) {     dept = deptCache.get(parsed.deptId);     if (dept == null) {      dept = departmentRepository.findById(parsed.deptId)        .orElseThrow(() -> new RuntimeException("Khoa không tồn tại: " + parsed.deptId));      deptCache.put(parsed.deptId, dept);     }    }    SchoolClass schoolClass = null;    if (parsed.classId != null && !parsed.classId.isBlank()) {     schoolClass = classCache.get(parsed.classId);     if (schoolClass == null) {      schoolClass = schoolClassRepository.findByCode(parsed.classId).orElse(null);      if (schoolClass == null) {       String className = "Lớp " + parsed.classId;       int currentYear = java.time.LocalDate.now().getYear();       SchoolClass newClass = SchoolClass.builder()         .id(parsed.classId + "_AUTO_" + System.currentTimeMillis())         .name(className)         .code(parsed.classId)         .year(currentYear)         .studentCount(0)         .department(dept)         .build();       schoolClass = schoolClassRepository.save(newClass);       log.info("Auto-created class: {} ({})", schoolClass.getName(), schoolClass.getCode());      }      classCache.put(parsed.classId, schoolClass);      if (dept == null && schoolClass.getDepartment() != null) {       dept = schoolClass.getDepartment();       if (dept != null) {        deptCache.put(dept.getId(), dept);       }      }     }    }    if (userRepository.existsByStudentId(parsed.studentId)) {     result.getSkipped().add(new BulkImportResult.StudentRecord(parsed.studentId, "Đã tồn tại"));     errorCount++;     continue;    }    if (userRepository.existsByEmail(parsed.email)) {     result.getSkipped().add(new BulkImportResult.StudentRecord(parsed.studentId, "Email đã tồn tại"));     errorCount++;     continue;    }    User user = User.builder()      .studentId(parsed.studentId)      .email(parsed.email.toLowerCase())      .name(parsed.fullName.trim())      .password(passwordEncoder.encode(DEFAULT_PASSWORD))      .role(Role.STUDENT)      .department(dept)      .schoolClass(schoolClass)      .phone(parsed.phone)      .build();    usersToSave.add(user);    result.getImported().add(new BulkImportResult.StudentRecord(      parsed.studentId,      parsed.email,      parsed.fullName.trim(),      parsed.classId != null ? parsed.classId : "N/A"    ));    validCount++;   } catch (Exception ex) {    log.error("Failed to import line: {}", trimmed, ex);    result.getErrors().add(new BulkImportResult.StudentError(trimmed, ex.getMessage()));    errorCount++;   }  }  if (!usersToSave.isEmpty()) {   userRepository.saveAll(usersToSave);   log.info("Bulk imported {} students with auto-class creation", usersToSave.size());  }  result.setTotal(rawLines.size());  result.setImportedCount(validCount);  result.setSkippedCount(errorCount);  return result; }

    // Inner classes
    private static class StudentParseResult {
        String studentId;
        String email;
        String fullName;
        String phone;
        String classId;
        String deptId;
    }

    public static class BulkImportResult {
        private int total;
        private int importedCount;
        private int skippedCount;
        private final List<StudentRecord> imported = new ArrayList<>();
        private final List<StudentRecord> skipped = new ArrayList<>();
        private final List<StudentError> errors = new ArrayList<>();

        public static class StudentRecord {
            private final String studentId;
            private final String email;
            private final String name;
            private final String className;
            private final String reason;

            public StudentRecord(String studentId, String reason) {
                this.studentId = studentId;
                this.email = null;
                this.name = null;
                this.className = null;
                this.reason = reason;
            }

            public StudentRecord(String studentId, String email, String name, String className) {
                this.studentId = studentId;
                this.email = email;
                this.name = name;
                this.className = className;
                this.reason = null;
            }

            public String getStudentId() { return studentId; }
            public String getEmail() { return email; }
            public String getName() { return name; }
            public String getClassName() { return className; }
            public String getReason() { return reason; }
        }

        public static class StudentError {
            private final String rawData;
            private final String errorMessage;

            public StudentError(String rawData, String errorMessage) {
                this.rawData = rawData;
                this.errorMessage = errorMessage;
            }

            public String getRawData() { return rawData; }
            public String getErrorMessage() { return errorMessage; }
        }

        public int getTotal() { return total; }
        public void setTotal(int total) { this.total = total; }

        public int getImportedCount() { return importedCount; }
        public void setImportedCount(int importedCount) { this.importedCount = importedCount; }

        public int getSkippedCount() { return skippedCount; }
        public void setSkippedCount(int skippedCount) { this.skippedCount = skippedCount; }

        public List<StudentRecord> getImported() { return imported; }
        public List<StudentRecord> getSkipped() { return skipped; }
        public List<StudentError> getErrors() { return errors; }
    }
}
