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
import { getLifetimeXpService } from "./xp.service.js";
import { Class } from "#modules/class";
import { ClassEnrollment } from "#modules/classEnrollment";

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
    const requesterId = req.user.id || req.user._id;
    const role = (req.user?.role || "").toLowerCase();

    if (studentId === "me") studentId = requesterId;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    // BUG ĐÃ SỬA: trước đây không kiểm quyền gì — bất kỳ ai đăng nhập cũng xem được thứ hạng
    // của học sinh bất kỳ trong lớp bất kỳ. classId ở endpoint này nằm ở query string (không
    // phải :param) nên không áp trực tiếp checkClassAccess được — kiểm thủ công ở đây: Admin
    // toàn quyền; Teacher phải phụ trách đúng lớp; Student chỉ được xem thứ hạng CHÍNH MÌNH và
    // phải đang ACTIVE trong lớp đó.
    if (role === "admin") {
      // toàn quyền
    } else if (role === "teacher") {
      const owns = await Class.exists({ _id: classId, teacherId: requesterId });
      if (!owns) {
        return sendError(res, "Bạn không có quyền truy cập lớp học này", 403);
      }
    } else if (role === "student") {
      if (String(studentId) !== String(requesterId)) {
        return sendError(res, "Bạn chỉ được xem thứ hạng của chính mình", 403);
      }
      const enrolled = await ClassEnrollment.exists({
        classId,
        studentId: requesterId,
        status: "ACTIVE",
      });
      if (!enrolled) {
        return sendError(res, "Bạn không có quyền truy cập lớp học này", 403);
      }
    } else {
      return sendError(res, "Bạn không có quyền truy cập lớp học này", 403);
    }

    const rank = await learningRankingService.getStudentRanking(classId, studentId);
    return sendSuccess(res, "Lấy thứ hạng thành công", rank);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy thứ hạng", 500);
  }
};

// --- XP / LEVEL (mục 5) ---
// TÍNH NĂNG MỚI: Level tính từ TỔNG XP TRỌN ĐỜI (không giới hạn lớp/tuần), khác leaderboard.
export const getMyXp = async (req, res) => {
  try {
    const studentId = req.user.id || req.user._id;
    const result = await getLifetimeXpService(studentId);
    return sendSuccess(res, "Lấy thông tin XP thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy thông tin XP", 500);
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
