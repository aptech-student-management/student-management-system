package com.example.student_management.controller.chatbot;

import com.example.student_management.dto.chatbot.ChatbotRequest;
import com.example.student_management.dto.chatbot.ChatbotResponse;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.service.chatbot.ChatbotService;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatbotControllerTest {

    @Test
    void chat_shouldReturnApiResponse() {
        ChatbotService chatbotService = mock(ChatbotService.class);
        ChatbotController controller = new ChatbotController(chatbotService);

        ChatbotRequest request = new ChatbotRequest();
        request.setMessage("hello");

        ChatbotResponse expected = ChatbotResponse.builder()
                .intent("GENERAL")
                .reply("Xin chào")
                .suggestions(List.of("A", "B"))
                .build();

        when(chatbotService.reply(request)).thenReturn(expected);

        ResponseEntity<?> response = controller.chat(request);
        assertEquals(200, response.getStatusCode().value());

        ApiResponse<?> body = (ApiResponse<?>) response.getBody();
        assertNotNull(body);
        assertTrue(body.isSuccess());
        assertEquals(expected, body.getData());
    }
}
