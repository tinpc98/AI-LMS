import { useState, useCallback } from "react";
import { getCurrentUserId } from "../../../shared/utils/authToken";
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
  const [waitingExamData, setWaitingExamData] = useState<{ examId: string; startTime: string; title: string } | null>(null);

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
        navigate(`/exam/${attemptId}`);
      } else {
        const studentId = getCurrentUserId();
        if (!studentId) {
          toast.error(
            "Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!",
            "Lỗi xác thực"
          );
          return;
        }
        try {
          const oldToken = localStorage.getItem(`exam_token_latest`);
          let tabId = sessionStorage.getItem("exam_tab_id");
          if (!tabId) {
            tabId = "tab_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem("exam_tab_id", tabId);
          }

          const response = await axiosClient.post<{ data: { _id: string, sessionToken?: string } }>(
            "/api/exam-attempts/start",
            {
              examId,
              studentId,
              sessionToken: oldToken,
              tabId
            }
          );
          const newAttemptId = response.data.data._id;
          if (response.data.data.sessionToken) {
            localStorage.setItem(`exam_token_${newAttemptId}`, response.data.data.sessionToken);
            localStorage.setItem(`exam_token_latest`, response.data.data.sessionToken);
          }
          navigate(`/exam/${newAttemptId}`);
        } catch (error: any) {
          console.error("Lỗi khi tạo phiên làm bài:", error);
          if (error?.response?.data?.errorCode === "NOT_STARTED") {
            const startTimeStr = error.response.data.startTime;
            if (startTimeStr) {
              setWaitingExamData({ examId, startTime: startTimeStr, title: "Kỳ thi" });
              setIsStartModalOpen(false);
            } else {
              toast.error("Kỳ thi chưa tới giờ bắt đầu!", "Lỗi bài thi");
            }
            return;
          }
          if (error?.response?.data?.errorCode === "SESSION_ACTIVE") {
            if (window.confirm("Hệ thống phát hiện phiên làm bài đang mở hoặc chưa được đóng đúng cách. Bấm Tiếp tục để kết nối lại.")) {
               try {
                  let tabId = sessionStorage.getItem("exam_tab_id");
                  if (!tabId) {
                    tabId = "tab_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
                    sessionStorage.setItem("exam_tab_id", tabId);
                  }
                  const takeoverRes = await axiosClient.post<{ data: { _id: string, sessionToken?: string } }>(
                    "/api/exam-attempts/start",
                    { examId, studentId, takeover: true, tabId }
                  );
                  const newAttemptId = takeoverRes.data.data._id;
                  if (takeoverRes.data.data.sessionToken) {
                    localStorage.setItem(`exam_token_${newAttemptId}`, takeoverRes.data.data.sessionToken);
                    localStorage.setItem(`exam_token_latest`, takeoverRes.data.data.sessionToken);
                  }
                  navigate(`/exam/${newAttemptId}`);
                  return;
               } catch (e: any) {
                  toast.error(getApiErrorMessage(e, "Không thể bắt đầu bài thi."), "Lỗi bài thi");
               }
            } else {
                return;
            }
          }
          toast.error(getApiErrorMessage(error, "Không thể bắt đầu bài thi."), "Lỗi bài thi");
        }
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
