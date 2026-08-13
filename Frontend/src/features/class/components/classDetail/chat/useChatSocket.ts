import { useEffect, useCallback, useRef, useState } from "react";
import { connectSocket } from "../../../../../shared/lib/socketClient";
import { toast } from "../../../../../utils/toast";
import type { ChatMessage, ChatReaction, UserReaction } from "../../../types/chat.types";

interface UseChatSocketProps {
  classId: string;
  onMessageReceived: (message: ChatMessage) => void;
  onMessageEdited: (message: ChatMessage) => void;
  onMessageDeleted: (data: { messageId: string; isDeleted: boolean }) => void;
  onReactionUpdated: (data: { messageId: string; reactionsSummary: ChatReaction[]; userReaction: UserReaction }) => void;
  onUserTyping: (data: { userId: string; userName: string; isTyping: boolean }) => void;
}

export function useChatSocket({
  classId,
  onMessageReceived,
  onMessageEdited,
  onMessageDeleted,
  onReactionUpdated,
  onUserTyping,
}: UseChatSocketProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);

  const onMsgReceivedRef = useRef(onMessageReceived);
  const onMsgEditedRef = useRef(onMessageEdited);
  const onMsgDeletedRef = useRef(onMessageDeleted);
  const onReactionUpdatedRef = useRef(onReactionUpdated);
  const onUserTypingRef = useRef(onUserTyping);

  useEffect(() => {
    onMsgReceivedRef.current = onMessageReceived;
    onMsgEditedRef.current = onMessageEdited;
    onMsgDeletedRef.current = onMessageDeleted;
    onReactionUpdatedRef.current = onReactionUpdated;
    onUserTypingRef.current = onUserTyping;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Mất kết nối mạng. Tin nhắn sẽ được gửi khi có mạng lại.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!classId) return;

    const socket = connectSocket();

    const updateConnectStatus = () => {
      setIsSocketConnected(socket.connected);
    };

    updateConnectStatus();

    const joinRoom = () => {
      socket.emit("JOIN_CHAT_ROOM", { classId }, (res: { success: boolean; message?: string }) => {
        if (res && !res.success) {
          toast.error(res.message || "Không thể tham gia phòng chat.");
        }
      });
    };

    joinRoom();

    const handleNewMessage = (msg: ChatMessage) => {
      if (msg.classId === classId && onMsgReceivedRef.current) {
        onMsgReceivedRef.current(msg);
      }
    };

    const handleEditMessage = (msg: ChatMessage) => {
      if (msg.classId === classId && onMsgEditedRef.current) {
        onMsgEditedRef.current(msg);
      }
    };

    const handleDeleteMessage = (data: { classId: string; messageId: string; isDeleted: boolean }) => {
      if (data.classId === classId && onMsgDeletedRef.current) {
        onMsgDeletedRef.current(data);
      }
    };

    const handleReaction = (data: { messageId: string; reactionsSummary: ChatReaction[]; userReaction: UserReaction }) => {
      // Backend emit payload này thẳng cho frontend, classId có thể không có ở cấp root nhưng room đã lọc
      if (onReactionUpdatedRef.current) {
        onReactionUpdatedRef.current(data);
      }
    };

    const handleTyping = (data: { classId: string; userId: string; userName: string; isTyping: boolean }) => {
      if (data.classId === classId && onUserTypingRef.current) {
        onUserTypingRef.current(data);
      }
    };

    socket.on("CHAT_NEW_MESSAGE", handleNewMessage);
    socket.on("CHAT_EDIT_MESSAGE", handleEditMessage);
    socket.on("CHAT_DELETE_MESSAGE", handleDeleteMessage);
    socket.on("CHAT_REACTION_UPDATE", handleReaction);
    socket.on("CHAT_USER_TYPING", handleTyping);
    socket.on("connect", updateConnectStatus);
    socket.on("disconnect", updateConnectStatus);

    const handleReconnect = () => {
      joinRoom();
    };
    socket.on("connect", handleReconnect);

    return () => {
      socket.off("CHAT_NEW_MESSAGE", handleNewMessage);
      socket.off("CHAT_EDIT_MESSAGE", handleEditMessage);
      socket.off("CHAT_DELETE_MESSAGE", handleDeleteMessage);
      socket.off("CHAT_REACTION_UPDATE", handleReaction);
      socket.off("CHAT_USER_TYPING", handleTyping);
      socket.off("connect", updateConnectStatus);
      socket.off("disconnect", updateConnectStatus);
      socket.off("connect", handleReconnect);

      socket.emit("LEAVE_CHAT_ROOM", { classId }, () => {});
    };
  }, [classId]);

  const emitTyping = useCallback((isTyping: boolean) => {
    const socket = connectSocket();
    if (socket.connected) {
      socket.emit(isTyping ? "TYPING_START" : "TYPING_END", { classId });
    }
  }, [classId]);

  return {
    isOnline,
    isSocketConnected,
    emitTyping
  };
}
