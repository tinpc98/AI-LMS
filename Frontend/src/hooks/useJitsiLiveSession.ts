import { useState, useEffect, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { liveApi } from "../api/liveApi";
import { toast } from "../utils/toast";

interface UseJitsiLiveSessionProps {
  classId?: string;
  isTeacher?: boolean;
}

export function useJitsiLiveSession({ classId, isTeacher = false }: UseJitsiLiveSessionProps) {
  const [isLiveRoomOpen, setIsLiveRoomOpen] = useState(false);
  const [meetingRoomId, setMeetingRoomId] = useState("");
  const [jwtToken, setJwtToken] = useState("");
  const [appId, setAppId] = useState("");
  const [isLiveLoading, setIsLiveLoading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!classId) return;

    const fetchActiveSession = async () => {
      try {
        const response = await liveApi.getActiveSession(classId);
        const activeMeetingRoomId = response?.data?.data?.meetingRoomId;
        if (activeMeetingRoomId) {
          setMeetingRoomId(activeMeetingRoomId);
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra buổi học trực tuyến đang mở:", err);
      }
    };

    void fetchActiveSession();
  }, [classId]);

  useEffect(() => {
    if (!classId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
    const socket: Socket = io(socketUrl, {
      transports: ["websocket", "polling"],
    });

    socket.emit("JOIN_CLASS_ROOM", { classId, role: isTeacher ? "Teacher" : "Student" });

    socket.on("LIVE_SESSION_STARTED", (data) => {
      console.log("📢 Realtime Live Session Started:", data);
      if (data?.meetingRoomId) {
        setMeetingRoomId(data.meetingRoomId);
        if (!isTeacher) {
          setNotificationMessage(`📢 Lớp học trực tuyến "${data.title || "Buổi học"}" vừa bắt đầu! Bạn có thể nhấn tham gia ngay.`);
        }
      }
    });

    socket.on("LIVE_SESSION_ENDED", () => {
      console.log("📢 Realtime Live Session Ended");
      setMeetingRoomId("");
      setIsLiveRoomOpen(false);
      setNotificationMessage("Buổi học trực tuyến đã kết thúc.");
    });

    return () => {
      socket.emit("LEAVE_CLASS_ROOM", { classId });
      socket.disconnect();
    };
  }, [classId, isTeacher]);

  const handleStartLiveSession = useCallback(
    async () => {
      if (!classId) return;
      setIsLiveLoading(true);

      try {
        const response = await liveApi.createSession({ classId });
        const meetingRoomIdFromServer = response?.data?.data?.meetingRoomId;
        if (!meetingRoomIdFromServer) {
          throw new Error("Backend không trả về meetingRoomId cho buổi học.");
        }

        const tokenRes = await liveApi.getJaasToken(meetingRoomIdFromServer);
        setJwtToken(tokenRes.data.token);
        setAppId(tokenRes.data.appId);
        setMeetingRoomId(meetingRoomIdFromServer);
        setIsLiveRoomOpen(true);
      } catch (err: any) {
        console.error("Lỗi khởi tạo buổi học trực tuyến:", err);
        const serverMsg = err?.response?.data?.message || err?.message || "Vui lòng thử lại!";
        toast.error(`Không thể khởi tạo buổi học trực tuyến: ${serverMsg}`);
      } finally {
        setIsLiveLoading(false);
      }
    },
    [classId]
  );

  const handleJoinLiveClass = useCallback(async () => {
    if (!classId) {
      toast.info("Không thể xác định lớp học.");
      return;
    }

    setIsLiveLoading(true);
    try {
      const response = await liveApi.getActiveSession(classId);
      const meetingRoomIdFromServer = response?.data?.data?.meetingRoomId;

      if (!meetingRoomIdFromServer) {
        toast.info("Giáo viên chưa bắt đầu buổi học.");
        return;
      }

      const tokenRes = await liveApi.getJaasToken(meetingRoomIdFromServer);
      setJwtToken(tokenRes.data.token);
      setAppId(tokenRes.data.appId);
      setMeetingRoomId(meetingRoomIdFromServer);
      setIsLiveRoomOpen(true);
    } catch (err: any) {
      console.error("Lỗi khi tham gia buổi học trực tuyến:", err);
      const serverMsg = err?.response?.data?.message || err?.message || "Vui lòng thử lại!";
      toast.error(`Không thể tham gia buổi học trực tuyến: ${serverMsg}`);
    } finally {
      setIsLiveLoading(false);
    }
  }, [classId]);

  const handleEndLiveSession = useCallback(async () => {
    if (!classId) return;
    try {
      await liveApi.endSession(classId);
      setMeetingRoomId("");
      setIsLiveRoomOpen(false);
    } catch (err) {
      console.error("Lỗi khi kết thúc buổi học:", err);
    }
  }, [classId]);

  return {
    isLiveRoomOpen,
    setIsLiveRoomOpen,
    meetingRoomId,
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
