import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { IExtendedExam } from "../types/studentExam";

export function useExamDetail() {
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<IExtendedExam | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);

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

  const handleConfirmStart = useCallback((examId: string, attemptId?: string) => {
    setIsStartModalOpen(false);
    setIsDetailOpen(false);
    if (attemptId) {
      navigate(`/exam/${attemptId}`);
    } else {
      navigate(`/exam-attempt/${examId}`);
    }
  }, [navigate]);

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
