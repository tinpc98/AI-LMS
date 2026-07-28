import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "../utils/toast";

interface UseLiveSessionSocketProps {
  classId?: string;
  isTeacher?: boolean;
  onSessionStarted?: (data: { classId: string; sessionId?: string; roomName?: string; title?: string }) => void;
  onSessionEnded?: (data: { classId: string; sessionId?: string }) => void;
}

export function useLiveSessionSocket({
  classId,
  isTeacher = false,
  onSessionStarted,
  onSessionEnded,
}: UseLiveSessionSocketProps) {
  useEffect(() => {
    if (!classId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socket.emit("JOIN_CLASS_ROOM", { classId });

    socket.on("LIVE_SESSION_STARTED", (data: { classId: string; sessionId?: string; roomName?: string; title?: string }) => {
      console.log("📢 [Socket V2] LIVE_SESSION_STARTED:", data);
      if (!isTeacher) {
        toast.info(`📢 Lớp học trực tuyến "${data.title || "Buổi học"}" vừa bắt đầu! Bạn có thể tham gia ngay.`);
      }
      if (onSessionStarted) {
        onSessionStarted(data);
      }
    });

    socket.on("LIVE_SESSION_ENDED", (data: { classId: string; sessionId?: string }) => {
      console.log("📢 [Socket V2] LIVE_SESSION_ENDED:", data);
      if (!isTeacher) {
        toast.info("Buổi học trực tuyến đã kết thúc.");
      }
      if (onSessionEnded) {
        onSessionEnded(data);
      }
    });

    return () => {
      socket.emit("LEAVE_CLASS_ROOM", { classId });
      socket.disconnect();
    };
  }, [classId, isTeacher, onSessionStarted, onSessionEnded]);
}

export default useLiveSessionSocket;
