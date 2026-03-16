package com.example.student_management.dto.chatbot;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class ChatbotResponse {
    String reply;
    String intent;
    List<String> suggestions;
}
