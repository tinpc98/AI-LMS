import { useState, useCallback, useRef } from "react";
import aiApi from "../../../api/aiApi";
import type { IChatMessage, AIChatSession } from "../../../api/aiApi";
import { toast } from "../../../utils/toast";
import { getApiErrorStatus } from "../../../shared/utils/apiError";

export type AIChatInitStatus = "idle" | "initializing" | "ready" | "error";

export function useAIChat(lessonId?: string) {
  const [session, setSession] = useState<AIChatSession | null>(null);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initStatus, setInitStatus] = useState<AIChatInitStatus>("idle");

  const initRef = useRef<string | null>(null);

  // Dọn sạch phiên trò chuyện khi chuyển sang bài học khác.
  //
  // Bản cũ làm việc này trong useEffect, nên khi người dùng chuyển từ bài A sang bài B có
  // một nhịp render hiển thị NGUYÊN đoạn hội thoại của bài A dưới tiêu đề bài B. Với khung
  // chat thì đây là lỗi nhìn thấy rõ, không phải chuyện hiệu năng.
  //
  // Đặt state ngay trong thân component ("adjust state during render") thì React chạy lại
  // lượt render trước khi ghi ra DOM, nên tin nhắn cũ không kịp xuất hiện.
  const [prevLessonId, setPrevLessonId] = useState(lessonId);
  if (prevLessonId !== lessonId) {
    setPrevLessonId(lessonId);
    setSession(null);
    setMessages([]);
    setError(null);
    setIsLoading(false);
    setInitStatus("idle");
    // KHÔNG đặt lại initRef ở đây: ghi vào ref trong thân render là tác dụng phụ. Và nó
    // thừa — khoá chống khởi tạo trùng là `lessonId:${lessonId}`, nên khi lessonId đổi thì
    // khoá đã tự khác, initSession luôn chạy lại. Kể cả đường đi A -> B -> A cũng vậy:
    // lúc quay về A, ref đang giữ "lessonId:B" nên vẫn không khớp.
  }

  const initSession = useCallback(async () => {
    if (!lessonId) {
      setInitStatus("error");
      setError(
        "AI Scholar hiện chỉ hỗ trợ trong ngữ cảnh bài học. Vui lòng vào một bài học cụ thể để bắt đầu."
      );
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
        status: getApiErrorStatus(err),
        data: err.response?.data,
        url: err.config?.url,
        method: err.config?.method,
      });
      initRef.current = null; // reset so user can retry
      setInitStatus("error");

      let errorMsg = "Không thể khởi tạo phiên trò chuyện AI.";
      if (getApiErrorStatus(err) === 400) {
        errorMsg = "Không thể mở trợ lý AI trong nội dung hiện tại.";
      } else if (getApiErrorStatus(err) === 401) {
        errorMsg = "Phiên đăng nhập đã hết hạn.";
      } else if (getApiErrorStatus(err) === 403) {
        errorMsg = "Bạn không có quyền sử dụng trợ lý AI tại đây.";
      } else if (getApiErrorStatus(err) === 429) {
        errorMsg = "Bạn đã sử dụng hết lượt AI hiện tại.";
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  const sendMessage = useCallback(
    async (text: string) => {
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
        if (getApiErrorStatus(err) === 429) {
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
    },
    [session, initStatus, error]
  );

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
