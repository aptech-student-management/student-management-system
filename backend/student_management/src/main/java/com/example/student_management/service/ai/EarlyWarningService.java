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
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class EarlyWarningService {

    private final AttendanceRepository attendanceRepository;
    private final GradeRepository gradeRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public EarlyWarningService(AttendanceRepository attendanceRepository,
                               GradeRepository gradeRepository,
                               EnrollmentRepository enrollmentRepository,
                               UserRepository userRepository) {
        this.attendanceRepository = attendanceRepository;
        this.gradeRepository = gradeRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    public EarlyWarningResponse evaluateStudent(String studentId) {
        Optional<User> student = userRepository.findByStudentId(studentId);

        List<AttendanceEntity> attendanceRecords = attendanceRepository.findByStudentId(studentId);
        List<GradeEntity> grades = gradeRepository.findByStudentId(studentId);
        List<EnrollmentEntity> enrollments = enrollmentRepository
                .findByStudentIdAndStatus(studentId, EnrollmentEntity.Status.ENROLLED);

        int totalAttendance = attendanceRecords.size();
        long presentCount = attendanceRecords.stream()
                .filter(record -> record.getStatus() == AttendanceEntity.Status.PRESENT)
                .count();

        double attendanceRate = totalAttendance == 0
                ? 1.0
                : (double) presentCount / totalAttendance;

        List<Double> gpaPoints = grades.stream()
                .map(GradeEntity::getGpaPoint)
                .filter(point -> point != null)
                .toList();

        Double averageGpa = gpaPoints.isEmpty()
                ? null
                : gpaPoints.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);

        int failedCourseCount = (int) grades.stream()
                .filter(this::isFailedCourse)
                .count();

        double riskScore = calculateRiskScore(attendanceRate, averageGpa, failedCourseCount, enrollments.size());
        String riskLevel = getRiskLevel(riskScore);

        return EarlyWarningResponse.builder()
                .studentId(studentId)
                .studentName(student.map(User::getName).orElse("Không xác định"))
                .riskScore(riskScore)
                .riskLevel(riskLevel)
                .attendanceRate(attendanceRate)
                .averageGpa(averageGpa)
                .failedCourseCount(failedCourseCount)
                .enrolledCourseCount(enrollments.size())
                .recommendations(buildRecommendations(riskLevel, attendanceRate, averageGpa, failedCourseCount))
                .build();
    }

    public List<EarlyWarningResponse> evaluateAllStudents() {
        return userRepository.findByRole(Role.STUDENT).stream()
                .map(User::getStudentId)
                .filter(studentId -> studentId != null && !studentId.isBlank())
                .distinct()
                .map(this::evaluateStudent)
                .sorted(Comparator.comparing(EarlyWarningResponse::getRiskScore).reversed())
                .toList();
    }

    private boolean isFailedCourse(GradeEntity grade) {
        if (grade.getGpaPoint() != null) {
            return grade.getGpaPoint() < 2.0;
        }
        if (grade.getTotalScore() != null) {
            return grade.getTotalScore() < 5.0;
        }
        return false;
    }

    private double calculateRiskScore(double attendanceRate, Double averageGpa, int failedCourseCount, int enrolledCount) {
        double attendanceRisk = (1 - attendanceRate) * 45;
        double gpaRisk = averageGpa == null
                ? 18
                : Math.max(0, (4 - averageGpa) / 4 * 35);
        double failedRisk = Math.min(failedCourseCount * 10.0, 20);
        double loadRisk = enrolledCount >= 7 ? 8 : 0;

        double score = attendanceRisk + gpaRisk + failedRisk + loadRisk;
        return Math.min(Math.max(score, 0), 100);
    }

    private String getRiskLevel(double riskScore) {
        if (riskScore >= 70) return "HIGH";
        if (riskScore >= 40) return "MEDIUM";
        return "LOW";
    }

    private List<String> buildRecommendations(String riskLevel,
                                              double attendanceRate,
                                              Double averageGpa,
                                              int failedCourseCount) {
        List<String> recommendations = new ArrayList<>();

        if ("HIGH".equals(riskLevel)) {
            recommendations.add("Cần liên hệ cố vấn học tập trong tuần này để xây dựng kế hoạch cải thiện.");
            recommendations.add("Giảm tải số môn đăng ký ở học kỳ tiếp theo để tập trung vào các môn trọng tâm.");
        }

        if (attendanceRate < 0.8) {
            recommendations.add("Tăng tỷ lệ chuyên cần lên tối thiểu 80% để giảm nguy cơ trượt môn.");
        }

        if (averageGpa == null || averageGpa < 2.5) {
            recommendations.add("Ôn tập lại các môn nền tảng và tham gia nhóm học tập theo tuần.");
        }

        if (failedCourseCount > 0) {
            recommendations.add("Ưu tiên học lại các môn đã trượt trước khi đăng ký môn mới khó.");
        }

        if (recommendations.isEmpty()) {
            recommendations.add("Tiếp tục duy trì hiệu suất hiện tại và theo dõi điểm theo từng tuần.");
        }

        return recommendations;
    }
}
