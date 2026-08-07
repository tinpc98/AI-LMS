// Lưu tạm bài làm trong lúc học sinh đang thi.
//
// Đặt riêng thay vì nhét vào examAttempt.controller.js vì hai lý do: nó gắn liền với
// draftAnswers.service.js (cùng một mối quan tâm), và controller kia đã chạm trần kích thước —
// rào chắn check:filesize chặn đúng lúc tôi định thêm vào đó.
import mongoose from "mongoose";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { saveDraftAnswers } from "./draftAnswers.service.js";

/**
 * PATCH /api/exam-attempts/:id/answers
 *
 * Điều kiện tiên quyết của cron tự động đóng phiên quá hạn: máy chủ phải BIẾT học sinh đã trả
 * lời gì. Trước đây bài làm chỉ nằm ở localStorage cho tới lúc bấm nộp, nên đóng phiên tự động
 * sẽ chấm rỗng và học sinh mất trắng.
 */
export const saveDraft = asyncHandler(async (req, res) => {
  const attemptId = req.params.id;
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
