import mongoose from "mongoose";
import Grade from "../models/grade.model.js";
import { Class as classModel } from "#modules/class";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import Exam from "../models/exam.model.js";
import ExamAttempt from "../models/examAttempt.model.js";
import { User } from "#modules/auth";
import { checkClassTeacherOwnership } from "#modules/class";
import { calculateGradeMatrix } from "./gradeCalculator.js";

class GradeService {
  // Tạo mới hoặc Cập nhật điểm số của học sinh theo cột điểm (Manual Grades)
  async upsertGrade({
    studentId,
    classId,
    courseId,
    category,
    score,
    weight,
    feedback,
    aiFeedback,
    gradedBy,
    gradedByRole,
  }) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const classExists = await classModel.findById(classId);
    if (!classExists) {
      throw new Error("Lớp học không tồn tại!");
    }

    const isAuthorized = await checkClassTeacherOwnership(classId, gradedBy, gradedByRole);
    if (!isAuthorized) {
      const error = new Error("Bạn không có quyền nhập điểm cho lớp học này!");
      error.status = 403;
      throw error;
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

  // Helper function: Tính toán ma trận điểm cho một danh sách học sinh
  async aggregateGradesMatrix(classId, targetStudentId = null) {
    const classExists = await classModel.findById(classId).lean();
    if (!classExists) {
      return { gradeItems: [], students: [] };
    }

    // 1. Fetch Students
    let students = classExists.students
      .filter((s) => s.status === "Enrolled")
      .map((s) => ({ studentId: s.studentId, status: s.status }));

    if (targetStudentId) {
      students = students.filter((s) => s.studentId.toString() === targetStudentId.toString());
    }
    const studentIds = students.map((s) => s.studentId);

    const users = await User.find(
      { _id: { $in: studentIds } },
      "fullName email avatar studentCode"
    ).lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // 2. Fetch Source Records
    const assignments = await Assignment.find({ classId, isDeleted: false }, "_id title").lean();
    const exams = await Exam.find(
      { classId, isDeleted: false },
      "_id title maxScore status"
    ).lean();
    const manualGrades = await Grade.find({ classId }).lean();

    // Nếu có targetStudentId, giới hạn Submissions và ExamAttempts
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds },
      studentId: { $in: studentIds },
      isDeleted: false,
      grade: { $ne: null },
    }).lean();

    const examIds = exams.map((e) => e._id);
    const attempts = await ExamAttempt.find({
      examId: { $in: examIds },
      studentId: { $in: studentIds },
      status: "GRADED",
      isDeleted: false,
    }).lean();

    // 3+4. Tính gradeItems + ma trận điểm từng học sinh (pure calculation, tách sang gradeCalculator.js)
    return calculateGradeMatrix({
      students,
      userMap,
      gradingWeight: classExists.gradingWeight,
      manualGrades,
      assignments,
      exams,
      submissions,
      attempts,
    });
  }

  // Lấy bảng điểm của cả lớp
  async getGradesByClass(classId, userId, userRole) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return { gradeItems: [], students: [] };
    }

    const isAuthorized = await checkClassTeacherOwnership(classId, userId, userRole);
    if (!isAuthorized) {
      const error = new Error("Bạn không có quyền xem bảng điểm của lớp học này!");
      error.status = 403;
      throw error;
    }

    return await this.aggregateGradesMatrix(classId);
  }

  // Lấy bảng điểm cá nhân học sinh
  async getGradesByStudent(studentId, classId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return { gradeItems: [], students: [] };
    }

    // Nếu truyền classId thì chỉ tính cho 1 lớp
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      return await this.aggregateGradesMatrix(classId, studentId);
    }

    // Nếu không truyền classId, fallback về query cũ
    const grades = await Grade.find({ studentId })
      .populate("classId", "className classCode")
      .populate("gradedBy", "fullName email")
      .sort({ createdAt: -1 })
      .lean();

    return {
      gradeItems: [],
      students: [{ student: { _id: studentId }, grades: {}, legacyGrades: grades }],
    };
  }

  // Tính điểm trung bình môn (GPA) theo tỷ trọng gradingWeight của lớp
  async calculateStudentGPA(studentId, classId) {
    const data = await this.aggregateGradesMatrix(classId, studentId);
    if (!data || data.students.length === 0) {
      return { gpa: null };
    }
    const studentData = data.students[0];
    return {
      studentId,
      classId,
      gpa: studentData.avgGPA,
      weights: data.weights,
      gradesCount: Object.keys(studentData.grades).length,
      detail: studentData.grades,
    };
  }
}

export default new GradeService();
