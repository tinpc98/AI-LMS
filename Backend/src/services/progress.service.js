import Progress from "../models/progress.model.js";
import Lesson from "../models/lesson.model.js";
import mongoose from "mongoose";

class ProgressService {
  /**
   * Đánh dấu một bài giảng đã hoàn thành cho học sinh
   * 
   * @param {string} studentId 
   * @param {string} classId 
   * @param {string} lessonId 
   * @returns {Promise<Object>}
   */
  async markLessonComplete(studentId, classId, lessonId) {
    // findOneAndUpdate với upsert = true để tự động tạo nếu chưa có
    // Dùng $addToSet để không bị trùng lặp nếu nộp/gọi nhiều lần
    const updatedProgress = await Progress.findOneAndUpdate(
      { studentId, classId, isDeleted: false },
      {
        $addToSet: { completedLessons: lessonId },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return updatedProgress;
  }

  /**
   * Lấy thông tin tiến độ của một học sinh trong một lớp học
   * 
   * @param {string} studentId 
   * @param {string} classId 
   * @returns {Promise<Object>}
   */
  async getStudentProgress(studentId, classId) {
    // Chạy song song 2 query
    const [totalLessons, progressDoc] = await Promise.all([
      // Đếm tổng số bài giảng của lớp (đang active)
      Lesson.countDocuments({ classId, isDeleted: false }),
      
      // Lấy document progress của học sinh
      Progress.findOne({ studentId, classId, isDeleted: false }).lean(),
    ]);

    const completedLessons = progressDoc && progressDoc.completedLessons 
      ? progressDoc.completedLessons.length 
      : 0;
      
    let completionRate = 0;
    if (totalLessons > 0) {
      completionRate = (completedLessons / totalLessons) * 100;
    }

    return {
      completedLessons,
      totalLessons,
      completionRate: Number(completionRate.toFixed(2)), // Làm tròn 2 chữ số thập phân
    };
  }
}

export default new ProgressService();
