import { useEffect, useCallback, useRef } from "react";
import { connectSocket } from "../services/socketClient";
import { toast } from "../utils/toast";

export interface LiveSessionSocketEventData {
  classId: string;
  sessionId?: string;
  roomName?: string;
  title?: string;
  status?: string;
  timestamp?: string;
}

export interface SocketAckResponse {
  success: boolean;
  code?: string;
  message?: string;
  data?: {
    classId: string;
    room: string;
    accessType?: string;
  };
}

interface UseLiveSessionSocketProps {
  classId?: string;
  isTeacher?: boolean;
  onSessionStarted?: (data: LiveSessionSocketEventData) => void;
  onSessionEnded?: (data: LiveSessionSocketEventData) => void;
}

export function useLiveSessionSocket({
  classId,
  isTeacher = false,
  onSessionStarted,
  onSessionEnded,
}: UseLiveSessionSocketProps) {
  const onStartedRef = useRef(onSessionStarted);
  const onEndedRef = useRef(onSessionEnded);

  useEffect(() => {
    onStartedRef.current = onSessionStarted;
    onEndedRef.current = onSessionEnded;
  }, [onSessionStarted, onSessionEnded]);

  const handleSessionStarted = useCallback((data: LiveSessionSocketEventData) => {
    console.log("📢 [Socket V2] LIVE_SESSION_STARTED received:", data);
    if (data?.classId && data.classId !== classId) return;

    if (!isTeacher) {
      toast.info(`📢 Lớp học trực tuyến "${data.title || "Buổi học"}" vừa bắt đầu! Bạn có thể tham gia ngay.`);
    }

    if (onStartedRef.current) {
      onStartedRef.current(data);
    }
  }, [classId, isTeacher]);

  const handleSessionEnded = useCallback((data: LiveSessionSocketEventData) => {
    console.log("📢 [Socket V2] LIVE_SESSION_ENDED received:", data);
    if (data?.classId && data.classId !== classId) return;

    if (!isTeacher) {
      toast.info("Buổi học trực tuyến đã kết thúc.");
    }

    if (onEndedRef.current) {
      onEndedRef.current(data);
    }
  }, [classId, isTeacher]);

  useEffect(() => {
    if (!classId) return;

    const socket = connectSocket();

    // 1. Emit JOIN_CLASS_ROOM với payload chỉ có { classId } và Acknowledgement Callback
    const joinRoom = () => {
      socket.emit("JOIN_CLASS_ROOM", { classId }, (res: SocketAckResponse) => {
        if (res && !res.success) {
          console.warn(`🔒 [Socket Join Refused] Code: ${res.code}, Message: ${res.message}`);
          if (res.code === "SOCKET_ADMIN_NOT_ALLOWED") {
            console.log("ℹ️ Quản trị viên không tham gia socket room Live Session.");
          } else {
            toast.error(res.message || "Không có quyền tham gia kênh thời gian thực của lớp.");
          }
        } else {
          console.log(`✅ [Socket Joined Ack] Room: ${res?.data?.room}`);
        }
      });
    };

    joinRoom();

    // 2. Đăng ký exact event handlers
    socket.on("LIVE_SESSION_STARTED", handleSessionStarted);
    socket.on("LIVE_SESSION_ENDED", handleSessionEnded);

    // 3. Tự động re-join room khi socket reconnect
    const handleReconnect = () => {
      console.log("🔄 [Socket Reconnected] Re-joining class room:", classId);
      joinRoom();
      if (onStartedRef.current) {
        onStartedRef.current({ classId });
      }
    };

    socket.on("connect", handleReconnect);

    // Cleanup: gỡ bỏ exact listeners và emit LEAVE_CLASS_ROOM
    return () => {
      socket.off("LIVE_SESSION_STARTED", handleSessionStarted);
      socket.off("LIVE_SESSION_ENDED", handleSessionEnded);
      socket.off("connect", handleReconnect);

      socket.emit("LEAVE_CLASS_ROOM", { classId }, () => {});
    };
  }, [classId, handleSessionStarted, handleSessionEnded]);
}

export default useLiveSessionSocket;
