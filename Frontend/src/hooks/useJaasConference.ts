import { useState, useCallback } from "react";
import { liveApi } from "../api/liveApi";
import type { IJaasTokenResponseData } from "../interface/liveInterface";
import { toast } from "../utils/toast";

export interface JaasConferenceData {
  sessionId: string;
  roomName: string;
  appId: string;
  domain: string;
  token: string;
  moderator: boolean;
}

export function useJaasConference() {
  const [conference, setConference] = useState<JaasConferenceData | null>(null);
  const [isPreparingConference, setIsPreparingConference] = useState<boolean>(false);
  const [conferenceError, setConferenceError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Mở Conference & Fetch JWT JaaS Token V2 bằng sessionId
  const openConference = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      toast.error("sessionId không hợp lệ để kết nối phòng học.");
      return;
    }

    setIsPreparingConference(true);
    setConferenceError(null);

    try {
      const response = await liveApi.getLiveSessionToken(sessionId);
      const resData = response?.data?.data || (response?.data as unknown as IJaasTokenResponseData);

      if (!resData || !resData.token) {
        throw new Error("Backend không trả về JWT Token hợp lệ!");
      }

      const conferenceData: JaasConferenceData = {
        sessionId: resData.sessionId || sessionId,
        roomName: resData.roomName || "",
        appId: resData.appId || "vpaas-magic-cookie-fbd136285b3941a2a16d9e56702c3bd2",
        domain: resData.domain || import.meta.env.VITE_JAAS_DOMAIN || "8x8.vc",
        token: resData.token,
        moderator: Boolean(resData.moderator),
      };

      setConference(conferenceData);
      setIsModalOpen(true);
    } catch (err: unknown) {
      const errorObj = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      const status = errorObj?.response?.status;
      const msg = errorObj?.response?.data?.message || errorObj?.message || "Không thể lấy token phòng học.";

      setConferenceError(msg);

      if (status === 403) {
        toast.error("Bạn không có quyền tham gia buổi học trực tuyến này!");
      } else if (status === 409) {
        toast.error("Buổi học trực tuyến đã kết thúc.");
      } else {
        toast.error(`Lỗi tham gia phòng học: ${msg}`);
      }
    } finally {
      setIsPreparingConference(false);
    }
  }, []);

  // Đóng Modal & Reset Token trong Memory (Không lưu Storage)
  const closeConference = useCallback(() => {
    setIsModalOpen(false);
    setConference(null);
    setConferenceError(null);
  }, []);

  return {
    conference,
    isPreparingConference,
    conferenceError,
    isModalOpen,
    openConference,
    closeConference,
  };
}

export default useJaasConference;
