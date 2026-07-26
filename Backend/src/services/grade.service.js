import mongoose from "mongoose";
import Grade from "../models/grade.model.js";
import classModel from "../models/class.model.js";

class GradeService {
  // Tạo mới hoặc Cập nhật điểm số của học sinh theo cột điểm
  async upsertGrade({ studentId, classId, courseId, category, score, weight, feedback, aiFeedback, gradedBy }) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const classExists = await classModel.findById(classId);
    if (!classExists) {
      throw new Error("Lớp học không tồn tại!");
    }

    const filter = { studentId, classId, category };
    const update = {
      courseId: courseId || classExists.courseId,
      score,
      weight: weight || 1,
      gradedBy,
      gradedAt: new Date(),
      feedback: feedback || "",
      aiFeedback: aiFeedback || "",
    };

    return await Grade.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).populate("studentId", "fullName email avatar");
  }

  // Lấy bảng điểm của cả lớp
  async getGradesByClass(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return [];
    }

    return await Grade.find({ classId })
      .populate("studentId", "fullName email avatar")
      .populate("gradedBy", "fullName email")
      .sort({ studentId: 1, category: 1 })
      .lean();
  }

  // Lấy bảng điểm cá nhân học sinh
  async getGradesByStudent(studentId, classId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return [];
    }

    const query = { studentId };
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.classId = classId;
    }

    return await Grade.find(query)
      .populate("classId", "className classCode")
      .populate("gradedBy", "fullName email")
      .sort({ createdAt: -1 })
      .lean();
  }

  // Tính điểm trung bình môn (GPA) theo tỷ trọng gradingWeight của lớp
  async calculateStudentGPA(studentId, classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("Lớp học không tồn tại!");
    }

    const targetClass = await classModel.findById(classId);
    if (!targetClass) {
      throw new Error("Lớp học không tồn tại!");
    }

    const weights = targetClass.gradingWeight || {
      attendance: 10,
      assignment: 20,
      midterm: 30,
      final: 40,
    };

    const grades = await Grade.find({ studentId, classId });

    let weightedSum = 0;
    let totalWeight = 0;

    const categoryMap = {
      Attendance: weights.attendance,
      Assignment: weights.assignment,
      Midterm: weights.midterm,
      Final: weights.final,
    };

    grades.forEach((g) => {
      const weightPercent = categoryMap[g.category] || g.weight || 0;
      if (weightPercent > 0) {
        weightedSum += g.score * (weightPercent / 100);
        totalWeight += weightPercent;
      }
    });

    const gpa = totalWeight > 0 ? parseFloat(weightedSum.toFixed(2)) : null;

    return {
      studentId,
      classId,
      gpa,
      weights,
      gradesCount: grades.length,
      detail: grades,
    };
  }
}

export default new GradeService();
