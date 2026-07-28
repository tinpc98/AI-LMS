import { useCallback } from "react";
import useLiveSessionState from "./useLiveSessionState";
import useJaasConference from "./useJaasConference";
import useLiveSessionSocket from "./useLiveSessionSocket";

interface UseJitsiLiveSessionProps {
  classId?: string;
  isTeacher?: boolean;
}

/**
 * Composite Hook kết hợp 3 hooks modular V2 cho Live Session
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
    isPreparingConference,
    isModalOpen,
    openConference,
    closeConference,
  } = useJaasConference();

  const handleSessionStarted = useCallback(() => {
    void fetchActiveSession();
  }, [fetchActiveSession]);

  const handleSessionEnded = useCallback(() => {
    closeConference();
    void fetchActiveSession();
  }, [closeConference, fetchActiveSession]);

  useLiveSessionSocket({
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
    const targetSessionId = activeSession?.id || activeSession?._id;
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
    isLiveLoading: isLoadingActive || isCreating || isPreparingConference || isEnding,
    handleStartLiveSession,
    handleJoinLiveClass,
    handleEndLiveSession,
    refreshActiveSession: fetchActiveSession,
  };
}

export default useJitsiLiveSession;
