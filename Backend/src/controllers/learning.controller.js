import mongoose from "mongoose";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import LessonProgress from "../models/lessonProgress.model.js";
import LearningActivity from "../models/learningActivity.model.js";
import learningRankingService from "../services/learningRanking.service.js";
import gamificationService from "../services/gamification.service.js";

// --- PROGRESS ---
export const getStudentProgress = async (req, res) => {
  try {
    const { classId } = req.params;
    const studentId = req.user.id || req.user._id;

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const progress = await LessonProgress.find({ classId, studentId }).lean();
    return sendSuccess(res, "Lấy tiến độ thành công", progress);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy tiến độ", 500);
  }
};

export const updateLessonProgress = async (req, res) => {
  try {
    const { lessonId, classId, progress, durationSeconds } = req.body;
    const studentId = req.user.id || req.user._id;

    if (!lessonId || !classId) {
      return sendError(res, "Thiếu thông tin bài giảng hoặc lớp học", 400);
    }

    const currentProgress = Math.min(100, Math.max(0, parseInt(progress, 10)));
    const isCompleted = currentProgress >= 100;

    let lp = await LessonProgress.findOne({ studentId, lessonId });
    if (!lp) {
      lp = new LessonProgress({
        studentId,
        lessonId,
        classId,
        progress: currentProgress,
        completed: isCompleted,
        completedAt: isCompleted ? new Date() : null,
        totalLearningTime: durationSeconds || 0,
        lastViewedAt: new Date(),
      });
    } else {
      lp.progress = Math.max(lp.progress, currentProgress); // Never decrease progress
      if (!lp.completed && lp.progress >= 100) {
        lp.completed = true;
        lp.completedAt = new Date();

        // Log Activity: Lesson Completed
        await LearningActivity.create({
          studentId,
          classId,
          lessonId,
          activityType: "Lesson Completed",
        });
      }
      lp.totalLearningTime += durationSeconds || 0;
      lp.lastViewedAt = new Date();
    }
    await lp.save();

    // Log Activity: Lesson Viewed
    await LearningActivity.create({
      studentId,
      classId,
      lessonId,
      activityType: "Lesson Viewed",
    });

    return sendSuccess(res, "Cập nhật tiến độ thành công", lp);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi cập nhật tiến độ", 500);
  }
};

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
