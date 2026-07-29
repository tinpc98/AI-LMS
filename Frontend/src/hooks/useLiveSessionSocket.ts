import { useEffect, useCallback, useRef, useState } from "react";
import { connectSocket, getSocket } from "../services/socketClient";
import { toast } from "../utils/toast";

export interface LiveSessionSocketEventData {
  classId: string;
  sessionId?: string;
  roomName?: string;
  title?: string;
  status?: string;
  timestamp?: string;
  activeCount?: number;
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
  onNetworkChange?: (isOnline: boolean) => void;
  onParticipantsUpdated?: (count: number) => void;
}

export function useLiveSessionSocket({
  classId,
  isTeacher = false,
  onSessionStarted,
  onSessionEnded,
  onNetworkChange,
}: UseLiveSessionSocketProps) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);

  const onStartedRef = useRef(onSessionStarted);
  const onEndedRef = useRef(onSessionEnded);
  const onNetworkChangeRef = useRef(onNetworkChange);
  const onParticipantsUpdatedRef = useRef(onParticipantsUpdated);

  useEffect(() => {
    onStartedRef.current = onSessionStarted;
    onEndedRef.current = onSessionEnded;
    onNetworkChangeRef.current = onNetworkChange;
    onParticipantsUpdatedRef.current = onParticipantsUpdated;
  }, [onSessionStarted, onSessionEnded, onNetworkChange, onParticipantsUpdated]);

  // 1. Lắng nghe trạng thái mạng Online/Offline
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onNetworkChangeRef.current) onNetworkChangeRef.current(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (onNetworkChangeRef.current) onNetworkChangeRef.current(false);
      toast.warning("Mất kết nối mạng. Buổi học trực tuyến có thể bị gián đoạn.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSessionStarted = useCallback(
    (data: LiveSessionSocketEventData) => {
      console.log("📢 [Socket V2] LIVE_SESSION_STARTED received:", data);
      if (data?.classId && data.classId !== classId) return;

      if (!isTeacher) {
        toast.info(`📢 Lớp học trực tuyến "${data.title || "Buổi học"}" vừa bắt đầu! Bạn có thể tham gia ngay.`);
      }

      if (onStartedRef.current) {
        onStartedRef.current(data);
      }
    },
    [classId, isTeacher]
  );

  const handleSessionEnded = useCallback(
    (data: LiveSessionSocketEventData) => {
      console.log("📢 [Socket V2] LIVE_SESSION_ENDED received:", data);
      if (data?.classId && data.classId !== classId) return;

      if (!isTeacher) {
        toast.info("Giáo viên đã kết thúc buổi học.");
      }

      if (onEndedRef.current) {
        onEndedRef.current(data);
      }
    },
    [classId, isTeacher]
  );

  useEffect(() => {
    if (!classId) return;

    const socket = connectSocket();

    const updateConnectStatus = () => {
      setIsSocketConnected(socket.connected);
    };

    updateConnectStatus();

    // Join room với payload { classId } và Callback Ack
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

    // Đăng ký listeners (Xóa cũ để tránh duplicate)
    socket.off("LIVE_SESSION_STARTED", handleSessionStarted);
    socket.off("LIVE_SESSION_ENDED", handleSessionEnded);
    socket.off("LIVE_PARTICIPANTS_UPDATED");
    socket.off("connect", updateConnectStatus);
    socket.off("disconnect", updateConnectStatus);

    socket.on("LIVE_SESSION_STARTED", handleSessionStarted);
    socket.on("LIVE_SESSION_ENDED", handleSessionEnded);
    socket.on("LIVE_PARTICIPANTS_UPDATED", (data: any) => {
      if (data?.classId === classId && onParticipantsUpdatedRef.current) {
        onParticipantsUpdatedRef.current(data.activeCount);
      }
    });
    socket.on("connect", updateConnectStatus);
    socket.on("disconnect", updateConnectStatus);

    // Tự động re-join room khi socket reconnect
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
      socket.off("LIVE_PARTICIPANTS_UPDATED");
      socket.off("connect", updateConnectStatus);
      socket.off("disconnect", updateConnectStatus);
      socket.off("connect", handleReconnect);

      socket.emit("LEAVE_CLASS_ROOM", { classId }, () => {});
    };
  }, [classId, handleSessionStarted, handleSessionEnded]);

  return {
    isOnline,
    isSocketConnected,
  };
}

export default useLiveSessionSocket;
