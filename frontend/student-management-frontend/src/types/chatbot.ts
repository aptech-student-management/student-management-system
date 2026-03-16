export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotReply {
  reply: string;
  intent: string;
  suggestions: string[];
}
