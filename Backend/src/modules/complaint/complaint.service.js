// File: src/modules/complaint/complaint.service.js
// Xử lý khiếu nại & tranh chấp — EduSpace mechanism design Phần C.6, BR-30/31.
import Complaint, { COMPLAINT_CATEGORIES } from "./complaint.model.js";
import { NotFoundError, ValidationError, BusinessRuleError } from "#shared/utils/appError.js";

// [GIẢ ĐỊNH] BR-30 — SLA phản hồi đầu tiên (giờ), khác nhau theo mức độ khẩn cấp.
const SLA_HOURS_DEFAULT = 24;
const SLA_HOURS_CHILD_SAFETY = 4;

export function getSlaHoursForCategory(category) {
  return category === "CHILD_SAFETY" ? SLA_HOURS_CHILD_SAFETY : SLA_HOURS_DEFAULT;
}

export async function submitComplaint({
  classId,
  sessionId,
  reportedBy,
  aboutTeacherId,
  category,
  description,
}) {
  if (!category || !COMPLAINT_CATEGORIES.includes(category)) {
    throw new ValidationError(
      `category không hợp lệ: phải thuộc ${COMPLAINT_CATEGORIES.join(", ")}`
    );
  }
  if (!description || !description.trim()) {
    throw new ValidationError("description là bắt buộc.");
  }

  return Complaint.create({
    classId: classId || null,
    sessionId: sessionId || null,
    reportedBy,
    aboutTeacherId: aboutTeacherId || null,
    category,
    description: description.trim(),
  });
}

/**
 * BR-30: Admin phản hồi lần đầu — chỉ ghi `firstRespondedAt` nếu CHƯA từng phản hồi (idempotent,
 * gọi nhiều lần không ghi đè mốc SLA thật).
 */
export async function respondToComplaint(complaintId) {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new NotFoundError("Không tìm thấy khiếu nại.");
  }

  if (!complaint.firstRespondedAt) {
    complaint.firstRespondedAt = new Date();
  }
  if (complaint.status === "SUBMITTED") {
    complaint.status = "UNDER_REVIEW";
  }
  await complaint.save();
  return complaint;
}

export async function resolveComplaint(complaintId, { resolvedBy, resolution }) {
  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    throw new NotFoundError("Không tìm thấy khiếu nại.");
  }
  if (complaint.status === "RESOLVED") {
    throw new BusinessRuleError("Khiếu nại này đã được xử lý xong từ trước.");
  }
  if (!resolution || !resolution.trim()) {
    throw new ValidationError("resolution (kết luận xử lý) là bắt buộc.");
  }

  if (!complaint.firstRespondedAt) {
    complaint.firstRespondedAt = new Date();
  }
  complaint.status = "RESOLVED";
  complaint.resolvedAt = new Date();
  complaint.resolvedBy = resolvedBy;
  complaint.resolution = resolution.trim();
  await complaint.save();
  return complaint;
}

/**
 * BR-30: danh sách khiếu nại CHƯA phản hồi, đã vi phạm SLA — dùng để cảnh báo Admin (qua job
 * định kỳ hoặc dashboard), ưu tiên CHILD_SAFETY lên đầu.
 */
export async function findOverdueComplaints(now = new Date()) {
  const pending = await Complaint.find({ firstRespondedAt: null }).lean();

  const overdue = pending.filter((c) => {
    const slaHours = getSlaHoursForCategory(c.category);
    const deadline = new Date(c.createdAt.getTime() + slaHours * 60 * 60 * 1000);
    return now > deadline;
  });

  return overdue.sort((a, b) =>
    a.category === "CHILD_SAFETY" ? -1 : b.category === "CHILD_SAFETY" ? 1 : 0
  );
}
