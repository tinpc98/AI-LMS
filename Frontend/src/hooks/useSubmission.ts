import { useState, useCallback } from "react";
import assignmentApi from "../api/assignmentApi";
import { toast } from "../utils/toast";
import type { IExtendedAssignment } from "../types/studentAssignment";

export function useSubmission(onSubmissionUpdated?: () => void) {
  // Submission modal state
  const [submittingAssignment, setSubmittingAssignment] = useState<IExtendedAssignment | null>(
    null
  );
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Feedback modal state
  const [feedbackAssignment, setFeedbackAssignment] = useState<IExtendedAssignment | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const openSubmitModal = useCallback((item: IExtendedAssignment) => {
    setSubmittingAssignment(item);
    setIsSubmitModalOpen(true);
  }, []);

  const closeSubmitModal = useCallback(() => {
    setIsSubmitModalOpen(false);
    setSubmittingAssignment(null);
  }, []);

  const openFeedbackModal = useCallback((item: IExtendedAssignment) => {
    setFeedbackAssignment(item);
    setIsFeedbackOpen(true);
  }, []);

  const closeFeedbackModal = useCallback(() => {
    setIsFeedbackOpen(false);
    setFeedbackAssignment(null);
  }, []);

  const handleCancelSubmission = useCallback(
    async (assignmentId: string) => {
      try {
        await assignmentApi.cancelSubmission(assignmentId);
        toast.success("Hủy nộp bài tập thành công!", "Hủy nộp bài");
        if (onSubmissionUpdated) onSubmissionUpdated();
      } catch (error: any) {
        console.error("Lỗi khi hủy nộp bài:", error);
        const msg = error.response?.data?.message || "Không thể hủy nộp bài. Vui lòng thử lại.";
        toast.error(msg, "Lỗi hủy nộp bài");
      }
    },
    [onSubmissionUpdated]
  );

  return {
    submittingAssignment,
    isSubmitModalOpen,
    openSubmitModal,
    closeSubmitModal,
    feedbackAssignment,
    isFeedbackOpen,
    openFeedbackModal,
    closeFeedbackModal,
    handleCancelSubmission,
  };
}

export default useSubmission;
