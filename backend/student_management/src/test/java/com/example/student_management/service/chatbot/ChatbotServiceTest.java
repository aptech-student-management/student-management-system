package com.example.student_management.service.chatbot;

import com.example.student_management.dto.ai.EarlyWarningResponse;
import com.example.student_management.dto.chatbot.ChatbotRequest;
import com.example.student_management.dto.chatbot.ChatbotResponse;
import com.example.student_management.service.ai.EarlyWarningService;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatbotServiceTest {

    @Test
    void reply_shouldReturnEmptyIntent_whenMessageBlank() {
        EarlyWarningService earlyWarningService = mock(EarlyWarningService.class);
        ChatbotService chatbotService = new ChatbotService(earlyWarningService);

        ChatbotRequest request = new ChatbotRequest();
        request.setMessage("   ");

        ChatbotResponse response = chatbotService.reply(request);

        assertEquals("EMPTY", response.getIntent());
        assertTrue(response.getReply().contains("nhập câu hỏi"));
    }

    @Test
    void reply_shouldReturnGreetingIntent_whenMessageIsGreeting() {
        EarlyWarningService earlyWarningService = mock(EarlyWarningService.class);
        ChatbotService chatbotService = new ChatbotService(earlyWarningService);

        ChatbotRequest request = new ChatbotRequest();
        request.setMessage("hello");

        ChatbotResponse response = chatbotService.reply(request);

        assertEquals("GREETING", response.getIntent());
        assertTrue(response.getReply().toLowerCase().contains("xin chào"));
    }

    @Test
    void reply_shouldUseEarlyWarning_whenStudentIdProvided() {
        EarlyWarningService earlyWarningService = mock(EarlyWarningService.class);
        ChatbotService chatbotService = new ChatbotService(earlyWarningService);

        when(earlyWarningService.evaluateStudent("SV001")).thenReturn(
                EarlyWarningResponse.builder()
                        .studentId("SV001")
                        .studentName("A")
                        .riskLevel("HIGH")
                        .riskScore(80.0)
                        .attendanceRate(0.6)
                        .failedCourseCount(2)
                        .recommendations(List.of("Liên hệ cố vấn"))
                        .build()
        );

        ChatbotRequest request = new ChatbotRequest();
        request.setMessage("Cho mình xem cảnh báo sớm");
        request.setStudentId("SV001");

        ChatbotResponse response = chatbotService.reply(request);

        assertEquals("EARLY_WARNING", response.getIntent());
        assertTrue(response.getReply().contains("mức HIGH"));
        verify(earlyWarningService, times(1)).evaluateStudent("SV001");
    }

    @Test
    void reply_shouldReturnSafeResponse_whenEarlyWarningThrows() {
        EarlyWarningService earlyWarningService = mock(EarlyWarningService.class);
        ChatbotService chatbotService = new ChatbotService(earlyWarningService);

        when(earlyWarningService.evaluateStudent("SV002"))
                .thenThrow(new RuntimeException("DB down"));

        ChatbotRequest request = new ChatbotRequest();
        request.setMessage("cho mình xem rủi ro");
        request.setStudentId("SV002");

        ChatbotResponse response = chatbotService.reply(request);

        assertEquals("EARLY_WARNING", response.getIntent());
        assertTrue(response.getReply().contains("chưa lấy được dữ liệu"));
    }

    @Test
    void reply_shouldReturnGeneral_whenNoKnownIntent() {
        EarlyWarningService earlyWarningService = mock(EarlyWarningService.class);
        ChatbotService chatbotService = new ChatbotService(earlyWarningService);

        ChatbotRequest request = new ChatbotRequest();
        request.setMessage("cảm ơn");

        ChatbotResponse response = chatbotService.reply(request);

        assertEquals("GENERAL", response.getIntent());
        assertFalse(response.getSuggestions().isEmpty());
    }
}