package com.example.student_management.controller.chatbot;

import com.example.student_management.dto.chatbot.ChatbotRequest;
import com.example.student_management.repository.ApiResponse;
import com.example.student_management.service.chatbot.ChatbotService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/chatbot")
public class ChatbotController {

    private final ChatbotService chatbotService;

    public ChatbotController(ChatbotService chatbotService) {
        this.chatbotService = chatbotService;
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody ChatbotRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                chatbotService.reply(request),
                "Phản hồi từ AI Chatbot"
        ));
    }
}
