package com.example.student_management.service.importing;

import com.example.student_management.dto.UserResponse;
import com.example.student_management.dto.importing.StudentImportApplyRequest;
import com.example.student_management.dto.importing.StudentImportPreviewResponse;
import com.example.student_management.dto.importing.StudentImportRowDto;
import com.example.student_management.entity.Department;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.exception.BadRequestException;
import com.example.student_management.repository.DepartmentRepository;
import com.example.student_management.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class StudentImportService {

    private static final List<String> NAME_KEYS = List.of("name", "full name", "student name", "lecturer name", "ho ten", "ten sinh vien", "ten giang vien");
    private static final List<String> EMAIL_KEYS = List.of("email", "mail", "email sinh vien", "email giang vien");
    private static final List<String> IDENTIFIER_KEYS = List.of(
            "studentid", "student id", "ma sinh vien", "mssv",
            "lecturerid", "lecturer id", "ma giang vien", "ma gv", "mgv",
            "teacher id", "teacher code", "code"
    );
    private static final List<String> DEPARTMENT_KEYS = List.of("departmentid", "department id", "department", "khoa", "ma khoa");
    private static final List<String> PHONE_KEYS = List.of("phone", "phone number", "so dien thoai", "sdt");
    private static final List<String> ROLE_KEYS = List.of("role", "vai tro", "user role", "loai tai khoan");

    private final TabularImportParserService parserService;
    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    public StudentImportPreviewResponse preview(MultipartFile file, String defaultRoleValue) {
        List<TabularImportParserService.ParsedRow> parsedRows = parserService.parse(file);
        Role defaultRole = normalizeImportRole(defaultRoleValue).orElse(Role.STUDENT);
        SequenceState sequenceState = new SequenceState(
                userRepository.countByRole(Role.STUDENT) + 1,
                userRepository.countByRole(Role.LECTURER) + 1
        );
        Set<String> seenEmails = new HashSet<>();
        Set<String> seenIdentifiers = new HashSet<>();
        List<StudentImportRowDto> rows = new ArrayList<>();

        for (TabularImportParserService.ParsedRow parsedRow : parsedRows) {
            StudentImportRowDto row = buildPreviewRow(parsedRow, defaultRole, sequenceState);
            trackFileDuplicates(row, seenEmails, seenIdentifiers);
            rows.add(row);
        }

        long readyRows = rows.stream().filter(StudentImportRowDto::isReady).count();
        long createCount = rows.stream().filter(row -> "CREATE".equals(row.getOperation())).count();
        long updateCount = rows.stream().filter(row -> "UPDATE".equals(row.getOperation())).count();

        return StudentImportPreviewResponse.builder()
                .rows(rows)
                .totalRows(rows.size())
                .readyRows((int) readyRows)
                .createCount((int) createCount)
                .updateCount((int) updateCount)
                .build();
    }

    public Map<String, Object> apply(StudentImportApplyRequest request) {
        if (request == null || request.getRows() == null || request.getRows().isEmpty()) {
            throw new BadRequestException("Không có dữ liệu import để lưu");
        }

        String defaultPassword = normalizePassword(request.getDefaultPassword());
        SequenceState sequenceState = new SequenceState(
                userRepository.countByRole(Role.STUDENT) + 1,
                userRepository.countByRole(Role.LECTURER) + 1
        );
        Set<String> seenEmails = new HashSet<>();
        Set<String> seenIdentifiers = new HashSet<>();
        List<UserResponse> savedUsers = new ArrayList<>();
        int created = 0;
        int updated = 0;

        for (StudentImportRowDto sourceRow : request.getRows()) {
            StudentImportRowDto validated = validateEditableRow(sourceRow, sequenceState);
            trackFileDuplicates(validated, seenEmails, seenIdentifiers);

            if (!validated.isReady()) {
                throw new BadRequestException("Dữ liệu import còn lỗi ở dòng " + validated.getRowNumber());
            }

            Role targetRole = requireImportRole(validated.getRole());
            Department department = resolveDepartment(validated.getDepartmentId()).orElse(null);
            User existing = findExistingUser(validated.getEmail(), validated.getStudentId()).orElse(null);

            if ("UPDATE".equals(validated.getOperation())) {
                if (existing == null) {
                    throw new BadRequestException("Không tìm thấy tài khoản để cập nhật ở dòng " + validated.getRowNumber());
                }

                existing.setName(validated.getName());
                existing.setEmail(validated.getEmail());
                existing.setRole(targetRole);
                existing.setDepartment(department);
                existing.setPhone(blankToNull(validated.getPhone()));
                existing.setStudentId(validated.getStudentId());
                updated++;
                savedUsers.add(mapToResponse(userRepository.save(existing)));
                continue;
            }

            if (existing != null) {
                throw new BadRequestException("Dòng " + validated.getRowNumber() + " đang trùng với tài khoản đã tồn tại");
            }

            User user = User.builder()
                    .name(validated.getName())
                    .email(validated.getEmail())
                    .password(passwordEncoder.encode(defaultPassword))
                    .role(targetRole)
                    .department(department)
                    .phone(blankToNull(validated.getPhone()))
                    .studentId(validated.getStudentId())
                    .avatarUrl(null)
                    .build();
            created++;
            savedUsers.add(mapToResponse(userRepository.save(user)));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("createdCount", created);
        result.put("updatedCount", updated);
        result.put("totalCount", created + updated);
        result.put("defaultPassword", defaultPassword);
        result.put("users", savedUsers);
        return result;
    }

    private StudentImportRowDto buildPreviewRow(TabularImportParserService.ParsedRow parsedRow,
                                                Role defaultRole,
                                                SequenceState sequenceState) {
        StudentImportRowDto row = new StudentImportRowDto();
        row.setRowNumber(parsedRow.rowNumber());
        row.setName(normalizeName(findValue(parsedRow.values(), NAME_KEYS)));
        row.setEmail(normalizeEmail(findValue(parsedRow.values(), EMAIL_KEYS)));
        row.setPhone(blankToNull(findValue(parsedRow.values(), PHONE_KEYS)));

        String rawRole = findValue(parsedRow.values(), ROLE_KEYS);
        Role role = resolveRole(rawRole, defaultRole, row.getIssues());
        row.setRole(role.name());

        String rawIdentifier = blankToNull(findValue(parsedRow.values(), IDENTIFIER_KEYS));
        row.setStudentId(rawIdentifier);

        String departmentRef = blankToNull(findValue(parsedRow.values(), DEPARTMENT_KEYS));
        Optional<Department> department = resolveDepartment(departmentRef);
        row.setDepartmentId(department.map(Department::getId).orElse(blankToNull(departmentRef)));

        if (!StringUtils.hasText(row.getName())) {
            row.getIssues().add("Thiếu họ tên");
        }

        if (!StringUtils.hasText(row.getEmail())) {
            row.getIssues().add("Thiếu email");
        } else if (!isValidEmail(row.getEmail())) {
            row.getIssues().add("Email không hợp lệ");
        }

        if (StringUtils.hasText(departmentRef) && department.isEmpty()) {
            row.getIssues().add("Không tìm thấy khoa");
        }

        User existing = findExistingUser(row.getEmail(), row.getStudentId()).orElse(null);
        if (existing != null) {
            if (!StringUtils.hasText(rawRole) && (existing.getRole() == Role.STUDENT || existing.getRole() == Role.LECTURER)) {
                role = existing.getRole();
                row.setRole(role.name());
            }
            row.setOperation("UPDATE");
            if (!StringUtils.hasText(row.getName())) {
                row.setName(existing.getName());
            }
            if (!StringUtils.hasText(row.getPhone())) {
                row.setPhone(existing.getPhone());
            }
            if (!StringUtils.hasText(rawIdentifier)) {
                row.setStudentId(existing.getStudentId());
            }
            if (!StringUtils.hasText(row.getDepartmentId()) && existing.getDepartment() != null) {
                row.setDepartmentId(existing.getDepartment().getId());
            }
        } else {
            row.setOperation("CREATE");
        }

        if (!StringUtils.hasText(row.getStudentId())) {
            row.setStudentId(generateIdentifier(role, sequenceState.next(role)));
            row.getIssues().add("Đã tự sinh " + codeLabel(role) + ", cần kiểm tra lại");
        }

        refreshReady(row);
        return row;
    }

    private StudentImportRowDto validateEditableRow(StudentImportRowDto source, SequenceState sequenceState) {
        StudentImportRowDto row = new StudentImportRowDto();
        row.setRowNumber(source.getRowNumber());
        row.setName(normalizeName(source.getName()));
        row.setEmail(normalizeEmail(source.getEmail()));
        row.setStudentId(blankToNull(source.getStudentId()));
        row.setDepartmentId(blankToNull(source.getDepartmentId()));
        row.setPhone(blankToNull(source.getPhone()));

        Role role = parseEditableRole(source.getRole(), row.getIssues());
        row.setRole(role == null ? blankToNull(source.getRole()) : role.name());

        if (!StringUtils.hasText(row.getName())) {
            row.getIssues().add("Thiếu họ tên");
        }

        if (!StringUtils.hasText(row.getEmail())) {
            row.getIssues().add("Thiếu email");
        } else if (!isValidEmail(row.getEmail())) {
            row.getIssues().add("Email không hợp lệ");
        }

        if (role != null && !StringUtils.hasText(row.getStudentId())) {
            row.setStudentId(generateIdentifier(role, sequenceState.next(role)));
            row.getIssues().add("Đã tự sinh " + codeLabel(role) + ", cần kiểm tra lại");
        }

        if (StringUtils.hasText(row.getDepartmentId()) && resolveDepartment(row.getDepartmentId()).isEmpty()) {
            row.getIssues().add("Không tìm thấy khoa");
        }

        Optional<User> conflictingByEmail = StringUtils.hasText(row.getEmail())
                ? userRepository.findByEmail(row.getEmail())
                : Optional.empty();
        Optional<User> conflictingByIdentifier = StringUtils.hasText(row.getStudentId())
                ? userRepository.findByStudentId(row.getStudentId())
                : Optional.empty();

        if (conflictingByEmail.isPresent() && conflictingByIdentifier.isPresent()
                && !conflictingByEmail.get().getId().equals(conflictingByIdentifier.get().getId())) {
            row.getIssues().add("Email và mã đang trỏ tới hai tài khoản khác nhau");
        }

        User existing = findExistingUser(row.getEmail(), row.getStudentId()).orElse(null);
        String operation = normalizeOperation(source.getOperation());
        if (!StringUtils.hasText(operation)) {
            operation = existing == null ? "CREATE" : "UPDATE";
        }

        if ("CREATE".equals(operation) && existing != null) {
            row.getIssues().add("Dữ liệu đã tồn tại, hãy chọn cập nhật hoặc đổi email/mã");
        }

        if ("UPDATE".equals(operation) && existing == null) {
            row.getIssues().add("Không tìm thấy tài khoản để cập nhật");
        }

        row.setOperation(operation);
        refreshReady(row);
        return row;
    }

    private void trackFileDuplicates(StudentImportRowDto row, Set<String> seenEmails, Set<String> seenIdentifiers) {
        String emailKey = safeLower(row.getEmail());
        if (StringUtils.hasText(emailKey) && !seenEmails.add(emailKey)) {
            row.getIssues().add("Email bị trùng trong file import");
        }

        String identifierKey = safeLower(row.getStudentId());
        if (StringUtils.hasText(identifierKey) && !seenIdentifiers.add(identifierKey)) {
            row.getIssues().add("Mã tài khoản bị trùng trong file import");
        }

        refreshReady(row);
    }

    private void refreshReady(StudentImportRowDto row) {
        boolean blocking = row.getIssues().stream().anyMatch(this::isBlockingIssue);
        row.setReady(!blocking);
    }

    private boolean isBlockingIssue(String issue) {
        String normalized = safeLower(issue);
        return normalized.contains("thiếu")
                || normalized.contains("không tìm thấy")
                || normalized.contains("khong tim thay")
                || normalized.contains("không hợp lệ")
                || normalized.contains("khong hop le")
                || normalized.contains("trùng")
                || normalized.contains("trung")
                || normalized.contains("hai tài khoản")
                || normalized.contains("hai tai khoan")
                || normalized.contains("hãy chọn")
                || normalized.contains("hay chon");
    }

    private Optional<User> findExistingUser(String email, String studentId) {
        Optional<User> byEmail = StringUtils.hasText(email) ? userRepository.findByEmail(email) : Optional.empty();
        if (byEmail.isPresent()) {
            return byEmail;
        }
        return StringUtils.hasText(studentId) ? userRepository.findByStudentId(studentId) : Optional.empty();
    }

    private Optional<Department> resolveDepartment(String reference) {
        if (!StringUtils.hasText(reference)) {
            return Optional.empty();
        }

        String normalized = reference.trim();
        Optional<Department> byId = departmentRepository.findById(normalized);
        if (byId.isPresent()) {
            return byId;
        }

        Optional<Department> byCode = departmentRepository.findByCode(normalized.toUpperCase(Locale.ROOT));
        if (byCode.isPresent()) {
            return byCode;
        }

        return departmentRepository.findAll().stream()
                .filter(department -> department.getName() != null
                        && department.getName().trim().equalsIgnoreCase(normalized))
                .findFirst();
    }

    private String findValue(Map<String, String> values, List<String> aliases) {
        for (String alias : aliases) {
            String normalizedAlias = normalizeAlias(alias);
            for (Map.Entry<String, String> entry : values.entrySet()) {
                if (entry.getKey().equals(normalizedAlias)) {
                    return entry.getValue();
                }
            }
        }
        return null;
    }

    private Role resolveRole(String rawRole, Role defaultRole, List<String> issues) {
        if (!StringUtils.hasText(rawRole)) {
            return defaultRole;
        }

        Optional<Role> parsedRole = normalizeImportRole(rawRole);
        if (parsedRole.isPresent()) {
            return parsedRole.get();
        }

        issues.add("Vai trò không hợp lệ, chỉ hỗ trợ Sinh viên hoặc Giảng viên");
        return defaultRole;
    }

    private Role parseEditableRole(String rawRole, List<String> issues) {
        Optional<Role> parsedRole = normalizeImportRole(rawRole);
        if (parsedRole.isPresent()) {
            return parsedRole.get();
        }

        issues.add("Vai trò không hợp lệ, chỉ hỗ trợ Sinh viên hoặc Giảng viên");
        return null;
    }

    private Optional<Role> normalizeImportRole(String rawRole) {
        if (!StringUtils.hasText(rawRole)) {
            return Optional.empty();
        }

        String normalized = Normalizer.normalize(rawRole.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replace("_", " ")
                .replace("-", " ")
                .replaceAll("\\s+", " ");

        if (List.of("student", "sinh vien", "sinhvien", "sv").contains(normalized)) {
            return Optional.of(Role.STUDENT);
        }

        if (List.of("lecturer", "giang vien", "giangvien", "gv", "teacher").contains(normalized)) {
            return Optional.of(Role.LECTURER);
        }

        return Optional.empty();
    }

    private Role requireImportRole(String rawRole) {
        return normalizeImportRole(rawRole)
                .orElseThrow(() -> new BadRequestException("Vai trò import không hợp lệ"));
    }

    private String normalizeOperation(String operation) {
        if (!StringUtils.hasText(operation)) {
            return null;
        }

        String normalized = operation.trim().toUpperCase(Locale.ROOT);
        return List.of("CREATE", "UPDATE").contains(normalized) ? normalized : null;
    }

    private String normalizeAlias(String alias) {
        return alias == null
                ? ""
                : alias.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", " ").trim();
    }

    private String normalizeName(String name) {
        return blankToNull(name == null ? null : name.trim());
    }

    private String normalizeEmail(String email) {
        return blankToNull(email == null ? null : email.trim().toLowerCase(Locale.ROOT));
    }

    private boolean isValidEmail(String email) {
        return email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    }

    private String generateIdentifier(Role role, long sequence) {
        String prefix = role == Role.LECTURER ? "GV" : "SV";
        return prefix + Year.now().getValue() + String.format(Locale.ROOT, "%04d", sequence);
    }

    private String codeLabel(Role role) {
        return role == Role.LECTURER ? "mã giảng viên" : "mã sinh viên";
    }

    private String normalizePassword(String input) {
        String normalized = blankToNull(input);
        return normalized == null ? "123456" : normalized;
    }

    private String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safeLower(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private UserResponse mapToResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getPhone(),
                user.getStudentId(),
                user.getDepartment() != null ? user.getDepartment().getId() : null,
                user.getSchoolClass() != null ? user.getSchoolClass().getId() : null,
                user.getAvatarUrl()
        );
    }

    private static final class SequenceState {
        private long nextStudent;
        private long nextLecturer;

        private SequenceState(long nextStudent, long nextLecturer) {
            this.nextStudent = nextStudent;
            this.nextLecturer = nextLecturer;
        }

        private long next(Role role) {
            if (role == Role.LECTURER) {
                return nextLecturer++;
            }
            return nextStudent++;
        }
    }
}
