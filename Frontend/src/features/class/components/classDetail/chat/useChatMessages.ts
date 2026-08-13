import { useState, useCallback, useRef } from "react";
import api from "../../../../../api/axiosClient";
import type { ChatMessage, ChatAttachment, ChatReaction } from "../../../types/chat.types";
import { useAuth } from "../../../../../shared/hooks/useAuth";
import { toast } from "../../../../../utils/toast";

export function useChatMessages(classId: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  // Lấy danh sách tin nhắn ban đầu
  const fetchMessages = useCallback(async () => {
    if (!classId || isFetchingRef.current) return;
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const res = await api.get(`/api/classes/${classId}/messages?limit=50`);
      if (res.data.success) {
        setMessages(res.data.data);
        setNextCursor(res.data.nextCursor);
      }
    } catch (err) {
      toast.error("Không thể tải tin nhắn.");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [classId]);

  // Tải thêm tin nhắn cũ
  const loadMore = useCallback(async () => {
    if (!classId || !nextCursor || loadingMore) return;
    try {
      setLoadingMore(true);
      const res = await api.get(`/api/classes/${classId}/messages?limit=50&cursor=${nextCursor}`);
      if (res.data.success) {
        setMessages(prev => [...res.data.data, ...prev]);
        setNextCursor(res.data.nextCursor);
      }
    } catch (err) {
      toast.error("Lỗi khi tải thêm tin nhắn.");
    } finally {
      setLoadingMore(false);
    }
  }, [classId, nextCursor, loadingMore]);

  // Gửi tin nhắn
  const sendMessage = useCallback(async (content: string, attachments: ChatAttachment[] = [], isOnline: boolean) => {
    if (!content.trim() && attachments.length === 0) return;

    const tempId = `temp_${Date.now()}`;
    const newMsg: ChatMessage = {
      _id: tempId,
      classId,
      senderId: {
        _id: user?.id || "",
        fullName: user?.fullName || "",
        avatar: (user as any)?.avatar || "",
        email: user?.email || "",
        role: user?.role || "Student"
      },
      type: attachments.length > 0 ? (attachments[0].mimeType.startsWith("image") ? "image" : "file") : "text",
      content,
      attachments,
      isDeleted: false,
      editedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactionsSummary: [],
      userReaction: null,
      status: isOnline ? "sending" : "error",
      clientTempId: tempId
    };

    setMessages(prev => [...prev, newMsg]);

    if (!isOnline) {
      return; // Sẽ hiển thị lỗi "thử lại"
    }

    try {
      const res = await api.post(`/api/classes/${classId}/messages`, {
        content,
        type: newMsg.type,
        attachments
      });

      if (res.data.success) {
        // Cập nhật lại list với tin thật
        setMessages(prev => prev.map(m => m.clientTempId === tempId ? { ...res.data.data, status: "sent" } : m));
      }
    } catch (err) {
      setMessages(prev => prev.map(m => m.clientTempId === tempId ? { ...m, status: "error" } : m));
    }
  }, [classId, user]);

  // Sửa tin nhắn
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      const res = await api.patch(`/api/classes/${classId}/messages/${messageId}`, { content: newContent });
      if (res.data.success) {
        setMessages(prev => prev.map(m => m._id === messageId ? { ...res.data.data, status: "sent" } : m));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi sửa tin nhắn");
    }
  }, [classId]);

  // Xóa tin nhắn
  const deleteMessage = useCallback(async (messageId: string) => {
    // Cập nhật lạc quan
    setMessages(prev => prev.map(m => m._id === messageId ? { ...m, isDeleted: true } : m));
    try {
      await api.delete(`/api/classes/${classId}/messages/${messageId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa tin nhắn");
      // Hoàn tác nếu lỗi thì phải gọi lại API lịch sử, tạm thời để đơn giản có thể bỏ qua hoàn tác
    }
  }, [classId]);

  // Thêm/Đổi reaction
  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    // Cập nhật lạc quan
    setMessages(prev => prev.map(m => {
      if (m._id === messageId) {
        let newSummary = [...(m.reactionsSummary || [])];
        const oldReaction = m.userReaction;

        if (oldReaction === emoji) {
          // Toggle off
          newSummary = newSummary.map(r => r.emoji === emoji ? { ...r, count: r.count - 1 } : r).filter(r => r.count > 0);
          return { ...m, userReaction: null, reactionsSummary: newSummary };
        } else {
          // Trừ cũ
          if (oldReaction) {
            newSummary = newSummary.map(r => r.emoji === oldReaction ? { ...r, count: r.count - 1 } : r).filter(r => r.count > 0);
          }
          // Cộng mới
          const existing = newSummary.find(r => r.emoji === emoji);
          if (existing) {
            existing.count++;
          } else {
            newSummary.push({ emoji, count: 1 });
          }
          return { ...m, userReaction: emoji, reactionsSummary: newSummary };
        }
      }
      return m;
    }));

    try {
      await api.put(`/api/classes/${classId}/messages/${messageId}/reactions`, { emoji });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật cảm xúc");
    }
  }, [classId]);

  // Đánh dấu đã đọc
  const markAsRead = useCallback(async () => {
    if (messages.length === 0) return;
    const lastMsg = [...messages].reverse().find(m => !m.clientTempId);
    if (!lastMsg) return;
    
    try {
      await api.post(`/api/classes/${classId}/messages/read`, { lastReadMessageId: lastMsg._id });
    } catch (err) {
      console.warn("Failed to mark as read");
    }
  }, [classId, messages]);

  return {
    messages,
    setMessages,
    loading,
    loadingMore,
    nextCursor,
    fetchMessages,
    loadMore,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    markAsRead
  };
}
