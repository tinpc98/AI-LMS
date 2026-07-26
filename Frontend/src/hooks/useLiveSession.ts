import { useState, useCallback } from "react";
import liveApi from "../api/liveApi";
import { toast } from "../utils/toast";
import type { IExtendedLiveSession } from "../types/studentLive";

export function useLiveSession(onJoinLiveRoom?: (meetingRoomId: string) => void) {
  const [selectedSession, setSelectedSession] = useState<IExtendedLiveSession | null>(null);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openJoinModal = useCallback((session: IExtendedLiveSession) => {
    setSelectedSession(session);
    setIsJoinModalOpen(true);
  }, []);

  const closeJoinModal = useCallback(() => {
    setIsJoinModalOpen(false);
    setSelectedSession(null);
  }, []);

  const openDetail = useCallback((session: IExtendedLiveSession) => {
    setSelectedSession(session);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedSession(null);
  }, []);

  const handleConfirmJoin = useCallback(async () => {
    if (!selectedSession) return;
    setIsJoinModalOpen(false);

    const roomId = selectedSession.meetingRoomId;
    if (onJoinLiveRoom && roomId) {
      onJoinLiveRoom(roomId);
    } else if (selectedSession.meetingUrl) {
      window.open(selectedSession.meetingUrl, "_blank");
    } else {
      toast.info("Đang gia nhập lớp học trực tuyến...", "Vào phòng thi/học");
    }
  }, [selectedSession, onJoinLiveRoom]);

  return {
    selectedSession,
    isJoinModalOpen,
    isDetailOpen,
    openJoinModal,
    closeJoinModal,
    openDetail,
    closeDetail,
    handleConfirmJoin,
  };
}

export default useLiveSession;
