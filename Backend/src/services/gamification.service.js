import mongoose from "mongoose";
import StudentBadge from "../models/studentBadge.model.js";

class GamificationService {
  async awardBadge(studentId, badgeCode, badgeType, title, description, icon) {
    if (!studentId || !badgeCode) return null;

    try {
      const existingBadge = await StudentBadge.findOne({ studentId, badgeCode });
      if (existingBadge) return existingBadge; // Đã có huy hiệu này rồi

      const newBadge = await StudentBadge.create({
        studentId,
        badgeCode,
        badgeType,
        title,
        description,
        icon
      });

      return newBadge;
    } catch (err) {
      if (err.code === 11000) {
        // Race condition duplicate
        return null;
      }
      throw err;
    }
  }

  async getStudentBadges(studentId) {
    return await StudentBadge.find({ studentId }).sort({ awardedAt: -1 }).lean();
  }
}

export default new GamificationService();
