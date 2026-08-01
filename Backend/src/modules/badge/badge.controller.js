// File: src/modules/badge/badge.controller.js
// Xếp hạng học tập, huy hiệu và nhật ký hoạt động.
//
// Đổi tên từ learning.controller.js ở Wave 3.2. Hai handler tiến độ bài giảng
// (getStudentProgress, updateLessonProgress) đã tách sang
// modules/lesson/lessonProgress.controller.js vì chúng thuộc nghiệp vụ lesson.
// Phần thân hàm giữ NGUYÊN VĂN, chỉ đổi vị trí file và đường dẫn import.
import mongoose from "mongoose";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import LearningActivity from "./learningActivity.model.js";
import learningRankingService from "./learningRanking.service.js";
import gamificationService from "./gamification.service.js";

// --- RANKING ---
export const getClassRanking = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const ranking = await learningRankingService.getClassRanking(classId, req.query);
    return sendSuccess(res, "Lấy bảng xếp hạng thành công", ranking);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy bảng xếp hạng", 500);
  }
};

export const getStudentRanking = async (req, res) => {
  try {
    let { studentId } = req.params;
    const { classId } = req.query;

    if (studentId === "me") studentId = req.user.id || req.user._id;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const rank = await learningRankingService.getStudentRanking(classId, studentId);
    return sendSuccess(res, "Lấy thứ hạng thành công", rank);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy thứ hạng", 500);
  }
};

// --- BADGES ---
export const getMyBadges = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const badges = await gamificationService.getStudentBadges(studentId);
    return sendSuccess(res, "Lấy huy hiệu thành công", badges);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy huy hiệu", 500);
  }
};

// --- ACTIVITIES ---
export const getMyActivities = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const { classId } = req.query;

    const filter = { studentId };
    if (classId) filter.classId = classId;

    const activities = await LearningActivity.find(filter).sort({ createdAt: -1 }).limit(50).lean();

    return sendSuccess(res, "Lấy nhật ký hoạt động thành công", activities);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy nhật ký hoạt động", 500);
  }
};
