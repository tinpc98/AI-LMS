import { useState, useCallback, useRef, useEffect } from "react";
import { liveApi } from "../../../api/liveApi";
import type {
  ConferenceStatus,
  JaasConferenceData,
  LiveSessionError,
} from "../../../types/liveSession";
import { normalizeLiveSessionError } from "../../../utils/liveSessionError";
import envConfig from "../../../config/env";
import { toast } from "../../../utils/toast";

export type { ConferenceStatus, JaasConferenceData, LiveSessionError };

export function useJaasConference() {
  const [conference, setConference] = useState<JaasConferenceData | null>(null);
  const [status, setStatus] = useState<ConferenceStatus>("idle");
  const [error, setError] = useState<LiveSessionError | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // In-flight request ref để triệt tiêu double request khi click nhanh hoặc re-render
  const inFlightRef = useRef<string | null>(null);

  // Clear toàn bộ Token và State trong memory
  const clearConferenceMemory = useCallback(() => {
    setConference(null);
    setError(null);
    inFlightRef.current = null;
  }, []);

  // Đóng Conference an toàn với lifecycle chuyển trạng thái closing -> closed
  const closeConference = useCallback(() => {
    setStatus("closing");
    setIsOpen(false);
    clearConferenceMemory();
    setStatus("closed");
  }, [clearConferenceMemory]);

  // Đóng lập tức trong tình huống khẩn cấp hoặc session ended
  const forceCloseConference = useCallback(() => {
    setIsOpen(false);
    clearConferenceMemory();
    setStatus("closed");
  }, [clearConferenceMemory]);

  // Mở Conference & Fetch JWT JaaS Token V2 với Double Request Guard
  const openConference = useCallback(
    async (sessionId: string) => {
      if (!sessionId) {
        const normalized = normalizeLiveSessionError(
          new Error("sessionId không hợp lệ để kết nối phòng học.")
        );
        setError(normalized);
        setStatus("error");
        return;
      }

      // Guard double request: nếu đang in-flight request đúng sessionId hoặc state preparing/joining
      if (inFlightRef.current === sessionId || status === "preparing" || status === "joining") {
        console.warn(
          `⚠️ [useJaasConference] In-flight request blocked for sessionId: ${sessionId}`
        );
        return;
      }

      inFlightRef.current = sessionId;
      setStatus("preparing");
      setError(null);

      try {
        const response = await liveApi.getLiveSessionToken(sessionId);
        const resData = response?.data?.data || (response?.data as unknown as JaasConferenceData);

        if (!resData || !resData.token) {
          throw new Error("Backend không trả về JWT Token hợp lệ!");
        }

        const conferenceData: JaasConferenceData = {
          sessionId: resData.sessionId || sessionId,
          roomName: resData.roomName || "",
          appId: resData.appId || "",
          domain: envConfig.jaasDomain,
          token: resData.token,
          moderator: Boolean(resData.moderator),
          expiresAt: resData.expiresAt,
        };

        setConference(conferenceData);
        setIsOpen(true);
        setStatus("ready");
      } catch (err: unknown) {
        const normalized = normalizeLiveSessionError(err);
        setError(normalized);
        setStatus("error");
        setIsOpen(false);

        // Đọc MÃ thay vì mã HTTP. Module live-session đã có sẵn danh mục LIVE_ERROR_CODES ở
        // Backend/src/modules/live-session/live.validator.js, và normalizeLiveSessionError đã
        // đưa nó ra qua trường code — trước đây không ai dùng.
        //
        // Vì sao đáng đổi: 403 gộp chung "giáo viên không phụ trách lớp", "học sinh chưa ghi
        // danh" và "quản trị viên không được phép thao tác" — ba tình huống cần ba câu khác
        // nhau. 409 cũng gộp "buổi học đã kết thúc" với "đã có buổi học đang diễn ra", trong
        // đó câu thứ hai bảo người dùng sai hoàn toàn.
        if (normalized.code === "LIVE_STUDENT_NOT_ENROLLED") {
          toast.error("Bạn chưa ghi danh vào lớp học này.");
        } else if (normalized.code === "LIVE_TEACHER_NOT_OWNER") {
          toast.error("Bạn không phải giáo viên phụ trách lớp học này.");
        } else if (normalized.code === "LIVE_SESSION_ALREADY_ENDED") {
          toast.error("Buổi học trực tuyến đã kết thúc.");
        } else if (normalized.code === "LIVE_SESSION_ALREADY_ACTIVE") {
          toast.error("Lớp đang có một buổi học trực tuyến diễn ra.");
        } else if (normalized.severity === "error") {
          toast.error(normalized.message);
        }
      } finally {
        inFlightRef.current = null;
      }
    },
    [status]
  );

  // Retry lấy token hoặc mount lại SDK
  const retryConference = useCallback(async () => {
    const targetSessionId = conference?.sessionId || inFlightRef.current;
    if (targetSessionId) {
      clearConferenceMemory();
      await openConference(targetSessionId);
    } else {
      setStatus("idle");
      setError(null);
    }
  }, [conference?.sessionId, openConference, clearConferenceMemory]);

  // Set status chủ động cho các lifecycle callback từ Jitsi SDK
  const setConferenceStatus = useCallback((nextStatus: ConferenceStatus) => {
    setStatus(nextStatus);
  }, []);

  // Cleanup khi unmount hook / component chứa hook
  useEffect(() => {
    return () => {
      clearConferenceMemory();
    };
  }, [clearConferenceMemory]);

  return {
    conference,
    status,
    error,
    isOpen,
    isPreparingConference: status === "preparing",
    openConference,
    retryConference,
    closeConference,
    forceCloseConference,
    setConferenceStatus,
  };
}

export default useJaasConference;
