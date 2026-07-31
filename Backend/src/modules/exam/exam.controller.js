import mongoose from "mongoose";
import examService from "./exam.service.js";
import { aiExamGenerationService } from "#modules/ai";
import Exam from "./exam.model.js";
import { Class as classModel } from "#modules/class";

// S4-FIX-01 (mở rộng): che đáp án đúng trong snapshotData khi trả về cho học sinh.
// snapshotData lưu trực tiếp toàn bộ nội dung câu hỏi (bao gồm đáp án) ngay trong
// document Exam đối với đề AI-generated/từ ExamSet — không populate cũng lộ đáp án
// nếu không redact ở đây.
const redactExamAnswersForStudent = (exam) => {
  if (!exam.questions || exam.questions.length === 0) return exam;
  return {
    ...exam,
    questions: exam.questions.map((q) => {
      if (!q.isSnapshot || !q.snapshotData) return q;
      const safeData = { ...q.snapshotData };
      delete safeData.correctAnswer;
      delete safeData.acceptedAnswers;
      delete safeData.suggestedAnswer;
      delete safeData.rubric;
      delete safeData.explanation;
      delete safeData.feedbackCorrect;
      delete safeData.feedbackIncorrect;
      if (Array.isArray(safeData.options)) {
        safeData.options = safeData.options.map((opt) => {
          if (typeof opt === "string") return opt;
          const safeOpt = { ...opt };
          delete safeOpt.isCorrect;
          return safeOpt;
        });
      }
      return { ...q, snapshotData: safeData };
    }),
  };
};

// 1. Tạo đề thi tự động bằng AI / Ma trận câu hỏi
export const autoGenerateExam = async (req, res) => {
  try {
    const {
      title,
      duration,
      topic,
      mcqCount,
      mcqPoints,
      essayCount,
      essayPoints,
      startTime,
      classId,
      aiPromptUsed,
    } = req.body;

    if (!topic || (!mcqCount && !essayCount)) {
      return res.status(400).json({ message: "Thiếu thông số sinh đề thi!" });
    }

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
    }

    const newExam = await examService.generateExamWithMatrix({
      title,
      duration,
      topic,
      mcqCount,
      mcqPoints,
      essayCount,
      essayPoints,
      startTime,
      classId,
    });

    if (newExam) {
      newExam.createdBy = req.user.id || req.user._id;
      newExam.isAIGenerated = true;
      newExam.aiPromptUsed = aiPromptUsed || `Sinh đề thi tự động chủ đề ${topic}`;
      await newExam.save();
    }

    return res.status(201).json({
      message: "Tạo đề thi tự động thành công!",
      data: newExam,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Lỗi hệ thống khi sinh đề thi." });
  }
};

// 2. Tạo đề thi thủ công
export const createExam = async (req, res) => {
  try {
    const { title, duration, questions, startTime, classId, maxScore, status } = req.body;

    if (!title || !duration || !startTime || !classId || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc để tạo đề thi" });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
    }

    // Chuẩn hóa phân bổ điểm câu hỏi đảm bảo tổng = 10
    let formattedQuestions = questions.map((q) => {
      if (typeof q === "string" || q instanceof mongoose.Types.ObjectId) {
        return { questionId: q, points: 0 };
      }
      return {
        questionId: q.questionId || q._id,
        points: Number(q.points) || 0,
      };
    });

    const totalPoints = formattedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

    // Nếu tổng điểm khác 10 hoặc chưa được gán điểm, tự động phân bổ đều điểm 10 cho các câu
    if (parseFloat(totalPoints.toFixed(2)) !== 10 && formattedQuestions.length > 0) {
      const count = formattedQuestions.length;
      const basePoint = Math.floor((10 / count) * 100) / 100;
      const remainder = 10 - basePoint * (count - 1);

      formattedQuestions = formattedQuestions.map((q, idx) => ({
        ...q,
        points: idx === count - 1 ? Number(remainder.toFixed(2)) : basePoint,
      }));
    }

    const newExam = new Exam({
      title,
      duration: Number(duration),
      questions: formattedQuestions,
      startTime: new Date(startTime),
      classId,
      createdBy: req.user.id || req.user._id,
      maxScore: maxScore || 10,
      status: status || "PUBLISHED",
      isAIGenerated: false,
    });

    await newExam.save();
    return res.status(201).json({ message: "Tạo đề thi thành công!", data: newExam });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Lỗi khi tạo đề thi" });
  }
};

// 3. Cập nhật đề thi
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đề thi không hợp lệ!" });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: "Đề thi không tồn tại!" });
    }

    const userId = (req.user.id || req.user._id).toString();
    const userRole = (req.user.role || "").toLowerCase();

    if (userRole !== "admin" && exam.createdBy?.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa đề thi này!" });
    }

    Object.assign(exam, req.body);
    await exam.save();

    return res.status(200).json({ message: "Cập nhật đề thi thành công!", data: exam });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Lỗi khi cập nhật đề thi" });
  }
};

// 4. Xóa đề thi
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đề thi không hợp lệ!" });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: "Đề thi không tồn tại!" });
    }

    const userId = (req.user._id || req.user.id || "").toString();
    const userRole = (req.user.role || "").toLowerCase();

    // Lấy thông tin lớp học để kiểm tra xem Giáo viên hiện tại có phải giảng viên phụ trách lớp không
    const targetClass = await classModel.findById(exam.classId);
    const classTeacherId = (targetClass?.teacherId?._id || targetClass?.teacherId || "").toString();

    const isCreator = exam.createdBy && exam.createdBy.toString() === userId;
    const isClassTeacher = classTeacherId && classTeacherId === userId;

    if (userRole !== "admin" && !isCreator && !isClassTeacher) {
      return res.status(403).json({ message: "Bạn không có quyền xóa đề thi này!" });
    }

    await Exam.softDelete(id, userId);
    return res.status(200).json({ message: "Xóa đề thi thành công!" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Lỗi hệ thống khi xóa đề thi." });
  }
};

// 5. Lấy danh sách đề thi theo Lớp
export const getExamsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const userId = (req.user._id || req.user.id || "").toString();
    const userRole = (req.user.role || "").toLowerCase();
    const targetClass = await classModel.findById(classId).lean();
    if (!targetClass) {
      return res.status(200).json({ success: true, data: [] });
    }

    // RBAC: học sinh chỉ xem lớp mình học, giáo viên chỉ xem lớp mình phụ trách (admin xem tất cả)
    if (userRole === "student") {
      const isStudentInClass = targetClass.students?.some(
        (s) => s.studentId?.toString() === userId
      );
      if (!isStudentInClass) {
        return res.status(200).json({ success: true, data: [] });
      }
    } else if (userRole === "teacher") {
      const classTeacherId = (targetClass.teacherId?._id || targetClass.teacherId || "").toString();
      if (classTeacherId !== userId) {
        return res.status(200).json({ success: true, data: [] });
      }
    }

    let query = Exam.find({ classId });
    if (userRole === "student") {
      query = query.where("status").in(["PUBLISHED", "COMPLETED"]);
    }
    const exams = await query.sort({ createdAt: -1 }).lean();

    const data = userRole === "student" ? exams.map(redactExamAnswersForStudent) : exams;

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Lỗi hệ thống khi lấy danh sách đề thi." });
  }
};

// 6. Lấy tất cả đề thi (đã lọc theo phạm vi truy cập của user)
export const getAllExams = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id || "").toString();
    const userRole = (req.user.role || "").toLowerCase();

    let examFilter = {};
    if (userRole === "teacher") {
      const teachingClasses = await classModel.find({ teacherId: userId }).select("_id").lean();
      const classIds = teachingClasses.map((c) => c._id);
      examFilter = { $or: [{ classId: { $in: classIds } }, { createdBy: userId }] };
    } else if (userRole !== "admin") {
      // student (hoặc role khác): chỉ xem đề đã công bố của các lớp mình học
      const enrolledClasses = await classModel
        .find({ "students.studentId": userId })
        .select("_id")
        .lean();
      const classIds = enrolledClasses.map((c) => c._id);
      examFilter = { classId: { $in: classIds }, status: { $in: ["PUBLISHED", "COMPLETED"] } };
    }
    // admin: examFilter = {} → xem tất cả

    const exams = await Exam.find(examFilter).sort({ createdAt: -1 });

    const now = new Date().getTime();
    let updatedExams = [];

    for (let exam of exams) {
      const startTime = new Date(exam.startTime).getTime();
      const endTime = startTime + exam.duration * 60000;

      if (now > endTime && exam.status === "PUBLISHED") {
        exam.status = "COMPLETED";
        await exam.save();
      }

      updatedExams.push(exam);
    }

    const data =
      userRole === "admin" || userRole === "teacher"
        ? updatedExams
        : updatedExams.map((exam) => redactExamAnswersForStudent(exam.toObject()));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error.message || "Lỗi hệ thống khi tải danh sách đề thi." });
  }
};

// 7. Lấy chi tiết đề thi theo ID
export const getExamById = async (req, res) => {
  try {
    const examId = req.params.id;
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(404).json({ message: "Kỳ thi không tồn tại hoặc ID không hợp lệ!" });
    }

    const exam = await Exam.findById(examId).populate("questions.questionId").lean();

    if (!exam) {
      return res.status(404).json({ message: "Không tìm thấy kỳ thi!" });
    }

    const userId = (req.user._id || req.user.id || "").toString();
    const userRole = (req.user.role || "").toLowerCase();
    const targetClass = await classModel.findById(exam.classId).lean();

    // S4-FIX-01: RBAC & IDOR check
    if (userRole === "student") {
      if (!targetClass) return res.status(404).json({ message: "Không tìm thấy kỳ thi!" });
      const isStudentInClass = targetClass.students?.some(
        (s) => s.studentId?.toString() === userId
      );
      if (!isStudentInClass) return res.status(404).json({ message: "Không tìm thấy kỳ thi!" });
      if (exam.status !== "PUBLISHED" && exam.status !== "COMPLETED")
        return res.status(404).json({ message: "Không tìm thấy kỳ thi!" });
    } else if (userRole === "teacher") {
      const classTeacherId = (
        targetClass?.teacherId?._id ||
        targetClass?.teacherId ||
        ""
      ).toString();
      const isCreator = (exam.createdBy?._id || exam.createdBy || "").toString() === userId;
      if (classTeacherId !== userId && !isCreator) {
        return res.status(403).json({ message: "Bạn không có quyền truy cập đề thi này!" });
      }
    }

    // Polyfill for AI Exam Generation snapshot data
    if (exam.questions && exam.questions.length > 0) {
      exam.questions = exam.questions.map((q) => {
        let questionData = q.isSnapshot && q.snapshotData ? q.snapshotData : q.questionId;

        // S4-FIX-01: Redact answers for student
        if (userRole === "student" && questionData) {
          const safeData = { ...questionData };
          delete safeData.correctAnswer;
          delete safeData.acceptedAnswers;
          delete safeData.suggestedAnswer;
          delete safeData.rubric;
          delete safeData.explanation;
          delete safeData.feedbackCorrect;
          delete safeData.feedbackIncorrect;
          if (Array.isArray(safeData.options)) {
            safeData.options = safeData.options.map((opt) => {
              if (typeof opt === "string") return opt;
              const safeOpt = { ...opt };
              delete safeOpt.isCorrect;
              return safeOpt;
            });
          }
          questionData = safeData;
        }

        return {
          ...q,
          questionId: questionData,
        };
      });
    }

    return res.status(200).json({ data: exam });
  } catch (error) {
    return res
      .status(500)
      .json({ message: error.message || "Lỗi hệ thống khi tải chi tiết đề thi." });
  }
};

// 8. Tạo đề thi từ ExamSet (Sprint 4 AI Blueprint Engine)
export const generateFromExamSet = async (req, res) => {
  try {
    const {
      classId,
      examSetId,
      title,
      durationMinutes,
      totalQuestions,
      totalPoints,
      questionTypeDistribution,
      difficultyDistribution,
      shuffleQuestions,
      shuffleOptions,
    } = req.body;

    // Validate essential inputs
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
    }
    if (!examSetId || !mongoose.Types.ObjectId.isValid(examSetId)) {
      return res.status(400).json({ message: "ID bộ đề không hợp lệ!" });
    }
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ message: "Tiêu đề không hợp lệ!" });
    }
    if (title.length > 255) {
      return res.status(400).json({ message: "Tiêu đề quá dài!" });
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      return res.status(400).json({ message: "Thời gian làm bài phải là số nguyên dương!" });
    }
    if (!Number.isInteger(totalQuestions) || totalQuestions <= 0) {
      return res.status(400).json({ message: "Tổng số câu hỏi phải là số nguyên dương!" });
    }
    if (typeof totalPoints !== "number" || totalPoints !== 10) {
      return res.status(400).json({ message: "Tổng điểm phải bằng đúng 10!" }); // S4-FIX-03
    }
    if (
      !questionTypeDistribution ||
      typeof questionTypeDistribution !== "object" ||
      Array.isArray(questionTypeDistribution) ||
      !difficultyDistribution ||
      typeof difficultyDistribution !== "object" ||
      Array.isArray(difficultyDistribution)
    ) {
      return res.status(400).json({ message: "Phân bố câu hỏi không hợp lệ!" });
    }

    const validTypes = ["multiple_choice", "true_false", "short_answer", "essay"];
    const validDiffs = ["easy", "medium", "hard"];

    for (const [key, value] of Object.entries(questionTypeDistribution)) {
      if (!validTypes.includes(key))
        return res.status(400).json({ message: `Loại câu hỏi ${key} không hợp lệ!` });
      if (!Number.isInteger(value) || value < 0)
        return res.status(400).json({ message: "Giá trị phân bổ phải là số nguyên >= 0!" });
    }
    for (const [key, value] of Object.entries(difficultyDistribution)) {
      if (!validDiffs.includes(key))
        return res.status(400).json({ message: `Độ khó ${key} không hợp lệ!` });
      if (!Number.isInteger(value) || value < 0)
        return res.status(400).json({ message: "Giá trị phân bổ phải là số nguyên >= 0!" });
    }

    const targetClass = await classModel.findOne({ _id: classId, isDeleted: false });
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại!" });
    }

    // Check if Teacher has access to the class
    const userId = (req.user._id || req.user.id || "").toString();
    const userRole = (req.user.role || "").toLowerCase();

    if (userRole !== "admin") {
      const classTeacherId = (targetClass.teacherId?._id || targetClass.teacherId || "").toString();
      if (classTeacherId !== userId) {
        return res.status(403).json({ message: "Bạn không có quyền tạo đề thi cho lớp học này!" });
      }
    }

    const newExam = await aiExamGenerationService.generateExamFromSet({
      userId,
      classId,
      examSetId,
      blueprint: {
        title: title.trim(),
        durationMinutes,
        totalQuestions,
        totalPoints,
        questionTypeDistribution,
        difficultyDistribution,
        shuffleQuestions: !!shuffleQuestions,
        shuffleOptions: !!shuffleOptions,
      },
    });

    return res.status(201).json({
      message: "Tạo đề thi nháp từ bộ đề thành công!",
      data: newExam,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({ message: error.message || "Lỗi hệ thống khi sinh đề thi." });
  }
};
