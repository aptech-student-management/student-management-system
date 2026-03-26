package com.example.student_management.service.importing;

import com.example.student_management.exception.BadRequestException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class GeminiImageImportParserService {

    private static final Logger log = LoggerFactory.getLogger(GeminiImageImportParserService.class);

    private static final String FALLBACK_GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
    private static final int MAX_ROWS = 300;
    private static final String IMAGE_PARSE_PROMPT = """
            Bạn đang trích xuất dữ liệu tài khoản từ ảnh chụp bảng danh sách cho hệ thống quản lý đào tạo.
            Chỉ đọc dữ liệu nhìn thấy rõ trong ảnh, không đoán thông tin bị mờ hoặc bị thiếu.
            Hãy trả về JSON thuần theo đúng cấu trúc sau:
            {
              "rows": [
                {
                  "name": "",
                  "email": "",
                  "studentId": "",
                  "department": "",
                  "phone": "",
                  "role": ""
                }
              ]
            }
            Quy tắc:
            - studentId dùng cho cả mã sinh viên hoặc mã giảng viên.
            - role chỉ ghi STUDENT hoặc LECTURER nếu thấy rõ, nếu không thì để chuỗi rỗng.
            - department là tên khoa hoặc mã khoa nếu thấy.
            - Bỏ qua tiêu đề, chú thích và dòng không phải dữ liệu.
            - Không bọc JSON trong markdown.
            """;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.api.url:}")
    private String apiUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<TabularImportParserService.ParsedRow> parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Bạn cần chọn ảnh để import");
        }

        if (!StringUtils.hasText(apiKey)) {
            throw new BadRequestException("Chưa cấu hình AI để đọc ảnh import");
        }

        try {
            String mimeType = StringUtils.hasText(file.getContentType())
                    ? file.getContentType()
                    : detectMimeType(file.getOriginalFilename());

            String imageBase64 = Base64.getEncoder().encodeToString(file.getBytes());
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(Map.of(
                            "parts", List.of(
                                    Map.of("text", IMAGE_PARSE_PROMPT),
                                    Map.of("inlineData", Map.of(
                                            "mimeType", mimeType,
                                            "data", imageBase64
                                    ))
                            )
                    )),
                    "generationConfig", Map.of(
                            "temperature", 0.1,
                            "responseMimeType", "application/json"
                    )
            );

            HttpRequest request = HttpRequest.newBuilder(URI.create(normalizeGeminiUrl(apiUrl) + "?key=" + apiKey))
                    .timeout(Duration.ofSeconds(30))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new BadRequestException(extractErrorMessage(response.body()));
            }

            String extractedJson = extractGeminiText(objectMapper.readTree(response.body()));
            if (!StringUtils.hasText(extractedJson)) {
                throw new BadRequestException("AI chưa trích xuất được dữ liệu từ ảnh");
            }

            return mapRows(extractedJson);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new BadRequestException("Quá trình đọc ảnh import đã bị gián đoạn");
        } catch (BadRequestException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new BadRequestException("Không thể đọc dữ liệu từ ảnh import");
        } catch (Exception ex) {
            log.error("Unexpected error while parsing image import", ex);
            throw new BadRequestException("AI chưa đọc được ảnh import, hãy thử ảnh rõ hơn hoặc dùng file Excel/CSV");
        }
    }

    private List<TabularImportParserService.ParsedRow> mapRows(String rawJson) throws IOException {
        JsonNode root = objectMapper.readTree(cleanJson(rawJson));
        JsonNode rowsNode = root;

        if (root.isObject()) {
            JsonNode nestedRows = root.get("rows");
            if (nestedRows != null && nestedRows.isArray()) {
                rowsNode = nestedRows;
            }
        }

        if (!rowsNode.isArray()) {
            throw new BadRequestException("AI chưa trả về danh sách hợp lệ từ ảnh import");
        }

        List<TabularImportParserService.ParsedRow> rows = new ArrayList<>();
        int rowNumber = 2;
        for (JsonNode item : rowsNode) {
            if (!item.isObject()) {
                continue;
            }

            Map<String, String> values = new LinkedHashMap<>();
            item.fields().forEachRemaining(entry -> values.put(normalizeKey(entry.getKey()), entry.getValue().asText("")));
            if (values.values().stream().anyMatch(StringUtils::hasText)) {
                rows.add(new TabularImportParserService.ParsedRow(rowNumber++, values));
            }

            if (rows.size() >= MAX_ROWS) {
                break;
            }
        }

        if (rows.isEmpty()) {
            throw new BadRequestException("Không tìm thấy dữ liệu tài khoản trong ảnh");
        }

        return rows;
    }

    private String extractGeminiText(JsonNode response) {
        if (response == null || !response.has("candidates")) {
            return null;
        }

        JsonNode candidates = response.get("candidates");
        if (!candidates.isArray() || candidates.isEmpty()) {
            return null;
        }

        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray()) {
            return null;
        }

        StringBuilder builder = new StringBuilder();
        for (JsonNode part : parts) {
            String text = part.path("text").asText("");
            if (!text.isBlank()) {
                if (builder.length() > 0) {
                    builder.append('\n');
                }
                builder.append(text);
            }
        }

        return builder.toString().trim();
    }

    private String extractErrorMessage(String responseBody) {
        if (!StringUtils.hasText(responseBody)) {
            return "AI chưa đọc được ảnh import, hãy thử ảnh rõ hơn hoặc dùng file Excel/CSV";
        }

        try {
            JsonNode root = objectMapper.readTree(responseBody);
            String apiMessage = root.path("error").path("message").asText("");
            if (StringUtils.hasText(apiMessage)) {
                return "AI đọc ảnh thất bại: " + apiMessage;
            }
        } catch (Exception ignored) {
            // Fall through to generic message.
        }

        return "AI chưa đọc được ảnh import, hãy thử ảnh rõ hơn hoặc dùng file Excel/CSV";
    }

    private String cleanJson(String rawJson) {
        String cleaned = rawJson.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```json", "")
                    .replaceFirst("^```", "")
                    .replaceFirst("```$", "")
                    .trim();
        }
        return cleaned;
    }

    private String normalizeGeminiUrl(String configuredUrl) {
        if (!StringUtils.hasText(configuredUrl)) {
            return FALLBACK_GEMINI_URL;
        }

        String normalized = configuredUrl.trim().replace(":streamGenerateContent", ":generateContent");
        int queryIndex = normalized.indexOf('?');
        return queryIndex >= 0 ? normalized.substring(0, queryIndex) : normalized;
    }

    private String detectMimeType(String fileName) {
        String lower = fileName == null ? "" : fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        if (lower.endsWith(".bmp")) {
            return "image/bmp";
        }
        return "image/jpeg";
    }

    private String normalizeKey(String key) {
        if (key == null) {
            return "";
        }

        return Normalizer.normalize(key, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
