import axiosClient from "../api/axiosClient";
import type { ChatbotMessage, ChatbotReply, Role } from "../types";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

type ChatbotReplyApi = {
  reply: string;
  intent: string;
  suggestions: string[];
};

export const askChatbotApi = async (payload: {
  message: string;
  userName?: string;
  role?: Role;
  studentId?: string;
  history?: ChatbotMessage[];
}): Promise<ChatbotReply> => {
  const res = await axiosClient.post<ApiResponse<ChatbotReplyApi>>("/ai/chatbot", payload);
  const data = res.data.data;

  return {
    reply: data.reply,
    intent: data.intent,
    suggestions: data.suggestions ?? []
  };
};
