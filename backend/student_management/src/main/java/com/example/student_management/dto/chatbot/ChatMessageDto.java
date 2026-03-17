package com.example.student_management.dto.chatbot;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ChatMessageDto {
    String role;
    String content;
}
