import { useCallback } from "react";
import useLiveSessionState from "./useLiveSessionState";
import useJaasConference from "./useJaasConference";
import useLiveSessionSocket, { type LiveSessionSocketEventData } from "./useLiveSessionSocket";

interface UseJitsiLiveSessionProps {
  classId?: string;
  isTeacher?: boolean;
}

/**
 * Composite Hook kết hợp 3 hooks modular V2 cho Live Session (Sprint J6)
 */
export function useJitsiLiveSession({ classId, isTeacher = false }: UseJitsiLiveSessionProps) {
  const {
    activeSession,
    isLoadingActive,
    isCreating,
    isEnding,
    fetchActiveSession,
    createSession,
    endSession,
  } = useLiveSessionState({ classId });

  const {
    conference,
    status: conferenceStatus,
    error: conferenceError,
    isOpen: isModalOpen,
    openConference,
    retryConference,
    closeConference,
    forceCloseConference,
    setConferenceStatus,
  } = useJaasConference();

  const handleSessionStarted = useCallback(() => {
    void fetchActiveSession();
  }, [fetchActiveSession]);

  const handleSessionEnded = useCallback(
    (data: LiveSessionSocketEventData) => {
      // Chỉ đóng modal nếu session bị kết thúc trùng với session hiện tại trong phòng
      if (!data?.sessionId || (conference?.sessionId && data.sessionId === conference.sessionId)) {
        forceCloseConference();
      }
      void fetchActiveSession();
    },
    [conference?.sessionId, forceCloseConference, fetchActiveSession]
  );

  const { isOnline, isSocketConnected } = useLiveSessionSocket({
    classId,
    isTeacher,
    onSessionStarted: handleSessionStarted,
    onSessionEnded: handleSessionEnded,
  });

  const handleStartLiveSession = useCallback(async () => {
    try {
      const newSession = await createSession();
      if (newSession && newSession.id) {
        await openConference(newSession.id);
      }
    } catch (err) {
      console.error("[useJitsiLiveSession] handleStartLiveSession Error:", err);
    }
  }, [createSession, openConference]);

  const handleJoinLiveClass = useCallback(async () => {
    const targetSessionId = activeSession?.id || (activeSession as any)?._id;
    if (targetSessionId) {
      await openConference(targetSessionId);
    } else {
      await fetchActiveSession();
    }
  }, [activeSession, openConference, fetchActiveSession]);

  const handleEndLiveSession = useCallback(async () => {
    try {
      await endSession();
      closeConference();
      await fetchActiveSession();
    } catch (err) {
      console.error("[useJitsiLiveSession] handleEndLiveSession Error:", err);
    }
  }, [endSession, closeConference, fetchActiveSession]);

  return {
    isLiveRoomOpen: isModalOpen,
    setIsLiveRoomOpen: (open: boolean) => {
      if (!open) closeConference();
    },
    activeSession,
    meetingRoomId: conference?.roomName || activeSession?.roomName || "",
    jwtToken: conference?.token || "",
    appId: conference?.appId || "",
    domain: conference?.domain || "8x8.vc",
    conference,
    conferenceStatus,
    conferenceError,
    notificationMessage: null,
    setNotificationMessage: () => {},
    isLiveLoading: isLoadingActive || isCreating || conferenceStatus === "preparing" || isEnding,
    isOnline,
    isSocketConnected,
    handleStartLiveSession,
    handleJoinLiveClass,
    handleEndLiveSession,
    retryConference,
    closeConference,
    setConferenceStatus,
    refreshActiveSession: fetchActiveSession,
  };
}

export default useJitsiLiveSession;
