// Lưu tạm bài làm trong lúc học sinh đang thi.
//
// PATCH /api/exam-attempts/:id/answers
//
// Endpoint này là điều kiện tiên quyết của cron tự động đóng phiên quá hạn:
// máy chủ phải biết học sinh đã trả lời gì. Frontend gọi mỗi 1.5s (debounced).
import mongoose from "mongoose";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { saveDraftAnswers } from "./draftAnswers.service.js";

/**
 * PATCH /api/exam-attempts/:id/answers
 */
export const saveDraft = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const studentId = req.user?.id || req.user?._id;

  if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
    return res.status(400).json({ success: false, message: "ID bài thi không hợp lệ!" });
  }

  const clientVersion = req.body?.answersVersion;
  const sessionToken = req.headers["x-session-token"];

  const result = await saveDraftAnswers(attemptId, studentId, req.body?.answers, clientVersion, sessionToken);

  return res.status(200).json({
    success: true,
    message: "Đã lưu bài làm",
    data: { savedCount: result.saved, deadline: result.deadline, newVersion: result.answersVersion },
  });
});
