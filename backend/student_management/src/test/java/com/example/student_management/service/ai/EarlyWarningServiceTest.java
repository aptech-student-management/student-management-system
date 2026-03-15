package com.example.student_management.service.ai;

import com.example.student_management.dto.ai.EarlyWarningResponse;
import com.example.student_management.entity.AttendanceEntity;
import com.example.student_management.entity.EnrollmentEntity;
import com.example.student_management.entity.GradeEntity;
import com.example.student_management.entity.Role;
import com.example.student_management.entity.User;
import com.example.student_management.repository.AttendanceRepository;
import com.example.student_management.repository.EnrollmentRepository;
import com.example.student_management.repository.GradeRepository;
import com.example.student_management.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EarlyWarningServiceTest {

    private AttendanceRepository attendanceRepository;
    private GradeRepository gradeRepository;
    private EnrollmentRepository enrollmentRepository;
    private UserRepository userRepository;
    private EarlyWarningService earlyWarningService;

    @BeforeEach
    void setUp() {
        attendanceRepository = mock(AttendanceRepository.class);
        gradeRepository = mock(GradeRepository.class);
        enrollmentRepository = mock(EnrollmentRepository.class);
        userRepository = mock(UserRepository.class);

        earlyWarningService = new EarlyWarningService(
                attendanceRepository,
                gradeRepository,
                enrollmentRepository,
                userRepository
        );
    }

    @Test
    void evaluateStudent_shouldReturnHighRisk_whenAttendanceAndGpaAreLow() {
        String studentId = "SV001";

        when(userRepository.findByStudentId(studentId))
                .thenReturn(Optional.of(student(studentId, "Nguyen Van A")));

        when(attendanceRepository.findByStudentId(studentId)).thenReturn(List.of(
                attendance(studentId, AttendanceEntity.Status.ABSENT),
                attendance(studentId, AttendanceEntity.Status.ABSENT),
                attendance(studentId, AttendanceEntity.Status.PRESENT)
        ));

        when(gradeRepository.findByStudentId(studentId)).thenReturn(List.of(
                grade(studentId, 1.5, 4.5),
                grade(studentId, 1.8, 4.8)
        ));

        when(enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentEntity.Status.ENROLLED))
                .thenReturn(List.of(enrollment(studentId), enrollment(studentId)));

        EarlyWarningResponse result = earlyWarningService.evaluateStudent(studentId);

        assertEquals(studentId, result.getStudentId());
        assertEquals("Nguyen Van A", result.getStudentName());
        assertEquals("HIGH", result.getRiskLevel());
        assertTrue(result.getRiskScore() >= 70);
        assertEquals(2, result.getFailedCourseCount());
        assertTrue(result.getRecommendations().stream()
                .anyMatch(item -> item.contains("cố vấn học tập")));
    }

    @Test
    void evaluateStudent_shouldReturnLowRisk_whenLearningDataIsGood() {
        String studentId = "SV002";

        when(userRepository.findByStudentId(studentId))
                .thenReturn(Optional.of(student(studentId, "Tran Thi B")));

        when(attendanceRepository.findByStudentId(studentId)).thenReturn(List.of(
                attendance(studentId, AttendanceEntity.Status.PRESENT),
                attendance(studentId, AttendanceEntity.Status.PRESENT),
                attendance(studentId, AttendanceEntity.Status.PRESENT)
        ));

        when(gradeRepository.findByStudentId(studentId)).thenReturn(List.of(
                grade(studentId, 3.3, 8.0),
                grade(studentId, 3.6, 8.5)
        ));

        when(enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentEntity.Status.ENROLLED))
                .thenReturn(List.of(enrollment(studentId), enrollment(studentId)));

        EarlyWarningResponse result = earlyWarningService.evaluateStudent(studentId);

        assertEquals("LOW", result.getRiskLevel());
        assertTrue(result.getRiskScore() < 40);
        assertEquals(0, result.getFailedCourseCount());
        assertEquals(1.0, result.getAttendanceRate());
    }

    @Test
    void evaluateAllStudents_shouldSortByRiskScoreDesc() {
        User highRiskStudent = student("SV-HIGH", "High");
        User lowRiskStudent = student("SV-LOW", "Low");

        when(userRepository.findByRole(Role.STUDENT)).thenReturn(List.of(lowRiskStudent, highRiskStudent));

        // HIGH
        when(userRepository.findByStudentId("SV-HIGH")).thenReturn(Optional.of(highRiskStudent));
        when(attendanceRepository.findByStudentId("SV-HIGH")).thenReturn(List.of(
                attendance("SV-HIGH", AttendanceEntity.Status.ABSENT),
                attendance("SV-HIGH", AttendanceEntity.Status.PRESENT)
        ));
        when(gradeRepository.findByStudentId("SV-HIGH")).thenReturn(List.of(grade("SV-HIGH", 1.7, 4.9)));
        when(enrollmentRepository.findByStudentIdAndStatus("SV-HIGH", EnrollmentEntity.Status.ENROLLED))
                .thenReturn(List.of(enrollment("SV-HIGH")));

        // LOW
        when(userRepository.findByStudentId("SV-LOW")).thenReturn(Optional.of(lowRiskStudent));
        when(attendanceRepository.findByStudentId("SV-LOW")).thenReturn(List.of(
                attendance("SV-LOW", AttendanceEntity.Status.PRESENT),
                attendance("SV-LOW", AttendanceEntity.Status.PRESENT)
        ));
        when(gradeRepository.findByStudentId("SV-LOW")).thenReturn(List.of(grade("SV-LOW", 3.7, 8.8)));
        when(enrollmentRepository.findByStudentIdAndStatus("SV-LOW", EnrollmentEntity.Status.ENROLLED))
                .thenReturn(List.of(enrollment("SV-LOW")));

        List<EarlyWarningResponse> responses = earlyWarningService.evaluateAllStudents();

        assertEquals(2, responses.size());
        assertEquals("SV-HIGH", responses.get(0).getStudentId());
        assertEquals("SV-LOW", responses.get(1).getStudentId());
        assertTrue(responses.get(0).getRiskScore() >= responses.get(1).getRiskScore());
    }

    private User student(String studentId, String name) {
        return User.builder()
                .name(name)
                .studentId(studentId)
                .role(Role.STUDENT)
                .email(studentId + "@mail.com")
                .password("secret")
                .build();
    }

    private AttendanceEntity attendance(String studentId, AttendanceEntity.Status status) {
        return AttendanceEntity.builder()
                .id("ATT-" + studentId + "-" + status)
                .studentId(studentId)
                .courseSectionId("CS-01")
                .date(LocalDate.now())
                .status(status)
                .build();
    }

    private GradeEntity grade(String studentId, Double gpaPoint, Double totalScore) {
        return GradeEntity.builder()
                .id("G-" + studentId + "-" + gpaPoint)
                .studentId(studentId)
                .courseSectionId("CS-01")
                .gpaPoint(gpaPoint)
                .totalScore(totalScore)
                .build();
    }

    private EnrollmentEntity enrollment(String studentId) {
        return EnrollmentEntity.builder()
                .id("ENR-" + studentId)
                .studentId(studentId)
                .courseSectionId("CS-01")
                .status(EnrollmentEntity.Status.ENROLLED)
                .build();
    }
}
