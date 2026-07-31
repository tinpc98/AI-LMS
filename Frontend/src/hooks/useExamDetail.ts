import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { IExtendedExam } from "../types/studentExam";
import axiosClient from "../api/axiosClient";
import { toast } from "../utils/toast";

export function useExamDetail() {
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<IExtendedExam | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

  const getStudentId = useCallback((): string | null => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decodedToken = JSON.parse(jsonPayload);
      return decodedToken._id || decodedToken.id || decodedToken.userId;
    } catch {
      return null;
    }
  }, []);

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
        const studentId = getStudentId();
        if (!studentId) {
          toast.error(
            "Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!",
            "Lỗi xác thực"
          );
          return;
        }
        try {
          const response = await axiosClient.post<{ data: { _id: string } }>(
            "/api/exam-attempts/start",
            {
              examId,
              studentId,
            }
          );
          const newAttemptId = response.data.data._id;
          navigate(`/exam/${newAttemptId}`);
        } catch (error: any) {
          console.error("Lỗi khi tạo phiên làm bài:", error);
          toast.error(error.response?.data?.message || "Không thể bắt đầu bài thi.", "Lỗi bài thi");
        }
      }
    },
    [navigate, getStudentId]
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
  };
}

export default useExamDetail;
