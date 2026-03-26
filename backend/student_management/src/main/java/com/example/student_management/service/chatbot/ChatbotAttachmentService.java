package com.example.student_management.service.chatbot;

import com.example.student_management.exception.BadRequestException;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.Set;

@Service
public class ChatbotAttachmentService {

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final int MAX_TEXT_LENGTH = 16000;
    private static final int MAX_SHEETS = 5;
    private static final int MAX_ROWS_PER_SHEET = 120;
    private static final int MAX_CELLS_PER_ROW = 20;
    private static final Set<String> IMAGE_EXTENSIONS = Set.of(
            ".png", ".jpg", ".jpeg", ".webp", ".bmp"
    );

    public AttachmentPayload extract(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Bạn cần chọn ảnh hoặc file để AI xử lý");
        }

        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BadRequestException("File vượt quá 10MB, hãy dùng file nhỏ hơn");
        }

        String fileName = StringUtils.hasText(file.getOriginalFilename())
                ? file.getOriginalFilename().trim()
                : "tep-khong-ten";
        String lowerFileName = fileName.toLowerCase(Locale.ROOT);
        String mimeType = normalizeMimeType(file.getContentType(), lowerFileName);

        try {
            if (isImage(mimeType, lowerFileName)) {
                return new AttachmentPayload(
                        fileName,
                        mimeType,
                        AttachmentKind.IMAGE,
                        null,
                        file.getBytes()
                );
            }

            String extractedText;
            if (lowerFileName.endsWith(".csv")
                    || lowerFileName.endsWith(".txt")
                    || lowerFileName.endsWith(".md")
                    || lowerFileName.endsWith(".json")) {
                extractedText = extractPlainText(file);
            } else if (lowerFileName.endsWith(".xlsx") || lowerFileName.endsWith(".xls")) {
                extractedText = extractSpreadsheetText(file);
            } else if (lowerFileName.endsWith(".docx")) {
                extractedText = extractDocxText(file);
            } else if (lowerFileName.endsWith(".doc")) {
                extractedText = extractDocText(file);
            } else {
                throw new BadRequestException("Chỉ hỗ trợ ảnh, CSV, Excel, Word, TXT hoặc JSON");
            }

            extractedText = normalizeExtractedText(extractedText);
            if (extractedText.isBlank()) {
                throw new BadRequestException("Không đọc được nội dung file, bạn hãy kiểm tra lại định dạng");
            }

            return new AttachmentPayload(
                    fileName,
                    mimeType,
                    AttachmentKind.TEXT,
                    extractedText,
                    null
            );
        } catch (IOException ex) {
            throw new BadRequestException("Không thể đọc file đã tải lên");
        }
    }

    private boolean isImage(String mimeType, String lowerFileName) {
        if (mimeType != null && mimeType.startsWith("image/")) {
            return true;
        }

        return IMAGE_EXTENSIONS.stream().anyMatch(lowerFileName::endsWith);
    }

    private String normalizeMimeType(String contentType, String lowerFileName) {
        if (StringUtils.hasText(contentType)) {
            return contentType;
        }

        if (lowerFileName.endsWith(".png")) {
            return "image/png";
        }
        if (lowerFileName.endsWith(".jpg") || lowerFileName.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (lowerFileName.endsWith(".webp")) {
            return "image/webp";
        }
        if (lowerFileName.endsWith(".bmp")) {
            return "image/bmp";
        }

        return "application/octet-stream";
    }

    private String extractPlainText(MultipartFile file) throws IOException {
        StringBuilder builder = new StringBuilder();
        try (Reader reader = new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8)) {
            char[] buffer = new char[4096];
            int read;
            while ((read = reader.read(buffer)) >= 0 && builder.length() < MAX_TEXT_LENGTH * 2) {
                builder.append(buffer, 0, read);
            }
        }
        return builder.toString();
    }

    private String extractSpreadsheetText(MultipartFile file) throws IOException {
        StringBuilder builder = new StringBuilder();
        DataFormatter formatter = new DataFormatter(Locale.ROOT);

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            int sheetCount = Math.min(workbook.getNumberOfSheets(), MAX_SHEETS);

            for (int sheetIndex = 0; sheetIndex < sheetCount; sheetIndex++) {
                Sheet sheet = workbook.getSheetAt(sheetIndex);
                builder.append("Sheet: ").append(sheet.getSheetName()).append('\n');

                int rowCount = 0;
                for (Row row : sheet) {
                    if (rowCount >= MAX_ROWS_PER_SHEET) {
                        builder.append("[Da cat bot cac dong con lai]\n");
                        break;
                    }

                    StringBuilder rowBuilder = new StringBuilder();
                    int lastCell = Math.min(Math.max(row.getLastCellNum(), 0), MAX_CELLS_PER_ROW);
                    for (int cellIndex = 0; cellIndex < lastCell; cellIndex++) {
                        Cell cell = row.getCell(cellIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                        String value = cell == null ? "" : formatter.formatCellValue(cell).trim();
                        if (cellIndex > 0) {
                            rowBuilder.append(" | ");
                        }
                        rowBuilder.append(value);
                    }

                    String rowText = rowBuilder.toString().trim();
                    if (!rowText.isBlank()) {
                        builder.append(rowText).append('\n');
                        rowCount++;
                    }
                }

                builder.append('\n');
            }
        }

        return builder.toString();
    }

    private String extractDocxText(MultipartFile file) throws IOException {
        try (XWPFDocument document = new XWPFDocument(file.getInputStream());
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractDocText(MultipartFile file) throws IOException {
        try (HWPFDocument document = new HWPFDocument(file.getInputStream());
             WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String normalizeExtractedText(String rawText) {
        String normalized = rawText == null ? "" : rawText.replace("\u0000", "").trim();
        if (normalized.length() <= MAX_TEXT_LENGTH) {
            return normalized;
        }
        return normalized.substring(0, MAX_TEXT_LENGTH) + "\n[Da cat bot noi dung de tranh qua dai]";
    }

    public enum AttachmentKind {
        TEXT,
        IMAGE
    }

    public record AttachmentPayload(
            String fileName,
            String mimeType,
            AttachmentKind kind,
            String extractedText,
            byte[] binaryData
    ) {
    }
}
