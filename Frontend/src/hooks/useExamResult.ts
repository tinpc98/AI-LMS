import { useState, useCallback } from "react";
import examApi from "../api/examApi";
import { toast } from "../utils/toast";
import type { IExtendedExam } from "../types/studentExam";

export function useExamResult() {
  const [selectedExam, setSelectedExam] = useState<IExtendedExam | null>(null);
  const [reviewData, setReviewData] = useState<any | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);

  const openReview = useCallback(async (item: IExtendedExam) => {
    setSelectedExam(item);
    setIsReviewOpen(true);

    if (item.attempt?._id) {
      try {
        setLoadingReview(true);
        const data = await examApi.getAttemptForReview(item.attempt._id);
        setReviewData(data);
      } catch (error) {
        console.error("Lỗi khi tải kết quả thi:", error);
        toast.error("Không thể tải chi tiết kết quả bài thi.", "Lỗi tải bài làm");
      } finally {
        setLoadingReview(false);
      }
    }
  }, []);

  const closeReview = useCallback(() => {
    setIsReviewOpen(false);
    setSelectedExam(null);
    setReviewData(null);
  }, []);

  return {
    selectedExam,
    reviewData,
    isReviewOpen,
    loadingReview,
    openReview,
    closeReview,
  };
}

export default useExamResult;
