import axios from "axios";
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

const buildFallbackReply = (payload: {
  message: string;
  role?: Role;
  studentId?: string;
}): ChatbotReply => {
  const message = payload.message.toLowerCase();

  if (message.includes("early warning") || message.includes("cảnh báo") || message.includes("rủi ro")) {
    if (!payload.studentId) {
      return {
        reply:
          "Hiện tại server AI chưa phản hồi. Tuy nhiên mình thấy bạn chưa có studentId trong phiên làm việc. Bạn hãy đăng nhập lại tài khoản sinh viên rồi thử 'Kiểm tra Early Warning của tôi'.",
        intent: "EARLY_WARNING_FALLBACK",
        suggestions: ["Đăng nhập lại", "Mẹo tăng GPA", "Hướng dẫn đăng ký môn"],
        source: "fallback"
      };
    }

    return {
      reply:
        "Server AI đang gián đoạn nên mình chưa lấy được Early Warning thời gian thực. Bạn có thể vào Dashboard để xem cảnh báo gần nhất, đồng thời giữ chuyên cần >= 80% và ưu tiên cải thiện các môn điểm thấp.",
      intent: "EARLY_WARNING_FALLBACK",
      suggestions: ["Mẹo tăng chuyên cần", "Kế hoạch học 4 tuần", "Hỏi về GPA"],
      source: "fallback"
    };
  }

  if (message.includes("gpa") || message.includes("điểm")) {
    return {
      reply:
        "Server AI tạm thời không phản hồi. Gợi ý nhanh để tăng GPA: (1) học lại môn thấp điểm, (2) đặt mục tiêu chuyên cần >= 80%, (3) chia lịch ôn tập theo tuần.",
      intent: "GPA_FALLBACK",
      suggestions: ["Kiểm tra Early Warning của tôi", "Kế hoạch học 4 tuần", "Môn nên ưu tiên"],
      source: "fallback"
    };
  }

  if (message.includes("đăng ký") || message.includes("thời khóa biểu") || message.includes("môn học")) {
    return {
      reply:
        "Server AI đang bận. Bạn vẫn có thể đăng ký hiệu quả bằng cách tránh dồn môn khó cùng kỳ và kiểm tra trùng lịch trước khi lưu đăng ký.",
      intent: "REGISTRATION_FALLBACK",
      suggestions: ["Kiểm tra Early Warning của tôi", "Mẹo tăng GPA", "Cách giảm trùng lịch"],
      source: "fallback"
    };
  }

  return {
    reply:
      "Server AI hiện chưa phản hồi. Bạn vẫn có thể hỏi theo mẫu: 'Kiểm tra Early Warning của tôi', 'Mẹo tăng GPA', hoặc 'Hướng dẫn đăng ký môn'.",
    intent: "GENERAL_FALLBACK",
    suggestions: ["Kiểm tra Early Warning của tôi", "Mẹo tăng GPA", "Hướng dẫn đăng ký môn"],
    source: "fallback"
  };
};

export const askChatbotApi = async (payload: {
  message: string;
  userName?: string;
  role?: Role;
  studentId?: string;
  history?: ChatbotMessage[];
}): Promise<ChatbotReply> => {
  try {
    const res = await axiosClient.post<ApiResponse<ChatbotReplyApi>>("/ai/chatbot", payload, {
      timeout: 12000
    });

    const data = res.data.data;
    return {
      reply: data.reply,
      intent: data.intent,
      suggestions: data.suggestions ?? [],
      source: "server"
    };
  } catch (error) {
    let reason = "Không kết nối được AI server";
    if (axios.isAxiosError(error)) {
      if (error.response?.status) {
        reason = `AI server trả lỗi ${error.response.status}`;
      } else if (error.code === "ECONNABORTED") {
        reason = "AI server phản hồi quá chậm";
      }
    }

    const fallback = buildFallbackReply(payload);
    return {
      ...fallback,
      errorMessage: reason
    };
  }
};
