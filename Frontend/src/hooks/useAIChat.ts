import { useState, useCallback, useEffect, useRef } from "react";
import aiApi from "../api/aiApi";
import type { IChatMessage, AIChatSession } from "../api/aiApi";
import { toast } from "../utils/toast";

export type AIChatInitStatus = "idle" | "initializing" | "ready" | "error";

export function useAIChat(lessonId?: string) {
  const [session, setSession] = useState<AIChatSession | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initStatus, setInitStatus] = useState<AIChatInitStatus>("idle");
  
  const initRef = useRef<string | null>(null);

  // Reset state when lessonId changes
  useEffect(() => {
    setSession(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setInitStatus("idle");
    initRef.current = null;
  }, [lessonId]);

  const initSession = useCallback(async () => {
    if (!lessonId) {
      setInitStatus("error");
      setError("AI Scholar hiện chỉ hỗ trợ trong ngữ cảnh bài học. Vui lòng vào một bài học cụ thể để bắt đầu.");
      return;
    }

    const contextKey = `lessonId:${lessonId}`;
    if (initRef.current === contextKey) return;
    initRef.current = contextKey;

    setInitStatus("initializing");
    setIsLoading(true);
    setError(null);
    try {
      const newSession = await aiApi.createChatSession(lessonId);
      setSession(newSession);
      if (newSession.messages && newSession.messages.length > 0) {
        setMessages(newSession.messages);
      } else if (newSession.id) {
        // Fallback fetch history if messages array isn't populated directly
        const history = await aiApi.getChatHistory(newSession.id);
        setMessages(history);
      }
      setInitStatus("ready");
    } catch (err: any) {
      console.error("[AI Chat] init failed", {
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
        method: err.config?.method
      });
      initRef.current = null; // reset so user can retry
      setInitStatus("error");
      
      let errorMsg = "Không thể khởi tạo phiên trò chuyện AI.";
      if (err.response?.status === 400) {
         errorMsg = "Không thể mở trợ lý AI trong nội dung hiện tại.";
      } else if (err.response?.status === 401) {
         errorMsg = "Phiên đăng nhập đã hết hạn.";
      } else if (err.response?.status === 403) {
         errorMsg = "Bạn không có quyền sử dụng trợ lý AI tại đây.";
      } else if (err.response?.status === 429) {
         errorMsg = "Bạn đã sử dụng hết lượt AI hiện tại.";
      } else if (err.response?.data?.message) {
         errorMsg = err.response.data.message;
      }
      
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  const sendMessage = useCallback(async (text: string) => {
    if (initStatus === "initializing") {
      return;
    }
    
    if (initStatus === "error") {
      toast.error(error ?? "Không thể khởi tạo phiên trò chuyện.");
      return;
    }

    if (!session?.id) {
      toast.error("Phiên trò chuyện chưa sẵn sàng.");
      return;
    }
    
    if (!text.trim()) return;

    const tempMessage: IChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, tempMessage]);
    setIsTyping(true);
    setError(null);

    try {
      console.log("[AI Chat] sending message for session:", session.id);
      const response = await aiApi.sendChatMessage(session.id, text);
      setMessages((prev) => {
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
  }, [session, initStatus, error]);

  return {
    session,
    messages,
    isLoading,
    isTyping,
    error,
    initStatus,
    initSession,
    sendMessage,
  };
}
