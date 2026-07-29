import { useState, useEffect, useCallback } from "react";
import { liveApi } from "../api/liveApi";
import type { ILiveSession } from "../interface/liveInterface";
import type { LiveSessionError } from "../types/liveSession";
import { normalizeLiveSessionError } from "../utils/liveSessionError";
import { toast } from "../utils/toast";

interface UseLiveSessionStateProps {
  classId?: string;
  autoFetchActive?: boolean;
}

export function useLiveSessionState({ classId, autoFetchActive = true }: UseLiveSessionStateProps) {
  const [activeSession, setActiveSession] = useState<ILiveSession | null>(null);
  const [history, setHistory] = useState<ILiveSession[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalItems: 0, totalPages: 0 });

  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [error, setError] = useState<LiveSessionError | null>(null);

  // 1. Fetch Active Session V2 (/api/live/classes/:classId/active)
  const fetchActiveSession = useCallback(async () => {
    if (!classId) return;
    setIsLoadingActive(true);
    setError(null);
    try {
      const res = await liveApi.getActiveLiveSession(classId);
      const data = res?.data?.data || null;
      setActiveSession(data);
    } catch (err: unknown) {
      console.warn("[useLiveSessionState] fetchActiveSession Error:", err);
      const normalized = normalizeLiveSessionError(err);
      if (normalized.originalStatus === 404) {
        setActiveSession(null);
      } else {
        setError(normalized);
      }
    } finally {
      setIsLoadingActive(false);
    }
  }, [classId]);

  // 2. Fetch History V2 (/api/live/classes/:classId/sessions)
  const fetchHistory = useCallback(
    async (page = 1, limit = 10) => {
      if (!classId) return;
      setIsLoadingHistory(true);
      try {
        const res = await liveApi.getLiveSessionHistory(classId, { page, limit });
        if (res?.data?.data) {
          setHistory(res.data.data.items || []);
          setPagination(res.data.data.pagination || { page, limit, totalItems: 0, totalPages: 0 });
        }
      } catch (err: unknown) {
        console.warn("[useLiveSessionState] fetchHistory Error:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [classId]
  );

  // 3. Create Session V2 (/api/live/sessions)
  const createSession = useCallback(
    async (title?: string) => {
      if (!classId) throw new Error("Thiếu classId để tạo buổi học!");
      setIsCreating(true);
      setError(null);
      try {
        const res = await liveApi.createLiveSession({ classId, title });
        const createdSession = res?.data?.data;
        if (!createdSession) {
          throw new Error("Không nhận được dữ liệu phiên học từ Server.");
        }
        setActiveSession(createdSession);
        toast.success("Đã bắt đầu buổi học trực tuyến.");
        return createdSession;
      } catch (err: unknown) {
        const normalized = normalizeLiveSessionError(err);
        setError(normalized);
        toast.error(`Không thể bắt đầu buổi học: ${normalized.message}`);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [classId]
  );

  // 4. End Session V2 (/api/live/sessions/:sessionId/end)
  const endSession = useCallback(
    async (sessionIdParam?: string) => {
      const targetId = sessionIdParam || activeSession?.id || (activeSession as any)?._id;
      if (!targetId) {
        toast.error("Không tìm thấy sessionId để kết thúc.");
        return null;
      }
      setIsEnding(true);
      try {
        const res = await liveApi.endLiveSession(targetId);
        setActiveSession(null);
        toast.success("Đã kết thúc buổi học trực tuyến.");
        return res?.data?.data || null;
      } catch (err: unknown) {
        const normalized = normalizeLiveSessionError(err);
        setError(normalized);
        toast.error(`Lỗi khi kết thúc buổi học: ${normalized.message}`);
        throw err;
      } finally {
        setIsEnding(false);
      }
    },
    [activeSession]
  );

  useEffect(() => {
    if (autoFetchActive && classId) {
      void fetchActiveSession();
    }
  }, [classId, autoFetchActive, fetchActiveSession]);

  return {
    activeSession,
    history,
    pagination,
    isLoadingActive,
    isCreating,
    isEnding,
    isLoadingHistory,
    error,
    fetchActiveSession,
    fetchHistory,
    createSession,
    endSession,
    refresh: fetchActiveSession,
  };
}

export default useLiveSessionState;
