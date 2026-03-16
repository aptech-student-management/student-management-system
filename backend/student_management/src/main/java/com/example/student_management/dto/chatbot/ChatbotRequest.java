package com.example.student_management.dto.chatbot;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class ChatbotRequest {
    private String message;
    private String userName;
    private String role;
    private String studentId;
    private List<ChatMessageDto> history = new ArrayList<>();
}
