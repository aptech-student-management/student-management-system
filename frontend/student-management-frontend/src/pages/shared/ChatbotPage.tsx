import React, { useMemo, useState } from "react";
import { MessageSquareIcon, SendIcon, SparklesIcon } from "lucide-react";

import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { useAuth } from "../../contexts/AuthContext";
import { askChatbotApi } from "../../services/chatbotService";
import type { ChatbotMessage } from "../../types";

export function ChatbotPage() {
  const { currentUser } = useAuth();

  const [messages, setMessages] = useState<ChatbotMessage[]>([
    {
      role: "assistant",
      content:
        "Xin chào! Mình là AI Chatbot học vụ. Bạn có thể hỏi về Early Warning, GPA hoặc đăng ký môn học."
    }
  ]);

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([
    "Kiểm tra Early Warning của tôi",
    "Mẹo tăng GPA",
    "Hướng dẫn đăng ký môn"
  ]);

  const [isSending, setIsSending] = useState(false);
  const [serverMode, setServerMode] = useState<"server" | "fallback">("server");
  const [lastError, setLastError] = useState<string>("");

  const history = useMemo(
    () => messages.map((m) => ({ role: m.role, content: m.content })),
    [messages]
  );

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || !currentUser || isSending) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await askChatbotApi({
        message: trimmed,
        role: currentUser.role,
        userName: currentUser.name,
        studentId: currentUser.studentId,
        history
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.reply }
      ]);

      setSuggestions(response.suggestions);
      setServerMode(response.source === "fallback" ? "fallback" : "server");
      setLastError(response.errorMessage ?? "");
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Mình đang bận một chút, bạn thử lại sau nhé."
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Layout title="AI Chatbot học vụ">
      <div className="space-y-6">
        <Card
          title="Trợ lý AI"
          subtitle="Hỏi đáp học vụ, cảnh báo sớm và kế hoạch học tập"
          icon={<SparklesIcon className="w-4 h-4" />}
        >
          <div className="space-y-3">
            <div className="h-[420px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      message.role === "user"
                        ? "bg-blue-700 text-white"
                        : "bg-white border border-slate-200 text-slate-700"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  disabled={isSending}
                  className="px-3 py-1.5 text-xs rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input);
                  }
                }}
                className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <Button
                onClick={() => void sendMessage(input)}
                loading={isSending}
                icon={<SendIcon className="w-4 h-4" />}
                disabled={!input.trim()}
              >
                Gửi
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Trạng thái" icon={<MessageSquareIcon className="w-4 h-4" />}>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <Badge variant="info">{currentUser?.role}</Badge>

            {serverMode === "server" ? (
              <Badge variant="success">AI server online</Badge>
            ) : (
              <Badge variant="warning">Đang dùng fallback local</Badge>
            )}

            {lastError && (
              <span className="text-amber-700">({lastError})</span>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}