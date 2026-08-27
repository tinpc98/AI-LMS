import mongoose from "mongoose";
import LearningActivity from "./learningActivity.model.js";
import { clampToDailyCap, computeLevelFromXp } from "./xp.js";
// Import trực tiếp model (không qua barrel class/classEnrollment) — chỉ cần đọc dữ liệu, tránh
// kéo theo service nặng của 2 module đó (cùng nguyên tắc "tránh over-eager barrel export").
import Class from "../class/class.model.js";
import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";

const startOfUtcDay = (date = new Date()) => {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Cộng XP cho 1 sự kiện đã xác minh — ĐÚNG MỘT LẦN cho mỗi `sourceRef` (thực thi bằng unique
 * index {studentId, sourceRef} ở tầng DB, KHÔNG phải bằng find-rồi-create ở tầng app — tránh race
 * condition khi 2 request đồng thời cùng trigger 1 sự kiện, ví dụ 2 tab cùng nộp quiz).
 *
 * Trần XP/ngày (DAILY_XP_CAP) được áp bằng cách đọc tổng đã cộng hôm nay rồi cắt bớt — đây là
 * kiểm tra "tốt nhất có thể" (best-effort), có thể bị vượt nhẹ nếu 2 sự kiện xảy ra đồng thời
 * sát trần; chấp nhận được vì đây là hàng rào chống-cày-điểm mềm, không phải sổ cái tài chính.
 *
 * LUÔN tạo document kể cả khi xpAwarded bị cắt về 0 — để sourceRef giữ tác dụng chống-cộng-trùng
 * cho các lần gọi lại (ví dụ nếu caller vô tình gọi lại do lỗi mạng).
 */
export const awardXpService = async ({
  studentId,
  classId,
  lessonId = null,
  activityType,
  sourceRef,
  xpAmount,
  metadata = {},
}) => {
  const todayTotalAgg = await LearningActivity.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId),
        createdAt: { $gte: startOfUtcDay() },
      },
    },
    { $group: { _id: null, total: { $sum: "$xpAwarded" } } },
  ]);
  const todayTotal = todayTotalAgg[0]?.total || 0;
  const xpToAward = clampToDailyCap(xpAmount, todayTotal);

  try {
    return await LearningActivity.create({
      studentId,
      classId,
      lessonId,
      activityType,
      sourceRef,
      xpAwarded: xpToAward,
      metadata,
    });
  } catch (err) {
    if (err.code === 11000) return null; // sourceRef trùng — sự kiện này đã được cộng rồi.
    throw err;
  }
};

/**
 * Lớp học ACTIVE của học sinh trong 1 Course — cần để gắn classId vào sự kiện XP khi nguồn sự
 * kiện (Lesson, Assignment...) chỉ có courseId chứ không có classId trực tiếp (khác Exam/
 * Attendance, vốn đã có classId sẵn trên chính bản ghi). 1 Course có thể có nhiều Class, nhưng
 * thực tế 1 học sinh chỉ học 1 Class của cùng 1 Course tại một thời điểm — lấy Class đầu tiên
 * khớp ClassEnrollment ACTIVE là đủ.
 *
 * Dùng chung cho lessonProgress.service.js và assignment.service.js — tách vào đây (thay vì định
 * nghĩa riêng ở từng module) vì bản chất của hàm là "resolve classId để cộng XP", không phải
 * nghiệp vụ riêng của Lesson hay Assignment.
 */
export const resolveActiveClassIdForStudent = async (courseId, studentId) => {
  const classes = await Class.find({ courseId, isDeleted: { $ne: true } })
    .select("_id")
    .lean();
  const classIds = classes.map((c) => c._id);
  if (classIds.length === 0) return null;

  const enrollment = await ClassEnrollment.findOne({
    studentId,
    classId: { $in: classIds },
    status: "ACTIVE",
  })
    .select("classId")
    .lean();

  return enrollment?.classId || null;
};

/** Tổng XP trọn đời của học sinh — dùng để tính Level (KHÔNG giới hạn theo lớp/tuần). */
export const getLifetimeXpService = async (studentId) => {
  const agg = await LearningActivity.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    { $group: { _id: null, total: { $sum: "$xpAwarded" } } },
  ]);
  const totalXp = agg[0]?.total || 0;
  return { totalXp, ...computeLevelFromXp(totalXp) };
};
