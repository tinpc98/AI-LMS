import { useState, useCallback } from "react";
import aiApi from "../api/aiApi";
import type { IChatMessage, IChatSession } from "../api/aiApi";
import { toast } from "../utils/toast";

export function useAIChat(lessonId?: string) {
  const [session, setSession] = useState<IChatSession | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const initSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const newSession = await aiApi.createChatSession(lessonId);
      setSession(newSession);
      if (newSession.messages && newSession.messages.length > 0) {
        setMessages(newSession.messages);
      } else if (newSession._id) {
        // Fallback fetch history if messages array isn't populated directly
        const history = await aiApi.getChatHistory(newSession._id);
        setMessages(history);
      }
    } catch (err: any) {
      console.error("[useAIChat] Init session error:", err);
      setError(err.response?.data?.message || "Không thể khởi tạo phiên trò chuyện AI.");
      toast.error(err.response?.data?.message || "Không thể khởi tạo phiên trò chuyện AI.");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  const sendMessage = useCallback(async (text: string) => {
    if (!session || !session._id) {
      toast.error("Phiên trò chuyện chưa được khởi tạo!");
      return;
    }
    
    if (!text.trim()) return;

    const tempMessage: IChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, tempMessage]);
    setIsTyping(true);
    setError(null);

    try {
      const response = await aiApi.sendChatMessage(session._id, text);
      setMessages((prev) => {
        // Thay thế message cuối cùng (nếu cần sync _id) hoặc chỉ thêm response
        // Ở đây đơn giản thêm response của AI vào cuối
        return [...prev, response];
      });
    } catch (err: any) {
      console.error("[useAIChat] Send message error:", err);
      
      let errorMsg = "Lỗi khi gửi tin nhắn tới AI.";
      if (err.response?.status === 429) {
        errorMsg = "Bạn đã sử dụng hết lượt AI hiện tại (Quota exceeded). Vui lòng thử lại sau.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }
      
      toast.error(errorMsg);
      setError(errorMsg);
      
      // Tùy chọn: Gỡ tin nhắn cuối cùng nếu lỗi
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  }, [session]);

  return {
    session,
    messages,
    isLoading,
    isTyping,
    error,
    initSession,
    sendMessage,
  };
}
