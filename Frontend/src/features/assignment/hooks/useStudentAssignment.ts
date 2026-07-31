// Chi tiết một bài tập + bài nộp của chính học sinh.
//
// CHUYỂN SANG REACT QUERY (Wave 5, nhóm A). Gọi hai API song song; getMySubmission trả 404
// khi chưa nộp, đó là câu trả lời hợp lệ chứ không phải lỗi nên vẫn nuốt riêng nhánh đó.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import assignmentApi from "../../../api/assignmentApi";
import { toast } from "../../../utils/toast";

const FALLBACK_ERROR = "Không thể tải thông tin bài tập!";

export function useStudentAssignment(assignmentId: string | undefined) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    data,
    isLoading,
    error,
    refetch: fetchAssignmentDetail,
  } = useQuery({
    queryKey: ["assignment-detail", assignmentId],
    queryFn: async () => {
      const [assignment, mySubmission] = await Promise.all([
        assignmentApi.getAssignmentById(assignmentId!),
        assignmentApi.getMySubmission(assignmentId!).catch(() => null),
      ]);
      return { assignment, mySubmission };
    },
    // Bản cũ dùng `if (!assignmentId) return` giữa chừng effect nên phải thêm nhánh else chỉ
    // để tắt cờ loading. enabled diễn đạt thẳng ý đó.
    enabled: !!assignmentId,
  });

  const assignment = data?.assignment ?? null;
  const mySubmission = data?.mySubmission ?? null;
  const serverMessage = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;

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
    loading: isLoading,
    error: error ? serverMessage || FALLBACK_ERROR : null,
    isSubmitting,
    fetchAssignmentDetail,
    submitAssignment,
    cancelSubmission,
  };
}
