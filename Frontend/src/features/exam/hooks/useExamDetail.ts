import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { IExtendedExam } from "../../../types/studentExam";
import axiosClient from "../../../api/axiosClient";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

export function useExamDetail() {
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<IExtendedExam | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [waitingExamData, setWaitingExamData] = useState<{ examId: string; startAt: string; title: string } | null>(null);

  const openDetail = useCallback((item: IExtendedExam) => {
    setSelectedExam(item);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedExam(null);
  }, []);

  const openStartModal = useCallback((item: IExtendedExam) => {
    setSelectedExam(item);
    setIsStartModalOpen(true);
  }, []);

  const closeStartModal = useCallback(() => {
    setIsStartModalOpen(false);
  }, []);

  const handleConfirmStart = useCallback(
    async (examId: string, attemptId?: string) => {
      setIsStartModalOpen(false);
      setIsDetailOpen(false);

      if (attemptId) {
        // Resume existing attempt
        navigate(`/exam/${attemptId}`);
        return;
      }

      try {
        let tabId = sessionStorage.getItem("exam_tab_id");
        if (!tabId) {
          tabId = "tab_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
          sessionStorage.setItem("exam_tab_id", tabId);
        }

        // ĐÚNG route: POST /exams/:examId/start (không phải /exam-attempts/start)
        const response = await axiosClient.post<{
          success: boolean;
          data: { _id: string; sessionToken?: string; expiresAt?: string; isResume?: boolean };
        }>(`/exams/${examId}/start`, { tabId });

        const attempt = response.data.data;
        const newAttemptId = attempt._id;

        if (attempt.sessionToken) {
          localStorage.setItem(`exam_token_${newAttemptId}`, attempt.sessionToken);
          localStorage.setItem(`exam_token_latest`, attempt.sessionToken);
        }

        navigate(`/exam/${newAttemptId}`);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { errorCode?: string; startAt?: string; message?: string } } };
        console.error("Lỗi khi tạo phiên làm bài:", error);

        if (err?.response?.data?.errorCode === "EXAM_NOT_STARTED") {
          const startAtStr = err.response?.data?.startAt;
          if (startAtStr) {
            setWaitingExamData({ examId, startAt: startAtStr, title: "Kỳ thi" });
            setIsStartModalOpen(false);
          } else {
            toast.error("Kỳ thi chưa tới giờ bắt đầu!", "Lỗi bài thi");
          }
          return;
        }

        toast.error(
          getApiErrorMessage(error, "Không thể bắt đầu bài thi."),
          "Lỗi bài thi"
        );
      }
    },
    [navigate]
  );

  return {
    selectedExam,
    isDetailOpen,
    isStartModalOpen,
    openDetail,
    closeDetail,
    openStartModal,
    closeStartModal,
    handleConfirmStart,
    waitingExamData,
    setWaitingExamData,
  };
}

export default useExamDetail;
