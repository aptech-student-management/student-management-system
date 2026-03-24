package com.example.student_management.service.chatbot;

import com.example.student_management.dto.ai.EarlyWarningResponse;
import com.example.student_management.dto.chatbot.ChatbotRequest;
import com.example.student_management.dto.chatbot.ChatbotResponse;
import com.example.student_management.service.ai.EarlyWarningService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ChatbotService {

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
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            return ChatbotResponse.builder()
                    .intent("EMPTY")
                    .reply("Bạn hãy nhập câu hỏi để mình hỗ trợ nhé.")
                    .suggestions(defaultSuggestions(request != null ? request.getRole() : null))
                    .build();
        }

        String message = safeLower(request.getMessage());

        // Rule-based
        if (containsAny(message, "early warning", "cảnh báo", "nguy cơ", "rủi ro")) {
            return buildEarlyWarningReply(request);
        }

        // AI
        String aiReply = callGeminiAI(request);

        return ChatbotResponse.builder()
                .intent("AI_GENERATED")
                .reply(aiReply)
                .suggestions(defaultSuggestions(request.getRole()))
                .build();
    }

    private String callGeminiAI(ChatbotRequest request) {
        try {
            String systemPrompt = String.format(
                    "Bạn là trợ lý ảo thông minh của hệ thống quản lý học tập. " +
                            "Người dùng: %s. Trả lời ngắn gọn, dễ hiểu bằng tiếng Việt.",
                    request.getRole()
            );

            Map<String, Object> body = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(
                                    Map.of("text", systemPrompt + "\nCâu hỏi: " + request.getMessage())
                            ))
                    )
            );

            JsonNode response = this.webClient.post()
                    .uri(apiUrl + "?key=" + apiKey) // ✅ FIX URL + KEY
                    .header("Content-Type", "application/json") // ✅ thêm header
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(JsonNode.class)
                    .block();

            // ✅ DEBUG
            if (response != null) {
                System.out.println("Gemini response:");
                System.out.println(response.toPrettyString());
            }

            // ✅ CHECK AN TOÀN
            if (response != null
                    && response.has("candidates")
                    && response.get("candidates").size() > 0) {

                return response.path("candidates").get(0)
                        .path("content").path("parts").get(0)
                        .path("text").asText();
            }

        } catch (Exception e) {
            e.printStackTrace();
            return "Lỗi gọi AI: " + e.getMessage();
        }

        return "Xin lỗi, mình chưa hiểu câu hỏi của bạn.";
    }

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
            ex.printStackTrace();
            return ChatbotResponse.builder()
                    .intent("EARLY_WARNING")
                    .reply("Lỗi lấy dữ liệu hệ thống. Thử lại sau!")
                    .build();
        }
    }

    private List<String> defaultSuggestions(String role) {
        if ("LECTURER".equalsIgnoreCase(role)) {
            return List.of("Danh sách nguy cơ cao", "Thống kê chuyên cần");
        }
        return List.of("Kiểm tra Early Warning", "Mẹo tăng GPA", "Kế hoạch học tập");
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