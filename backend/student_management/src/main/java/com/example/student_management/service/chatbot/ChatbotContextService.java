package com.example.student_management.service.chatbot;

import com.example.student_management.entity.*;
import com.example.student_management.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatbotContextService {

    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeRepository gradeRepository;
    private final AttendanceRepository attendanceRepository;
    private final SubjectRepository subjectRepository;
    private final SemesterRepository semesterRepository;
    private final CourseSectionRepository courseSectionRepository;

    /**
     * Build context string for AI chatbot with user's data
     */
    public String buildContext(String userId, String userRole) {
        StringBuilder context = new StringBuilder();
        context.append("=== USER INFORMATION ===\n");

        // Get user info
        User user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new RuntimeException("User not found"));

        context.append("Name: ").append(user.getName()).append("\n");
        context.append("Email: ").append(user.getEmail()).append("\n");
        context.append("Role: ").append(userRole).append("\n");
        if (user.getStudentId() != null) {
            context.append("Student ID: ").append(user.getStudentId()).append("\n");
        }
        if (user.getPhone() != null) {
            context.append("Phone: ").append(user.getPhone()).append("\n");
        }
        if (user.getSchoolClass() != null) {
            context.append("Class: ").append(user.getSchoolClass().getName()).append("\n");
        }
        if (user.getDepartment() != null) {
            context.append("Department: ").append(user.getDepartment().getName()).append("\n");
        }

        // Role-specific context
        if ("STUDENT".equals(userRole)) {
            context.append("\n=== ACADEMIC PERFORMANCE ===\n");
            buildStudentContext(context, user.getStudentId());
        } else if ("LECTURER".equals(userRole)) {
            context.append("\n=== TEACHING INFORMATION ===\n");
            buildLecturerContext(context, user.getId().toString());
        } else if ("ADMIN".equals(userRole)) {
            context.append("\n=== SYSTEM OVERVIEW ===\n");
            buildAdminContext(context);
        }

        context.append("\n=== AVAILABLE ACTIONS ===\n");
        context.append("- Query about grades, GPA, attendance\n");
        context.append("- Check enrolled courses\n");
        context.append("- Ask about course information\n");
        context.append("- Request early warning alerts (students)\n");
        context.append("- Query class schedules\n");
        context.append("- Ask about semester information\n");

        return context.toString();
    }

    private void buildStudentContext(StringBuilder context, String studentId) {
        if (studentId == null || studentId.isEmpty()) {
            context.append("No student ID found.\n");
            return;
        }

        // Get enrolled courses
        List<EnrollmentEntity> enrollments = enrollmentRepository.findByStudentId(studentId);
        context.append("Enrolled Courses: ").append(enrollments.size()).append("\n");

        // Get grades and calculate GPA
        List<GradeEntity> grades = gradeRepository.findByStudentId(studentId);

        if (!grades.isEmpty()) {
            double totalGpaPoints = 0;
            int failedCourses = 0;
            List<String> gradeDetails = new ArrayList<>();

            for (GradeEntity grade : grades) {
                String subjectName = getSubjectNameBySection(grade.getCourseSectionId());
                String gradeInfo = String.format("  - %s: %.2f (GPA: %.2f)",
                    subjectName,
                    grade.getTotalScore() != null ? grade.getTotalScore() : 0,
                    grade.getGpaPoint() != null ? grade.getGpaPoint() : 0
                );
                gradeDetails.add(gradeInfo);

                if (grade.getGpaPoint() != null) {
                    totalGpaPoints += grade.getGpaPoint();
                }
                if (grade.getLetterGrade() != null && grade.getLetterGrade().equals("F")) {
                    failedCourses++;
                }
            }

            context.append("Grade Details:\n");
            context.append(String.join("\n", gradeDetails)).append("\n");

            double averageGpa = totalGpaPoints / Math.max(grades.size(), 1);
            context.append("Current GPA: ").append(String.format("%.2f", averageGpa)).append("\n");
            context.append("Failed Courses: ").append(failedCourses).append("\n");
        } else {
            context.append("No grades recorded yet.\n");
        }

        // Get attendance summary
        List<AttendanceEntity> attendances = attendanceRepository.findByStudentId(studentId);
        if (!attendances.isEmpty()) {
            double attendanceRate = attendances.stream()
                .filter(a -> a.getStatus() == AttendanceEntity.Status.PRESENT || a.getStatus() == AttendanceEntity.Status.LATE)
                .count() * 100.0 / attendances.size();
            context.append("Average Attendance: ").append(String.format("%.1f%%", attendanceRate)).append("\n");
        }

        // Get current semester courses
        context.append("\n=== ENROLLED COURSES ===\n");
        for (EnrollmentEntity enrollment : enrollments) {
            String subjectName = getSubjectNameBySection(enrollment.getCourseSectionId());
            context.append("  - ").append(subjectName).append(" (Section: ").append(enrollment.getCourseSectionId()).append(")\n");
        }
    }

    private void buildLecturerContext(StringBuilder context, String lecturerId) {
        // Get courses taught by this lecturer
        List<CourseSectionEntity> sections = courseSectionRepository.findAll()
            .stream()
            .filter(s -> s.getLecturerId().equals(lecturerId))
            .collect(Collectors.toList());

        context.append("Courses Taught: ").append(sections.size()).append("\n");
        for (CourseSectionEntity section : sections) {
            String subjectName = getSubjectName(section.getSubjectId());
            context.append("  - ").append(subjectName)
                   .append(" (Section: ").append(section.getId())
                   .append(", Room: ").append(section.getRoom() != null ? section.getRoom() : "N/A")
                   .append(")\n");
        }

        // Get student performance for each course
        context.append("\n=== STUDENT PERFORMANCE ===\n");
        for (CourseSectionEntity section : sections) {
            List<GradeEntity> grades = gradeRepository.findByCourseSectionId(section.getId());
            if (!grades.isEmpty()) {
                double avgScore = grades.stream()
                    .filter(g -> g.getTotalScore() != null)
                    .mapToDouble(GradeEntity::getTotalScore)
                    .average()
                    .orElse(0);
                context.append(getSubjectName(section.getSubjectId()))
                       .append(": Avg Score = ")
                       .append(String.format("%.1f", avgScore))
                       .append(" (").append(grades.size()).append(" students)\n");
            }
        }
    }

    private void buildAdminContext(StringBuilder context) {
        // System statistics
        long totalUsers = userRepository.count();
        long totalStudents = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.STUDENT)
            .count();
        long totalLecturers = userRepository.findAll().stream()
            .filter(u -> u.getRole() == Role.LECTURER)
            .count();
        long totalSubjects = subjectRepository.count();
        long totalEnrollments = enrollmentRepository.count();

        context.append("Total Users: ").append(totalUsers).append("\n");
        context.append("  - Students: ").append(totalStudents).append("\n");
        context.append("  - Lecturers: ").append(totalLecturers).append("\n");
        context.append("Total Subjects: ").append(totalSubjects).append("\n");
        context.append("Total Enrollments: ").append(totalEnrollments).append("\n");

        // Recent semesters
        List<SemesterEntity> semesters = semesterRepository.findAll();
        context.append("\n=== SEMESTERS ===\n");
        for (SemesterEntity semester : semesters) {
            context.append("  - ").append(semester.getName())
                   .append(" (").append(semester.getAcademicYear()).append(") [")
                   .append(semester.getStatus()).append("]\n");
        }
    }

    private String getSubjectNameBySection(String sectionId) {
        try {
            CourseSectionEntity section = courseSectionRepository.findById(sectionId).orElse(null);
            if (section != null) {
                return getSubjectName(section.getSubjectId());
            }
        } catch (Exception e) {
            // Ignore and return unknown
        }
        return "Unknown Course";
    }

    private String getSubjectName(String subjectId) {
        try {
            SubjectEntity subject = subjectRepository.findById(subjectId).orElse(null);
            if (subject != null) {
                return subject.getName();
            }
        } catch (Exception e) {
            // Ignore and return unknown
        }
        return "Unknown Subject";
    }
}
