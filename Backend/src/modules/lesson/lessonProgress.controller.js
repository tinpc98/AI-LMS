// File: src/modules/lesson/lessonProgress.controller.js
// Tiến độ học bài giảng của học sinh.
//
// Tách từ learning.controller.js ở Wave 3.2. File cũ trộn hai nhóm nghiệp vụ: tiến độ
// bài giảng (thuộc lesson) và xếp hạng/huy hiệu/nhật ký hoạt động (thuộc badge). Phần
// thân hàm giữ NGUYÊN VĂN, chỉ đổi vị trí file và đường dẫn import.
import mongoose from "mongoose";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import LessonProgress from "./lessonProgress.model.js";
import { LearningActivity } from "#modules/badge";

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
