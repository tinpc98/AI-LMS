// File: src/modules/class/cohortMechanism.controller.js
// Endpoint HTTP cho EduSpace mechanism design Phần A/B — nối các service đã xây
// (commitment/backupTeacher/escalation/cohortReadiness) với route thật.
//
// RBAC: mọi thao tác ĐỔI trạng thái (transition/excuse/assign/activate/cancel) là Admin —
// đúng "Ghi chú phương pháp" của đặc tả: hệ thống chỉ có 3 role, không có Ops riêng, nên các
// bước "con người can thiệp" mặc định rơi vào Admin ở MVP. Đọc (GET) cho phép cả Teacher xem
// tình trạng cam kết/học liệu của chính lớp mình.
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { ValidationError } from "#shared/utils/appError.js";
import { transitionCommitment, excuseCommitmentEvent } from "./commitment.service.js";
import { checkCohortLearningMaterialsReady } from "./cohortReadiness.service.js";
import { assignBackupTeacher, activateBackupTeacher } from "./backupTeacher.service.js";
import {
  findOverdueSessions,
  escalateLevel1,
  cancelSessionWithMakeup,
} from "./escalation.service.js";

// ── Commitment (Phần A) ──────────────────────────────────────────────────────

export const transitionClassCommitment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { toStatus, reason, note } = req.body;

  if (!toStatus) {
    throw new ValidationError("toStatus là bắt buộc.");
  }

  const classDoc = await transitionCommitment(id, toStatus, {
    reason,
    changedBy: req.user.id || req.user._id,
    note,
  });

  return res.status(200).json({
    success: true,
    message: `Đã chuyển cam kết sang "${toStatus}".`,
    data: classDoc,
  });
});

export const excuseClassCommitmentEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await excuseCommitmentEvent(eventId, req.user.id || req.user._id);

  return res.status(200).json({
    success: true,
    message: "Đã miễn trừ strike bất khả kháng.",
    data: event,
  });
});

export const getCohortReadiness = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await checkCohortLearningMaterialsReady(id);

  return res.status(200).json({ success: true, message: "OK", data: result });
});

// ── Dạy đôi (Phần A.6) ────────────────────────────────────────────────────────

export const assignClassBackupTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { backupTeacherId } = req.body;

  if (!backupTeacherId) {
    throw new ValidationError("backupTeacherId là bắt buộc.");
  }

  const classDoc = await assignBackupTeacher(id, backupTeacherId);

  return res.status(200).json({
    success: true,
    message: "Đã gán giáo viên dự bị.",
    data: classDoc,
  });
});

export const activateClassBackupTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const result = await activateBackupTeacher(id, {
    reason,
    changedBy: req.user.id || req.user._id,
  });

  return res.status(200).json({
    success: true,
    message: "Đã kích hoạt giáo viên dự bị lên vai chính.",
    data: result,
  });
});

// ── Leo thang (Phần B.1) ──────────────────────────────────────────────────────

export const listOverdueSessions = asyncHandler(async (req, res) => {
  const sessions = await findOverdueSessions();
  return res.status(200).json({ success: true, message: "OK", data: sessions });
});

export const escalateSessionLevel1 = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const result = await escalateLevel1(sessionId);

  return res.status(200).json({
    success: true,
    message: result.resolved
      ? "Đã kích hoạt dự bị."
      : "Không thể tự xử lý, cần Admin can thiệp (Mức 2).",
    data: result,
  });
});

export const cancelSessionAndCreateMakeup = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { makeupScheduledStartAt, makeupScheduledEndAt } = req.body;

  const result = await cancelSessionWithMakeup(sessionId, {
    adminId: req.user.id || req.user._id,
    makeupScheduledStartAt,
    makeupScheduledEndAt,
  });

  return res.status(200).json({
    success: true,
    message: "Đã huỷ buổi và tạo buổi bù.",
    data: result,
  });
});
