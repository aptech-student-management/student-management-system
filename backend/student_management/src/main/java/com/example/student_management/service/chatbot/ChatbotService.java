package com.example.student_management.service.chatbot;

import com.example.student_management.dto.ai.EarlyWarningResponse;
import com.example.student_management.dto.chatbot.ChatbotRequest;
import com.example.student_management.dto.chatbot.ChatbotResponse;
import com.example.student_management.service.ai.EarlyWarningService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);
    private static final String FALLBACK_GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final EarlyWarningService earlyWarningService;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public ChatbotService(EarlyWarningService earlyWarningService, WebClient.Builder webClientBuilder) {
        this.earlyWarningService = earlyWarningService;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofSeconds(10))
                .proxy(ProxySelector.getDefault())
                .build();
        this.objectMapper = new ObjectMapper();
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
        if (aiReply == null || aiReply.isBlank()) {
            return defaultGeneralReply(request.getRole());
        }

        return ChatbotResponse.builder()
                .intent("GENERAL")
                .reply(aiReply)
                .suggestions(defaultSuggestions(request.getRole()))
                .build();
    }

    // ====================
    // Gọi AI (Gemini)
    // ====================
    private String callGeminiAI(ChatbotRequest request) {
        if (apiKey == null || apiKey.isBlank() || apiUrl == null || apiUrl.isBlank()) {
            log.warn("Gemini configuration is missing, using local fallback");
            return defaultGeneralReply(request.getRole()).getReply();
        }

        Map<String, Object> body = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", buildSystemPrompt(request) + "\nCâu hỏi: " + request.getMessage())
                        ))
                )
        );

        List<String> candidateUrls = buildCandidateGeminiUrls();

        for (String candidateUrl : candidateUrls) {
            try {
                log.info("Gọi Gemini AI với endpoint: {}", candidateUrl);

                String requestJson = objectMapper.writeValueAsString(body);
                HttpRequest httpRequest = HttpRequest.newBuilder(URI.create(candidateUrl + "?key=" + apiKey))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(20))
                        .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                        .build();

                HttpResponse<String> httpResponse = httpClient.send(
                        httpRequest,
                        HttpResponse.BodyHandlers.ofString()
                );

                if (httpResponse.statusCode() < 200 || httpResponse.statusCode() >= 300) {
                    log.warn("Gemini trả lỗi {} tại endpoint {}: {}", httpResponse.statusCode(), candidateUrl, httpResponse.body());
                    continue;
                }

                JsonNode response = objectMapper.readTree(httpResponse.body());

                String extractedText = extractGeminiText(response);
                if (extractedText != null && !extractedText.isBlank()) {
                    return extractedText;
                }
            } catch (Exception ex) {
                log.warn("Gemini call failed at endpoint {}", candidateUrl, ex);
            }
        }

        return defaultGeneralReply(request.getRole()).getReply();
    }

    private String buildSystemPrompt(ChatbotRequest request) {
        return String.format(
                Locale.ROOT,
                "Bạn là trợ lý học vụ của hệ thống quản lý sinh viên. " +
                        "Trả lời ngắn gọn, rõ ràng, bằng tiếng Việt và ưu tiên các chủ đề GPA, cảnh báo sớm, lịch học, đăng ký môn. " +
                        "Vai trò người dùng: %s.",
                request.getRole() == null ? "UNKNOWN" : request.getRole()
        );
    }

    private List<String> buildCandidateGeminiUrls() {
        LinkedHashSet<String> urls = new LinkedHashSet<>();

        String normalizedConfiguredUrl = normalizeGeminiUrl(apiUrl);
        if (normalizedConfiguredUrl != null && !normalizedConfiguredUrl.isBlank()) {
            urls.add(normalizedConfiguredUrl);
        }

        urls.add(FALLBACK_GEMINI_URL);
        return new ArrayList<>(urls);
    }

    private String normalizeGeminiUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return null;
        }

        String normalized = rawUrl.trim();
        normalized = normalized.replace(":streamGenerateContent", ":generateContent");

        int queryIndex = normalized.indexOf('?');
        if (queryIndex >= 0) {
            normalized = normalized.substring(0, queryIndex);
        }

        return normalized;
    }

    private String extractGeminiText(JsonNode response) {
        if (response == null) {
            return null;
        }

        try {
            log.info("Gemini response: {}", response.toPrettyString());
            if (response.has("candidates") && response.get("candidates").size() > 0) {
                String text = response.path("candidates").get(0)
                        .path("content").path("parts").get(0)
                        .path("text").asText();
                if (text != null && !text.isBlank()) {
                    return text;
                }
            }
        } catch (Exception ex) {
            log.warn("Không parse được Gemini response", ex);
        }

        return null;
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
                    .reply("Hiện mình chưa lấy được dữ liệu Early Warning từ hệ thống. Bạn thử lại sau nhé.")
                    .suggestions(List.of("Thử lại Early Warning", "Mẹo tăng GPA"))
                    .build();
        }
    }

    private ChatbotResponse defaultGeneralReply(String role) {
        return ChatbotResponse.builder()
                .intent("GENERAL")
                .reply("Mình có thể hỗ trợ về GPA, Early Warning, lịch học và đăng ký môn. Bạn hãy thử một câu hỏi cụ thể hơn nhé.")
                .suggestions(defaultSuggestions(role))
                .build();
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
