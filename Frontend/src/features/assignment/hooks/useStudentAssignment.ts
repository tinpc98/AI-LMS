import { useState, useEffect, useCallback } from "react";
import assignmentApi from "../../../api/assignmentApi";
import type { IAssignment, ISubmission } from "../../../interface/assignmentInterface";
import { toast } from "../../../utils/toast";

export function useStudentAssignment(assignmentId: string | undefined) {
  const [assignment, setAssignment] = useState<IAssignment | null>(null);
  const [mySubmission, setMySubmission] = useState<ISubmission | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAssignmentDetail = useCallback(async () => {
    if (!assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const [assignmentData, submissionData] = await Promise.all([
        assignmentApi.getAssignmentById(assignmentId),
        assignmentApi.getMySubmission(assignmentId).catch(() => null),
      ]);
      setAssignment(assignmentData);
      setMySubmission(submissionData);
    } catch (err: any) {
      console.error("[useStudentAssignment] Fetch error:", err);
      setError(err.response?.data?.message || "Không thể tải thông tin bài tập!");
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentDetail();
    } else {
      setLoading(false);
    }
  }, [assignmentId, fetchAssignmentDetail]);

  const submitAssignment = async (formData: FormData) => {
    if (!assignmentId) {
      toast.error("Không tìm thấy thông tin bài tập.");
      return;
    }
    try {
      setIsSubmitting(true);
      await assignmentApi.submitAssignment(assignmentId, formData);
      toast.success(mySubmission ? "Nộp lại bài tập thành công!" : "Nộp bài tập thành công!");
      await fetchAssignmentDetail();
      return true;
    } catch (err: any) {
      console.error("Lỗi khi nộp bài:", err);
      toast.error(err.response?.data?.message || "Nộp bài thất bại. Vui lòng thử lại sau.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelSubmission = async () => {
    if (!assignmentId) return false;
    try {
      setIsSubmitting(true);
      await assignmentApi.cancelSubmission(assignmentId);
      toast.success("Đã hủy bài nộp thành công!");
      await fetchAssignmentDetail();
      return true;
    } catch (err: any) {
      console.error("Lỗi khi hủy bài nộp:", err);
      toast.error(err.response?.data?.message || "Hủy bài nộp thất bại. Vui lòng thử lại!");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    assignment,
    mySubmission,
    loading,
    error,
    isSubmitting,
    fetchAssignmentDetail,
    submitAssignment,
    cancelSubmission,
  };
}
