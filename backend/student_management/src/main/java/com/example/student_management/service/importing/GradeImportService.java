package com.example.student_management.service.importing;

import com.example.student_management.dto.importing.GradeImportApplyRequest;
import com.example.student_management.dto.importing.GradeImportPreviewResponse;
import com.example.student_management.dto.importing.GradeImportRowDto;
import com.example.student_management.entity.AttendanceEntity;
import com.example.student_management.entity.CourseSectionEntity;
import com.example.student_management.entity.EnrollmentEntity;
import com.example.student_management.entity.GradeEntity;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.exception.NotFoundException;
import com.example.student_management.repository.AttendanceRepository;
import com.example.student_management.repository.CourseSectionRepository;
import com.example.student_management.repository.EnrollmentRepository;
import com.example.student_management.repository.GradeRepository;
import com.example.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
public class GradeImportService {

    private static final List<String> STUDENT_ID_KEYS = List.of("studentid", "student id", "ma sinh vien", "mssv");
    private static final List<String> MIDTERM_KEYS = List.of("midterm", "gk", "giua ky", "diem giua ky");
    private static final List<String> FINAL_KEYS = List.of("final", "finalscore", "ck", "cuoi ky", "diem cuoi ky");
    private static final List<String> ATTENDANCE_KEYS = List.of("attendance", "attendance score", "chuyen can", "diem chuyen can");
    private static final List<String> TOTAL_KEYS = List.of("total", "totalscore", "tong diem", "tong");
    private static final List<String> LETTER_KEYS = List.of("letter", "lettergrade", "diem chu");
    private static final List<String> GPA_KEYS = List.of("gpa", "gpa point", "he 4");

    private final TabularImportParserService parserService;
    private final GradeRepository gradeRepository;
    private final UserRepository userRepository;
    private final CourseSectionRepository courseSectionRepository;
    private final AttendanceRepository attendanceRepository;
    private final EnrollmentRepository enrollmentRepository;

    public GradeImportPreviewResponse preview(MultipartFile file, String courseSectionId, User currentUser) {
        CourseSectionEntity section = getManagedSection(courseSectionId, currentUser);
        List<TabularImportParserService.ParsedRow> parsedRows = parserService.parse(file);
        Set<String> seenStudentIds = new HashSet<>();
        List<GradeImportRowDto> rows = new ArrayList<>();

        for (TabularImportParserService.ParsedRow parsedRow : parsedRows) {
            GradeImportRowDto row = buildPreviewRow(parsedRow, section.getId());
            if (StringUtils.hasText(row.getStudentId()) && !seenStudentIds.add(row.getStudentId().toLowerCase(Locale.ROOT))) {
                row.getIssues().add("Mã sinh viên bị trùng trong file import");
            }
            refreshReady(row);
            rows.add(row);
        }

        long readyRows = rows.stream().filter(GradeImportRowDto::isReady).count();
        long createCount = rows.stream().filter(row -> "CREATE".equals(row.getOperation())).count();
        long updateCount = rows.stream().filter(row -> "UPDATE".equals(row.getOperation())).count();

        return GradeImportPreviewResponse.builder()
                .courseSectionId(section.getId())
                .rows(rows)
                .totalRows(rows.size())
                .readyRows((int) readyRows)
                .createCount((int) createCount)
                .updateCount((int) updateCount)
                .build();
    }

    public Map<String, Object> apply(GradeImportApplyRequest request, User currentUser) {
        if (request == null || !StringUtils.hasText(request.getCourseSectionId())) {
            throw new BadRequestException("Thiếu lớp học phần để import điểm");
        }
        if (request.getRows() == null || request.getRows().isEmpty()) {
            throw new BadRequestException("Không có dữ liệu điểm để import");
        }

        CourseSectionEntity section = getManagedSection(request.getCourseSectionId(), currentUser);
        Set<String> seenStudentIds = new HashSet<>();
        int created = 0;
        int updated = 0;
        List<GradeEntity> savedGrades = new ArrayList<>();

        for (GradeImportRowDto inputRow : request.getRows()) {
            GradeImportRowDto row = validateEditableRow(inputRow, section.getId());
            if (StringUtils.hasText(row.getStudentId())
                    && !seenStudentIds.add(row.getStudentId().toLowerCase(Locale.ROOT))) {
                row.getIssues().add("Mã sinh viên bị trùng trong file import");
            }
            refreshReady(row);
            if (!row.isReady()) {
                throw new BadRequestException("Dữ liệu import còn lỗi ở dòng " + row.getRowNumber());
            }

            GradeEntity existing = gradeRepository.findByStudentIdAndCourseSectionId(row.getStudentId(), section.getId())
                    .orElse(null);

            GradeEntity target = existing != null ? existing : GradeEntity.builder()
                    .id("GRD-" + row.getStudentId() + "-" + section.getId())
                    .studentId(row.getStudentId())
                    .courseSectionId(section.getId())
                    .build();

            applyScores(target, row, currentUser);
            GradeEntity saved = gradeRepository.save(target);
            savedGrades.add(saved);

            if (existing == null) {
                created++;
            } else {
                updated++;
            }
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("createdCount", created);
        result.put("updatedCount", updated);
        result.put("totalCount", created + updated);
        result.put("courseSectionId", section.getId());
        result.put("grades", savedGrades);
        return result;
    }

    private GradeImportRowDto buildPreviewRow(TabularImportParserService.ParsedRow parsedRow, String courseSectionId) {
        GradeImportRowDto row = new GradeImportRowDto();
        row.setRowNumber(parsedRow.rowNumber());
        row.setStudentId(blankToNull(findValue(parsedRow.values(), STUDENT_ID_KEYS)));
        String rawMidterm = findValue(parsedRow.values(), MIDTERM_KEYS);
        String rawFinal = findValue(parsedRow.values(), FINAL_KEYS);
        String rawAttendance = findValue(parsedRow.values(), ATTENDANCE_KEYS);
        String rawTotal = findValue(parsedRow.values(), TOTAL_KEYS);
        String rawGpa = findValue(parsedRow.values(), GPA_KEYS);
        row.setMidterm(parseScore(rawMidterm));
        row.setFinalScore(parseScore(rawFinal));
        row.setAttendanceScore(parseScore(rawAttendance));
        row.setTotalScore(parseScore(rawTotal));
        row.setLetterGrade(blankToNull(findValue(parsedRow.values(), LETTER_KEYS)));
        row.setGpaPoint(parseScore(rawGpa));

        markInvalidNumber(row, "Giữa kỳ", rawMidterm, row.getMidterm());
        markInvalidNumber(row, "Cuối kỳ", rawFinal, row.getFinalScore());
        markInvalidNumber(row, "Chuyên cần", rawAttendance, row.getAttendanceScore());
        markInvalidNumber(row, "Tổng điểm", rawTotal, row.getTotalScore());
        markInvalidNumber(row, "GPA hệ 4", rawGpa, row.getGpaPoint());

        if (!StringUtils.hasText(row.getStudentId())) {
            row.getIssues().add("Thiếu mã sinh viên");
            refreshReady(row);
            row.setOperation("CREATE");
            return row;
        }

        User student = userRepository.findByStudentId(row.getStudentId()).orElse(null);
        if (student == null) {
            row.getIssues().add("Không tìm thấy sinh viên");
            row.setOperation("CREATE");
            refreshReady(row);
            return row;
        }

        row.setStudentName(student.getName());

        GradeEntity existing = gradeRepository.findByStudentIdAndCourseSectionId(row.getStudentId(), courseSectionId)
                .orElse(null);
        row.setOperation(existing == null ? "CREATE" : "UPDATE");

        if (row.getAttendanceScore() == null) {
            row.setAttendanceScore(resolveAttendanceScore(row.getStudentId(), courseSectionId, existing));
            row.getIssues().add("Đã tự điền điểm chuyên cần");
        }

        validateScoreRange(row, "Giữa kỳ", row.getMidterm());
        validateScoreRange(row, "Cuối kỳ", row.getFinalScore());
        validateScoreRange(row, "Chuyên cần", row.getAttendanceScore());

        if (!enrollmentRepository.existsByStudentIdAndCourseSectionIdAndStatus(
                row.getStudentId(), courseSectionId, EnrollmentEntity.Status.ENROLLED)) {
            row.getIssues().add("Sinh viên chưa ở trạng thái ENROLLED trong lớp học phần");
        }

        if (row.getMidterm() == null && row.getFinalScore() == null && row.getAttendanceScore() == null) {
            row.getIssues().add("Không có dữ liệu điểm để import");
        }

        if (row.getMidterm() != null && row.getFinalScore() != null) {
            GradeSnapshot calc = calculateGrade(row.getMidterm(), row.getFinalScore(), row.getAttendanceScore() == null ? 0 : row.getAttendanceScore());
            row.setTotalScore(calc.totalScore());
            row.setLetterGrade(calc.letterGrade());
            row.setGpaPoint(calc.gpaPoint());
        } else if (existing != null) {
            if (row.getTotalScore() == null) {
                row.setTotalScore(existing.getTotalScore());
            }
            if (!StringUtils.hasText(row.getLetterGrade())) {
                row.setLetterGrade(existing.getLetterGrade());
            }
            if (row.getGpaPoint() == null) {
                row.setGpaPoint(existing.getGpaPoint());
            }
        }

        refreshReady(row);
        return row;
    }

    private GradeImportRowDto validateEditableRow(GradeImportRowDto source, String courseSectionId) {
        GradeImportRowDto row = new GradeImportRowDto();
        row.setRowNumber(source.getRowNumber());
        row.setStudentId(blankToNull(source.getStudentId()));
        row.setStudentName(blankToNull(source.getStudentName()));
        row.setMidterm(source.getMidterm());
        row.setFinalScore(source.getFinalScore());
        row.setAttendanceScore(source.getAttendanceScore());
        row.setTotalScore(source.getTotalScore());
        row.setLetterGrade(blankToNull(source.getLetterGrade()));
        row.setGpaPoint(source.getGpaPoint());

        if (!StringUtils.hasText(row.getStudentId())) {
            row.getIssues().add("Thiếu mã sinh viên");
            refreshReady(row);
            return row;
        }

        User student = userRepository.findByStudentId(row.getStudentId()).orElse(null);
        if (student == null) {
            row.getIssues().add("Không tìm thấy sinh viên");
            refreshReady(row);
            return row;
        }

        row.setStudentName(student.getName());
        row.setOperation(gradeRepository.findByStudentIdAndCourseSectionId(row.getStudentId(), courseSectionId).isPresent()
                ? "UPDATE"
                : "CREATE");

        if (row.getAttendanceScore() == null) {
            row.setAttendanceScore(resolveAttendanceScore(row.getStudentId(), courseSectionId,
                    gradeRepository.findByStudentIdAndCourseSectionId(row.getStudentId(), courseSectionId).orElse(null)));
            row.getIssues().add("Đã tự điền điểm chuyên cần");
        }

        validateScoreRange(row, "Giữa kỳ", row.getMidterm());
        validateScoreRange(row, "Cuối kỳ", row.getFinalScore());
        validateScoreRange(row, "Chuyên cần", row.getAttendanceScore());

        if (row.getMidterm() == null && row.getFinalScore() == null && row.getAttendanceScore() == null) {
            row.getIssues().add("Không có dữ liệu điểm để import");
        }

        if (row.getMidterm() != null && row.getFinalScore() != null) {
            GradeSnapshot calc = calculateGrade(row.getMidterm(), row.getFinalScore(), row.getAttendanceScore() == null ? 0 : row.getAttendanceScore());
            row.setTotalScore(calc.totalScore());
            row.setLetterGrade(calc.letterGrade());
            row.setGpaPoint(calc.gpaPoint());
        }

        if (!enrollmentRepository.existsByStudentIdAndCourseSectionIdAndStatus(
                row.getStudentId(), courseSectionId, EnrollmentEntity.Status.ENROLLED)) {
            row.getIssues().add("Sinh viên chưa ở trạng thái ENROLLED trong lớp học phần");
        }

        refreshReady(row);
        return row;
    }

    private void applyScores(GradeEntity target, GradeImportRowDto row, User currentUser) {
        target.setStudentId(row.getStudentId());
        target.setMidterm(row.getMidterm());
        target.setFinalScore(row.getFinalScore());
        target.setAttendanceScore(row.getAttendanceScore());
        target.setTotalScore(row.getTotalScore());
        target.setLetterGrade(row.getLetterGrade());
        target.setGpaPoint(row.getGpaPoint());
        target.setUpdatedBy(currentUser.getId().toString());
        target.setUpdatedAt(Instant.now());
    }

    private CourseSectionEntity getManagedSection(String courseSectionId, User currentUser) {
        if (!StringUtils.hasText(courseSectionId)) {
            throw new BadRequestException("Bạn cần chọn lớp học phần trước khi import");
        }

        CourseSectionEntity section = courseSectionRepository.findById(courseSectionId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy lớp học phần"));

        if (currentUser.getRole() != Role.ADMIN
                && !currentUser.getId().toString().equals(section.getLecturerId())) {
            throw new BadRequestException("Bạn không có quyền import điểm cho lớp học phần này");
        }

        return section;
    }

    private Double resolveAttendanceScore(String studentId, String courseSectionId, GradeEntity existing) {
        if (existing != null && existing.getAttendanceScore() != null) {
            return existing.getAttendanceScore();
        }

        List<AttendanceEntity> records = attendanceRepository.findByStudentIdAndCourseSectionId(studentId, courseSectionId);
        if (records.isEmpty()) {
            return 0d;
        }

        long present = records.stream().filter(record -> record.getStatus() == AttendanceEntity.Status.PRESENT).count();
        long late = records.stream().filter(record -> record.getStatus() == AttendanceEntity.Status.LATE).count();
        double score = ((present + late * 0.5d) / Math.max(records.size(), 1)) * 10;
        return Math.round(score * 10d) / 10d;
    }

    private void validateScoreRange(GradeImportRowDto row, String label, Double value) {
        if (value == null) {
            return;
        }
        if (value < 0 || value > 10) {
            row.getIssues().add(label + " phải nằm trong khoảng 0-10");
        }
    }

    private void markInvalidNumber(GradeImportRowDto row, String label, String rawValue, Double parsedValue) {
        if (StringUtils.hasText(rawValue) && parsedValue == null) {
            row.getIssues().add(label + " không phải số hợp lệ");
        }
    }

    private void refreshReady(GradeImportRowDto row) {
        boolean blocking = row.getIssues().stream().anyMatch(this::isBlockingIssue);
        row.setReady(!blocking);
    }

    private boolean isBlockingIssue(String issue) {
        String normalized = issue == null ? "" : issue.toLowerCase(Locale.ROOT);
        return normalized.contains("thiếu")
                || normalized.contains("không tìm thấy")
                || normalized.contains("khong tim thay")
                || normalized.contains("phải nằm")
                || normalized.contains("phai nam")
                || normalized.contains("trùng")
                || normalized.contains("trung")
                || normalized.contains("không có dữ liệu")
                || normalized.contains("khong co du lieu");
    }

    private GradeSnapshot calculateGrade(double midterm, double finalScore, double attendanceScore) {
        double totalScore = Math.round((0.1 * attendanceScore + 0.3 * midterm + 0.6 * finalScore) * 100d) / 100d;
        String letterGrade = "F";
        double gpaPoint = 0;

        if (totalScore >= 8.5) {
            letterGrade = "A";
            gpaPoint = 4;
        } else if (totalScore >= 8.0) {
            letterGrade = "B+";
            gpaPoint = 3.5;
        } else if (totalScore >= 7.0) {
            letterGrade = "B";
            gpaPoint = 3;
        } else if (totalScore >= 6.5) {
            letterGrade = "C+";
            gpaPoint = 2.5;
        } else if (totalScore >= 5.5) {
            letterGrade = "C";
            gpaPoint = 2;
        }

        return new GradeSnapshot(totalScore, letterGrade, gpaPoint);
    }

    private String findValue(Map<String, String> values, List<String> aliases) {
        for (String alias : aliases) {
            String normalizedAlias = alias.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
            for (Map.Entry<String, String> entry : values.entrySet()) {
                if (entry.getKey().equals(normalizedAlias)) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private Double parseScore(String rawValue) {
        String normalized = blankToNull(rawValue);
        if (normalized == null) {
            return null;
        }

        try {
            return Double.parseDouble(normalized.replace(',', '.'));
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record GradeSnapshot(Double totalScore, String letterGrade, Double gpaPoint) {
    }
}
