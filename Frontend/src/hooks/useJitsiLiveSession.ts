import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { liveApi } from "../api/liveApi";

interface UseJitsiLiveSessionProps {
  classId?: string;
  isTeacher?: boolean;
}

export function useJitsiLiveSession({ classId, isTeacher = false }: UseJitsiLiveSessionProps) {
  const [isLiveRoomOpen, setIsLiveRoomOpen] = useState(false);
  const [liveRoomName, setLiveRoomName] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [appId, setAppId] = useState("");
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  // 1. Fetch active session on mount
  useEffect(() => {
    if (!classId) return;

    const fetchActiveSession = async () => {
      try {
        const response = await liveApi.getActiveSession(classId);
        const activeRoomName = response?.data?.data?.roomName;
        if (activeRoomName) {
          setLiveRoomName(activeRoomName);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra buổi học trực tuyến đang mở:", err);
      }
    };

    void fetchActiveSession();
  }, [classId]);

  // 2. Realtime Socket.IO Connection per classId
  useEffect(() => {
    if (!classId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socket.emit("JOIN_CLASS_ROOM", { classId, role: isTeacher ? "Teacher" : "Student" });

    socket.on("LIVE_SESSION_STARTED", (data) => {
      console.log("📢 Realtime Live Session Started:", data);
      if (data?.roomName) {
        setLiveRoomName(data.roomName);
        if (!isTeacher) {
          setNotificationMessage(`📢 Lớp học trực tuyến "${data.title || "Buổi học"}" vừa bắt đầu! Bạn có thể nhấn tham gia ngay.`);
        }
      }
    });

    socket.on("LIVE_SESSION_ENDED", () => {
      console.log("📢 Realtime Live Session Ended");
      setLiveRoomName("");
      setIsLiveRoomOpen(false);
      setNotificationMessage("Buổi học trực tuyến đã kết thúc.");
    });

    return () => {
      socket.emit("LEAVE_CLASS_ROOM", { classId });
      socket.disconnect();
    };
  }, [classId, isTeacher]);

  // 3. Teacher Handler: Start Live Session
  const handleStartLiveSession = useCallback(
    async (title?: string) => {
      if (!classId) return;
      setIsLiveLoading(true);

      try {
        const response = await liveApi.createSession({
          classId,
          title: title || "Buổi học trực tuyến",
        });

        const roomNameFromServer = response?.data?.data?.roomName;
        if (!roomNameFromServer) {
          throw new Error("Backend không trả về roomName cho buổi học.");
        }

        const tokenRes = await liveApi.getJaasToken(roomNameFromServer);
        setJwtToken(tokenRes.data.token);
        setAppId(tokenRes.data.appId);
        setLiveRoomName(roomNameFromServer);
        setIsLiveRoomOpen(true);
      } catch (err: any) {
        console.error("Lỗi khởi tạo phòng học online:", err);
        const serverMsg = err?.response?.data?.message || err?.message || "Vui lòng thử lại!";
        alert(`Không thể khởi tạo phòng học online: ${serverMsg}`);
      } finally {
        setIsLiveLoading(false);
      }
    },
    [classId]
  );

  // 4. Student / Teacher Handler: Join Live Session
  const handleJoinLiveClass = useCallback(
    async (targetRoomCode?: string) => {
      const roomToJoin = targetRoomCode || liveRoomName;
      if (!classId || !roomToJoin) {
        alert("Hiện chưa có buổi học trực tuyến nào đang mở cho lớp này.");
        return;
      }

      setIsLiveLoading(true);
      try {
        const response = await liveApi.getJaasToken(roomToJoin);
        setLiveRoomName(roomToJoin);
        setJwtToken(response.data.token);
        setAppId(response.data.appId);
        setIsLiveRoomOpen(true);
      } catch (err: any) {
        console.error("Lỗi khi tham gia phòng học trực tuyến:", err);
        const serverMsg = err?.response?.data?.message || err?.message || "Vui lòng thử lại!";
        alert(`Không thể tham gia buổi học trực tuyến: ${serverMsg}`);
      } finally {
        setIsLiveLoading(false);
      }
    },
    [classId, liveRoomName]
  );

  // 5. Teacher Handler: End Live Session
  const handleEndLiveSession = useCallback(async () => {
    if (!classId) return;
    try {
      await liveApi.endSession(classId);
      setLiveRoomName("");
      setIsLiveRoomOpen(false);
    } catch (err) {
      console.error("Lỗi khi kết thúc phòng học:", err);
    }
  }, [classId]);

  return {
    isLiveRoomOpen,
    setIsLiveRoomOpen,
    liveRoomName,
    setLiveRoomName,
    jwtToken,
    appId,
    isLiveLoading,
    notificationMessage,
    setNotificationMessage,
    handleStartLiveSession,
    handleJoinLiveClass,
    handleEndLiveSession,
  };
}
