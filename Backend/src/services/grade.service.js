import mongoose from "mongoose";
import Grade from "../models/grade.model.js";
import classModel from "../models/class.model.js";
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";
import Exam from "../models/exam.model.js";
import ExamAttempt from "../models/examAttempt.model.js";
import User from "../models/user.models.js";

class GradeService {
  // Tạo mới hoặc Cập nhật điểm số của học sinh theo cột điểm (Manual Grades)
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

  // Helper function: Tính toán ma trận điểm cho một danh sách học sinh
  async aggregateGradesMatrix(classId, targetStudentId = null) {
    const classExists = await classModel.findById(classId).lean();
    if (!classExists) {
      return { gradeItems: [], students: [] };
    }

    // 1. Fetch Students
    let students = classExists.students
      .filter(s => s.status === "Enrolled")
      .map(s => ({ studentId: s.studentId, status: s.status }));
      
    if (targetStudentId) {
      students = students.filter(s => s.studentId.toString() === targetStudentId.toString());
    }
    const studentIds = students.map(s => s.studentId);

    const users = await User.find({ _id: { $in: studentIds } }, "fullName email avatar studentCode").lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // 2. Fetch Source Records
    const assignments = await Assignment.find({ classId, isDeleted: false }, "_id title").lean();
    const exams = await Exam.find({ classId, isDeleted: false }, "_id title maxScore status").lean();
    const manualGrades = await Grade.find({ classId }).lean();
    
    // Nếu có targetStudentId, giới hạn Submissions và ExamAttempts
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignmentId: { $in: assignmentIds },
      studentId: { $in: studentIds },
      isDeleted: false,
      grade: { $ne: null }
    }).lean();

    const examIds = exams.map(e => e._id);
    const attempts = await ExamAttempt.find({
      examId: { $in: examIds },
      studentId: { $in: studentIds },
      status: "GRADED",
      isDeleted: false
    }).lean();

    // 3. Build Grade Items (Columns)
    const gradeItems = [];
    
    // Find unique manual categories actually used in this class
    const defaultManualCats = ["Attendance", "Midterm", "Final"];
    const dbManualCats = manualGrades.map(g => g.category);
    const manualCategories = [...new Set([...defaultManualCats, ...dbManualCats])];
    
    manualCategories.forEach(cat => {
      gradeItems.push({
        _id: `manual-${cat}`,
        title: cat,
        category: cat,
        maxScore: 10,
        weight: classExists.gradingWeight?.[cat.toLowerCase()] || 10,
        type: "Manual"
      });
    });

    assignments.forEach(a => {
      gradeItems.push({
        _id: `assign-${a._id}`,
        title: a.title,
        category: "Assignment",
        maxScore: 10,
        weight: classExists.gradingWeight?.assignment || 20,
        type: "Assignment",
        sourceId: a._id.toString()
      });
    });

    exams.forEach(e => {
      gradeItems.push({
        _id: `exam-${e._id}`,
        title: e.title,
        category: "Exam",
        maxScore: e.maxScore || 10,
        weight: classExists.gradingWeight?.midterm || 30, // Default to midterm weight
        type: "Exam",
        sourceId: e._id.toString()
      });
    });

    // 4. Build Matrix per Student
    const studentGradesList = students.map(s => {
      const uId = s.studentId.toString();
      const user = userMap.get(uId) || {};

      const gradesMap = {};
      const catScores = {
        Attendance: { sum: 0, count: 0 },
        Assignment: { sum: 0, count: 0 },
        Midterm: { sum: 0, count: 0 },
        Final: { sum: 0, count: 0 },
        Exam: { sum: 0, count: 0 }, // fallback for exams without specific category
        Other: { sum: 0, count: 0 }
      };

      manualGrades.filter(g => g.studentId.toString() === uId).forEach(g => {
        const itemId = `manual-${g.category}`;
        gradesMap[itemId] = { score: g.score, feedback: g.feedback, rawId: g._id };
        if (catScores[g.category]) {
          catScores[g.category].sum += g.score;
          catScores[g.category].count++;
        }
      });

      submissions.filter(sub => sub.studentId.toString() === uId).forEach(sub => {
        const itemId = `assign-${sub.assignmentId}`;
        gradesMap[itemId] = { score: sub.grade, feedback: sub.feedback, rawId: sub._id };
        catScores.Assignment.sum += sub.grade;
        catScores.Assignment.count++;
      });

      attempts.filter(att => att.studentId.toString() === uId).forEach(att => {
        const itemId = `exam-${att.examId}`;
        // Normalize exam score to 10 scale for GPA calculation if maxScore is different
        const max = exams.find(e => e._id.toString() === att.examId.toString())?.maxScore || 10;
        const normalizedScore = (att.totalScore / max) * 10;
        
        gradesMap[itemId] = { score: att.totalScore, feedback: "", rawId: att._id };
        catScores.Exam.sum += normalizedScore;
        catScores.Exam.count++;
      });

      // Compute Weighted GPA
      let weightedSum = 0;
      let totalWeight = 0;
      const weights = classExists.gradingWeight || {
        attendance: 10,
        assignment: 20,
        midterm: 30,
        final: 40,
      };

      if (catScores.Attendance.count > 0) {
        weightedSum += (catScores.Attendance.sum / catScores.Attendance.count) * (weights.attendance / 100);
        totalWeight += weights.attendance;
      }
      
      if (catScores.Assignment.count > 0) {
        weightedSum += (catScores.Assignment.sum / catScores.Assignment.count) * (weights.assignment / 100);
        totalWeight += weights.assignment;
      }

      // If we have manual Midterm/Final grades
      if (catScores.Midterm.count > 0) {
        weightedSum += (catScores.Midterm.sum / catScores.Midterm.count) * (weights.midterm / 100);
        totalWeight += weights.midterm;
      }
      if (catScores.Final.count > 0) {
        weightedSum += (catScores.Final.sum / catScores.Final.count) * (weights.final / 100);
        totalWeight += weights.final;
      }

      // If Exams exist but no manual Midterm/Final, we use the Exam average for both Midterm and Final weights
      if (catScores.Exam.count > 0 && catScores.Midterm.count === 0 && catScores.Final.count === 0) {
        const examAvg = catScores.Exam.sum / catScores.Exam.count;
        weightedSum += examAvg * ((weights.midterm + weights.final) / 100);
        totalWeight += (weights.midterm + weights.final);
      }

      const avgGPA = totalWeight > 0 ? parseFloat(weightedSum.toFixed(2)) : null;

      return {
        student: user,
        grades: gradesMap,
        avgGPA,
        totalWeight
      };
    });

    return {
      gradeItems,
      students: studentGradesList,
      weights: classExists.gradingWeight
    };
  }

  // Lấy bảng điểm của cả lớp
  async getGradesByClass(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return { gradeItems: [], students: [] };
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
      
    return { gradeItems: [], students: [{ student: { _id: studentId }, grades: {}, legacyGrades: grades }] };
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
