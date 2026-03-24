package com.example.student_management.service.chatbot;

import com.example.student_management.dto.ai.EarlyWarningResponse;
import com.example.student_management.dto.chatbot.ChatbotRequest;
import com.example.student_management.dto.chatbot.ChatbotResponse;
import com.example.student_management.service.ai.EarlyWarningService;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final EarlyWarningService earlyWarningService;
    private final WebClient webClient;

    public ChatbotService(EarlyWarningService earlyWarningService) {
        this.earlyWarningService = earlyWarningService;
        this.webClient = WebClient.builder().build();
    }

    public ChatbotResponse reply(ChatbotRequest request) {
        if (request == null || request.getMessage() == null) {
            return ChatbotResponse.builder()
                    .intent("EMPTY")
                    .reply("Bạn hãy nhập câu hỏi để mình hỗ trợ nhé.")
                    .suggestions(defaultSuggestions(request != null ? request.getRole() : null))
                    .build();
        }

        String message = safeLower(request.getMessage());
        log.info("Nhận message từ user: {}", message);

        // ====================
        // Rule-based intents
        // ====================
        if (containsAny(message, "xin chào", "hello", "hi")) {
            return ChatbotResponse.builder()
                    .intent("GREETING")
                    .reply("Chào bạn! Mình có thể giúp gì hôm nay?")
                    .suggestions(defaultSuggestions(request.getRole()))
                    .build();
        }

        if (containsAny(message, "gpa", "điểm", "học lực")) {
            return ChatbotResponse.builder()
                    .intent("GPA_TIPS")
                    .reply("Để tăng GPA, bạn nên ôn tập đều, tham gia đầy đủ bài giảng, và hoàn thành bài tập đúng hạn.")
                    .suggestions(List.of("Xem bảng điểm", "Kế hoạch học tập"))
                    .build();
        }

        if (containsAny(message, "early warning", "cảnh báo", "nguy cơ", "rủi ro")) {
            return buildEarlyWarningReply(request);
        }

        if (containsAny(message, "lịch học", "thời khóa biểu", "schedule")) {
            return ChatbotResponse.builder()
                    .intent("SCHEDULE")
                    .reply("Bạn có thể xem thời khóa biểu chi tiết tại hệ thống quản lý học tập của mình.")
                    .suggestions(List.of("Xem lịch học", "Đăng ký môn học"))
                    .build();
        }

        // ====================
        // AI-generated response
        // ====================
        String aiReply = callGeminiAI(request);

        return ChatbotResponse.builder()
                .intent("AI_GENERATED")
                .reply(aiReply)
                .suggestions(defaultSuggestions(request.getRole()))
                .build();
    }

    // ====================
    // Gọi AI (Gemini)
    // ====================
    private String callGeminiAI(ChatbotRequest request) {
        try {
            // ===== NHIỀU PROMPT XỊN =====
            String[] prompts = new String[]{
                    "Bạn là trợ lý ảo thông minh của hệ thống quản lý học tập. Trả lời ngắn gọn, dễ hiểu bằng tiếng Việt.",
                    "Bạn là trợ lý AI hỗ trợ sinh viên và giảng viên. Chỉ trả lời liên quan GPA, Early Warning, điểm chuyên cần, lịch học.",
                    "Bạn là chatbot học tập. Cố gắng trả lời thân thiện, chi tiết nhưng súc tích.",
                    "Bạn là trợ lý học tập. Nếu không hiểu câu hỏi, hãy gợi ý các câu hỏi liên quan cho người dùng.",
                    "Bạn là trợ lý AI của hệ thống quản lý học tập. Trả lời phù hợp với role của người dùng: STUDENT hoặc LECTURER."
            };

            // Chọn prompt random để AI trả lời đa dạng hơn
            int idx = (int)(Math.random() * prompts.length);
            String systemPrompt = prompts[idx] + " Người dùng: " + request.getRole();

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", systemPrompt + "\nCâu hỏi: " + request.getMessage())
                            ))
                    )
            );

            log.info("Gọi Gemini AI với prompt: {}", systemPrompt);

            JsonNode response = this.webClient.post()
                    .uri(apiUrl + "?key=" + apiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .timeout(Duration.ofSeconds(10))
                    .block();

            if (response != null) {
                log.info("Gemini response: {}", response.toPrettyString());
                if (response.has("candidates") && response.get("candidates").size() > 0) {
                    String text = response.path("candidates").get(0)
                            .path("content").path("parts").get(0)
                            .path("text").asText();
                    if (text != null && !text.isBlank()) {
                        return text;
                    }
                }
            }

        } catch (Exception e) {
            log.error("Lỗi gọi AI", e);
            return "Mình gặp sự cố khi kết nối AI. Bạn thử lại nhé.";
        }

        // Fallback nếu AI không trả về
        return "Mình chưa hiểu câu hỏi. Bạn có thể hỏi về GPA, Early Warning, lịch học hoặc kế hoạch học tập.";
    }

    // ====================
    // Early Warning
    // ====================
    private ChatbotResponse buildEarlyWarningReply(ChatbotRequest request) {
        if (request.getStudentId() == null || request.getStudentId().isBlank()) {
            return ChatbotResponse.builder()
                    .intent("EARLY_WARNING")
                    .reply("Mình cần mã sinh viên để kiểm tra Early Warning. Hãy cung cấp mã sinh viên nhé.")
                    .suggestions(List.of("Cách lấy studentId", "Hỏi về GPA"))
                    .build();
        }

        try {
            EarlyWarningResponse warning = earlyWarningService.evaluateStudent(request.getStudentId());

            String reply = String.format(
                    Locale.ROOT,
                    "Kết quả Early Warning: mức %s, điểm rủi ro %.1f/100, chuyên cần %.0f%%. Hành động: %s",
                    warning.getRiskLevel(),
                    warning.getRiskScore(),
                    warning.getAttendanceRate() * 100,
                    warning.getRecommendations().isEmpty()
                            ? "Theo dõi thêm."
                            : warning.getRecommendations().get(0)
            );

            return ChatbotResponse.builder()
                    .intent("EARLY_WARNING")
                    .reply(reply)
                    .suggestions(List.of("Xem chi tiết", "Cách cải thiện"))
                    .build();

        } catch (Exception ex) {
            log.error("Lỗi lấy dữ liệu EarlyWarning", ex);
            return ChatbotResponse.builder()
                    .intent("EARLY_WARNING")
                    .reply("Lỗi lấy dữ liệu hệ thống. Thử lại sau!")
                    .build();
        }
    }

    // ====================
    // Default suggestions
    // ====================
    private List<String> defaultSuggestions(String role) {
        if ("LECTURER".equalsIgnoreCase(role)) {
            return List.of("Danh sách nguy cơ cao", "Thống kê chuyên cần", "Hướng dẫn sinh viên");
        }
        return List.of("Kiểm tra Early Warning", "Mẹo tăng GPA", "Kế hoạch học tập", "Xem lịch học");
    }

    private boolean containsAny(String source, String... keywords) {
        for (String k : keywords) {
            if (source.contains(k)) return true;
        }
        return false;
    }

    private String safeLower(String input) {
        return input == null ? "" : input.toLowerCase(Locale.ROOT).trim();
    }
}