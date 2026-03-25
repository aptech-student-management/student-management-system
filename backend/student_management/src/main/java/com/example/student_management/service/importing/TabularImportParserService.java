package com.example.student_management.service.importing;

import com.example.student_management.exception.BadRequestException;
import com.example.student_management.service.chatbot.ChatbotAttachmentService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TabularImportParserService {

    private static final int MAX_ROWS = 300;

    private final ChatbotAttachmentService attachmentService;
    private final GeminiImageImportParserService imageImportParserService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public List<ParsedRow> parse(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Bạn cần chọn file để import");
        }

        String fileName = file.getOriginalFilename() == null
                ? "tep-khong-ten"
                : file.getOriginalFilename().trim().toLowerCase(Locale.ROOT);

        try {
            List<ParsedRow> rows;
            if (isImageFile(file, fileName)) {
                rows = imageImportParserService.parse(file);
            } else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
                rows = parseWorkbook(file);
            } else if (fileName.endsWith(".csv")) {
                rows = parseDelimitedReader(new BufferedReader(
                        new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)
                ));
            } else if (fileName.endsWith(".json")) {
                rows = parseJson(file);
            } else if (fileName.endsWith(".txt")
                    || fileName.endsWith(".md")
                    || fileName.endsWith(".doc")
                    || fileName.endsWith(".docx")) {
                rows = parseTextContent(attachmentService.extract(file).extractedText());
            } else {
                throw new BadRequestException("File import hỗ trợ ảnh, Excel, CSV, TXT, Word hoặc JSON");
            }

            if (rows.isEmpty()) {
                throw new BadRequestException("Không tìm thấy dữ liệu để import trong file");
            }

            return rows;
        } catch (IOException ex) {
            throw new BadRequestException("Không đọc được file import");
        }
    }

    private boolean isImageFile(MultipartFile file, String fileName) {
        String contentType = file.getContentType();
        if (contentType != null && contentType.startsWith("image/")) {
            return true;
        }

        return fileName.endsWith(".png")
                || fileName.endsWith(".jpg")
                || fileName.endsWith(".jpeg")
                || fileName.endsWith(".webp")
                || fileName.endsWith(".bmp");
    }

    private List<ParsedRow> parseWorkbook(MultipartFile file) throws IOException {
        List<ParsedRow> rows = new ArrayList<>();
        DataFormatter formatter = new DataFormatter(Locale.ROOT);

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets() && rows.size() < MAX_ROWS; sheetIndex++) {
                Sheet sheet = workbook.getSheetAt(sheetIndex);
                Row headerRow = findFirstNonEmptyRow(sheet);
                if (headerRow == null) {
                    continue;
                }

                List<String> headers = extractHeaders(headerRow, formatter);
                if (headers.isEmpty()) {
                    continue;
                }

                for (int rowIndex = headerRow.getRowNum() + 1; rowIndex <= sheet.getLastRowNum() && rows.size() < MAX_ROWS; rowIndex++) {
                    Row row = sheet.getRow(rowIndex);
                    if (row == null || isEmptyRow(row, headers.size(), formatter)) {
                        continue;
                    }
                    rows.add(new ParsedRow(rowIndex + 1, mapRow(headers, row, formatter)));
                }
            }
        }

        return rows;
    }

    private List<ParsedRow> parseDelimitedReader(BufferedReader reader) throws IOException {
        List<String> lines = new ArrayList<>();
        String line;
        while ((line = reader.readLine()) != null && lines.size() < MAX_ROWS + 1) {
            if (!line.trim().isEmpty()) {
                lines.add(line);
            }
        }
        return parseDelimitedLines(lines);
    }

    private List<ParsedRow> parseTextContent(String content) {
        if (!StringUtils.hasText(content)) {
            return List.of();
        }

        List<String> lines = content.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .limit(MAX_ROWS + 1L)
                .toList();

        return parseDelimitedLines(lines);
    }

    private List<ParsedRow> parseJson(MultipartFile file) throws IOException {
        JsonNode root = objectMapper.readTree(file.getInputStream());
        JsonNode rowsNode = root;

        if (root.isObject()) {
            JsonNode dataNode = root.get("data");
            if (dataNode != null && dataNode.isArray()) {
                rowsNode = dataNode;
            }
        }

        if (!rowsNode.isArray()) {
            throw new BadRequestException("JSON import cần là mảng object hoặc object có trường data");
        }

        List<ParsedRow> rows = new ArrayList<>();
        int rowNumber = 2;
        for (JsonNode item : rowsNode) {
            if (!item.isObject()) {
                continue;
            }

            Map<String, String> values = new LinkedHashMap<>();
            item.fields().forEachRemaining(entry -> values.put(normalizeKey(entry.getKey()), entry.getValue().asText("")));
            if (!values.isEmpty()) {
                rows.add(new ParsedRow(rowNumber++, values));
            }

            if (rows.size() >= MAX_ROWS) {
                break;
            }
        }
        return rows;
    }

    private List<ParsedRow> parseDelimitedLines(List<String> lines) {
        if (lines.isEmpty()) {
            return List.of();
        }

        char delimiter = detectDelimiter(lines.get(0));
        List<String> headers = splitLine(lines.get(0), delimiter).stream()
                .map(this::normalizeKey)
                .toList();

        if (headers.stream().allMatch(String::isBlank)) {
            throw new BadRequestException("Không nhận diện được tiêu đề cột trong file");
        }

        List<ParsedRow> rows = new ArrayList<>();
        for (int index = 1; index < lines.size() && rows.size() < MAX_ROWS; index++) {
            List<String> values = splitLine(lines.get(index), delimiter);
            Map<String, String> rowMap = new LinkedHashMap<>();
            for (int col = 0; col < headers.size(); col++) {
                String header = headers.get(col);
                if (!StringUtils.hasText(header)) {
                    continue;
                }
                rowMap.put(header, col < values.size() ? values.get(col).trim() : "");
            }

            boolean hasValue = rowMap.values().stream().anyMatch(StringUtils::hasText);
            if (hasValue) {
                rows.add(new ParsedRow(index + 1, rowMap));
            }
        }

        return rows;
    }

    private Row findFirstNonEmptyRow(Sheet sheet) {
        DataFormatter formatter = new DataFormatter(Locale.ROOT);
        for (Row row : sheet) {
            if (!isEmptyRow(row, Math.max(row.getLastCellNum(), 0), formatter)) {
                return row;
            }
        }
        return null;
    }

    private List<String> extractHeaders(Row headerRow, DataFormatter formatter) {
        List<String> headers = new ArrayList<>();
        int lastCell = Math.max(headerRow.getLastCellNum(), 0);
        for (int cellIndex = 0; cellIndex < lastCell; cellIndex++) {
            Cell cell = headerRow.getCell(cellIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String value = cell == null ? "" : formatter.formatCellValue(cell).trim();
            headers.add(normalizeKey(value));
        }
        return headers;
    }

    private Map<String, String> mapRow(List<String> headers, Row row, DataFormatter formatter) {
        Map<String, String> values = new LinkedHashMap<>();
        for (int cellIndex = 0; cellIndex < headers.size(); cellIndex++) {
            String header = headers.get(cellIndex);
            if (!StringUtils.hasText(header)) {
                continue;
            }
            Cell cell = row.getCell(cellIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String value = cell == null ? "" : formatter.formatCellValue(cell).trim();
            values.put(header, value);
        }
        return values;
    }

    private boolean isEmptyRow(Row row, int cellCount, DataFormatter formatter) {
        for (int cellIndex = 0; cellIndex < cellCount; cellIndex++) {
            Cell cell = row.getCell(cellIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
            String value = cell == null ? "" : formatter.formatCellValue(cell).trim();
            if (StringUtils.hasText(value)) {
                return false;
            }
        }
        return true;
    }

    private char detectDelimiter(String headerLine) {
        char[] candidates = new char[]{',', ';', '\t', '|'};
        char best = ',';
        int bestCount = -1;

        for (char candidate : candidates) {
            int count = 0;
            for (int index = 0; index < headerLine.length(); index++) {
                if (headerLine.charAt(index) == candidate) {
                    count++;
                }
            }
            if (count > bestCount) {
                bestCount = count;
                best = candidate;
            }
        }

        if (bestCount <= 0) {
            return '|';
        }

        return best;
    }

    private List<String> splitLine(String line, char delimiter) {
        String regex = delimiter == '\t'
                ? "\t"
                : java.util.regex.Pattern.quote(String.valueOf(delimiter));
        return List.of(line.split(regex, -1));
    }

    private String normalizeKey(String key) {
        if (key == null) {
            return "";
        }

        String normalized = Normalizer.normalize(key, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim();

        return normalized.replaceAll("\\s+", " ");
    }

    public record ParsedRow(int rowNumber, Map<String, String> values) {
    }
}
