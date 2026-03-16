package com.example.student_management.service.chatbot;

import com.example.student_management.dto.ai.EarlyWarningResponse;
import com.example.student_management.dto.chatbot.ChatbotRequest;
import com.example.student_management.dto.chatbot.ChatbotResponse;
import com.example.student_management.service.ai.EarlyWarningService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

@Service
public class ChatbotService {

    private final EarlyWarningService earlyWarningService;

    public ChatbotService(EarlyWarningService earlyWarningService) {
        this.earlyWarningService = earlyWarningService;
    }

    public ChatbotResponse reply(ChatbotRequest request) {
        if (request == null) {
            return ChatbotResponse.builder()
                    .intent("EMPTY")
                    .reply("Bạn hãy nhập câu hỏi để mình hỗ trợ nhé.")
                    .suggestions(defaultSuggestions(null))
                    .build();
        }

        String message = safeLower(request.getMessage());

        if (message.isBlank()) {
            return ChatbotResponse.builder()
                    .intent("EMPTY")
                    .reply("Bạn hãy nhập câu hỏi để mình hỗ trợ nhé.")
                    .suggestions(defaultSuggestions(request.getRole()))
                    .build();
        }

        if (containsAny(message, "hello", "hi", "xin chào", "chào")) {
            return ChatbotResponse.builder()
                    .intent("GREETING")
                    .reply("Xin chào! Mình có thể hỗ trợ về Early Warning, GPA, đăng ký môn và kế hoạch học tập.")
                    .suggestions(defaultSuggestions(request.getRole()))
                    .build();
        }

        if (containsAny(message, "early warning", "cảnh báo", "nguy cơ", "rủi ro")) {
            return buildEarlyWarningReply(request);
        }

        if (containsAny(message, "gpa", "điểm", "bảng điểm")) {
            return ChatbotResponse.builder()
                    .intent("GPA_GUIDANCE")
                    .reply("Để cải thiện GPA, bạn nên ưu tiên học lại môn có điểm thấp, đặt mục tiêu chuyên cần >= 80%, và chia lịch ôn tập theo từng tuần.")
                    .suggestions(List.of("Xem AI Early Warning", "Mẹo tăng chuyên cần", "Kế hoạch học 4 tuần"))
                    .build();
        }

        if (containsAny(message, "đăng ký", "môn học", "schedule", "thời khóa biểu")) {
            return ChatbotResponse.builder()
                    .intent("REGISTRATION_GUIDANCE")
                    .reply("Khi đăng ký môn, bạn nên cân đối tải học phần, tránh dồn quá nhiều môn khó trong cùng học kỳ và theo dõi lịch học để hạn chế trùng lịch.")
                    .suggestions(List.of("Gợi ý số tín chỉ phù hợp", "Môn nên ưu tiên", "Cách giảm trùng lịch"))
                    .build();
        }

        return ChatbotResponse.builder()
                .intent("GENERAL")
                .reply("Mình có thể hỗ trợ về cảnh báo sớm, GPA, đăng ký môn và kế hoạch học tập. Bạn muốn bắt đầu từ nội dung nào?")
                .suggestions(defaultSuggestions(request.getRole()))
                .build();
    }

    private ChatbotResponse buildEarlyWarningReply(ChatbotRequest request) {
        if (request.getStudentId() == null || request.getStudentId().isBlank()) {
            return ChatbotResponse.builder()
                    .intent("EARLY_WARNING")
                    .reply("Mình cần mã sinh viên để kiểm tra Early Warning. Hãy đăng nhập bằng tài khoản sinh viên hoặc cung cấp studentId.")
                    .suggestions(List.of("Cách lấy studentId", "Hỏi về GPA", "Hỏi về đăng ký môn"))
                    .build();
        }

        try {
            EarlyWarningResponse warning = earlyWarningService.evaluateStudent(request.getStudentId());
            String reply = String.format(
                    Locale.ROOT,
                    "Kết quả Early Warning của bạn: mức %s, điểm rủi ro %.1f/100, chuyên cần %.0f%%, số môn nguy cơ trượt %d. Hành động ưu tiên: %s",
                    warning.getRiskLevel(),
                    warning.getRiskScore(),
                    warning.getAttendanceRate() * 100,
                    warning.getFailedCourseCount(),
                    warning.getRecommendations().isEmpty() ? "Theo dõi tiến độ mỗi tuần." : warning.getRecommendations().get(0)
            );

            return ChatbotResponse.builder()
                    .intent("EARLY_WARNING")
                    .reply(reply)
                    .suggestions(List.of("Xem toàn bộ gợi ý", "Lập kế hoạch học 4 tuần", "Tư vấn cải thiện GPA"))
                    .build();
        } catch (Exception ex) {
            return ChatbotResponse.builder()
                    .intent("EARLY_WARNING")
                    .reply("Mình chưa lấy được dữ liệu Early Warning lúc này. Bạn thử lại sau vài phút hoặc vào Dashboard để xem dữ liệu hiện có.")
                    .suggestions(List.of("Về Dashboard", "Mẹo tăng GPA", "Kế hoạch học 4 tuần"))
                    .build();
        }
    }

    private List<String> defaultSuggestions(String role) {
        if ("LECTURER".equalsIgnoreCase(role)) {
            return List.of("Danh sách sinh viên nguy cơ cao", "Mẹo hỗ trợ sinh viên", "Cách theo dõi chuyên cần");
        }
        if ("ADMIN".equalsIgnoreCase(role)) {
            return List.of("Thống kê risk toàn trường", "Top lớp cần hỗ trợ", "Giám sát Early Warning");
        }
        return List.of("Kiểm tra Early Warning", "Mẹo tăng GPA", "Kế hoạch học tập tuần này");
    }

    private boolean containsAny(String source, String... keywords) {
        for (String keyword : keywords) {
            if (source.contains(keyword)) return true;
        }
        return false;
    }

    private String safeLower(String input) {
        return input == null ? "" : input.toLowerCase(Locale.ROOT).trim();
    }
}
