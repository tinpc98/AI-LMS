import examAttemptService from "../services/examAttempt.service.js";
import ExamAttempt from "../models/examAttempt.model.js";
import Question from "../models/question.model.js";

// =======================================================
// 1. API CHO HỌC SINH: Bắt đầu làm bài thi
// =======================================================
export const startExam = async (req, res) => {
  try {
    const { examId, studentId: bodyStudentId } = req.body;

    // 2. TỐI ƯU CÁCH LẤY ID HỌC SINH (Bao vây mọi trường hợp)
    // Đề phòng trường hợp Token dùng req.user._id thay vì req.user.id
    const studentId = req.user?.id || req.user?._id || bodyStudentId;

    // Kiểm tra đầu vào (Tôi đã sửa câu báo lỗi để hiển thị thẳng lên màn hình cái gì đang bị thiếu)
    if (!examId || !studentId) {
      return res.status(400).json({
        success: false,
        message: `Lỗi hệ thống: ID kỳ thi (${examId || "Thiếu"}) - ID học sinh (${studentId || "Thiếu"})!`,
      });
    }

    // === BƯỚC 1: KIỂM TRA LỊCH SỬ LÀM BÀI ===
    const existingAttempt = await ExamAttempt.findOne({
      examId: examId,
      studentId: studentId,
    });

    if (existingAttempt) {
      console.log(
        `🔎 Đã có bài làm với trạng thái: ${existingAttempt.status}. Exam: ${examId}, Student: ${studentId}`,
      );

      const completedStatuses = ["SUBMITTED", "PARTIALLY_GRADED", "GRADED"];
      if (completedStatuses.includes(existingAttempt.status)) {
        console.log(
          `🚫 Bị chặn! Học sinh không thể làm lại vì trạng thái là ${existingAttempt.status}.`,
        );
        return res.status(400).json({
          success: false,
          message:
            "Bạn đã hoàn thành bài thi này. Hệ thống không cho phép làm lại bài cũ!",
        });
      }

      // Cho phép resume nếu đang làm dở
      if (existingAttempt.status === "IN_PROGRESS") {
        return res.status(200).json({
          success: true,
          message: "Học sinh đang làm dở, chuyển tiếp vào phòng thi.",
          data: existingAttempt,
        });
      }
    }

    // === BƯỚC 2: TẠO BẢN GHI MỚI NẾU HOÀN TOÀN CHƯA THI ===
    console.log("✅ Học sinh hoàn toàn chưa thi, đang tạo bản ghi thi mới...");
    const newAttempt = new ExamAttempt({
      examId,
      studentId,
      status: "IN_PROGRESS",
      startTime: new Date(),
    });

    await newAttempt.save();

    return res.status(201).json({
      success: true,
      message: "Bắt đầu tính giờ làm bài!",
      data: newAttempt,
    });
  } catch (error) {
    console.error("❌ Lỗi API startExam:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// 2. API CHO HỌC SINH: Lấy chi tiết đề thi ĐANG LÀM
// (Sử dụng Deep Populate để kéo nội dung câu hỏi)
// =======================================================
export const getExamAttemptDetail = async (req, res) => {
  try {
    const attemptId = req.params.id;

    // LẤY PHIÊN LÀM BÀI -> MÓC NỐI ĐỀ THI -> MÓC NỐI TIẾP CÂU HỎI
    const attempt = await ExamAttempt.findById(attemptId).populate({
      path: "examId",
      populate: {
        path: "questions.questionId",
        // BẢO MẬT: Giấu tuyệt đối đáp án đúng (correctAnswer) không cho Frontend biết
        select: "-correctAnswer",
      },
    });

    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiên làm bài thi!" });
    }

    const exam = attempt.examId;
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Đề thi của lượt làm bài này đã bị xóa!",
      });
    }

    // Lắp ráp dữ liệu thành mảng questions phẳng để Frontend dễ render
    const formattedQuestions = exam.questions
      .map((q) => {
        const details = q.questionId;
        // Kiểm tra tránh trường hợp câu hỏi gốc trong DB đã bị xóa
        if (!details) return null;

        return {
          _id: details._id,
          type: details.type,
          content: details.content,
          options: details.options,
          points: q.points,
        };
      })
      .filter((q) => q !== null); // Lọc bỏ các câu hỏi bị null

    // Trả về cho Frontend
    res.status(200).json({
      success: true,
      data: {
        _id: attempt._id,
        status: attempt.status,
        examInfo: {
          title: exam.title,
          duration: exam.duration,
          startTime: exam.startTime,
        },
        questions: formattedQuestions,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết bài thi:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// 3. API CHO HỌC SINH: Nộp bài thi
// =======================================================
export const submitExam = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ!" });
    }

    const gradedAttempt = await examAttemptService.gradeSubmission(
      attemptId,
      answers,
    );

    res.status(200).json({
      message:
        gradedAttempt.status === "GRADED"
          ? "Nộp bài thành công! Hệ thống đã chấm xong trắc nghiệm."
          : "Nộp bài thành công! Đang chờ giáo viên chấm phần tự luận.",
      data: gradedAttempt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================================================
// 4. API CHO GIÁO VIÊN: Lấy chi tiết để chấm tự luận/xem lại
// =======================================================
// TRONG CONTROLLER GET_ATTEMPT_FOR_REVIEW CỦA BACKEND:
export const getAttemptForReview = async (req, res) => {
  try {
    const attemptId = req.params.id;

    const attempt = await ExamAttempt.findById(attemptId)
      .populate("studentId", "fullName email studentCode avatar")
      .populate("examId", "title topic duration questions")
      .lean();

    if (!attempt) {
      return res.status(404).json({ message: "Không tìm thấy bài làm!" });
    }

    const questionIds = attempt.answers.map((ans) => ans.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    const reviewData = {
      attemptId: attempt._id,
      student: attempt.studentId,
      examInfo: attempt.examId,
      status: attempt.status,
      totalScore: attempt.totalScore,
      submittedAt: attempt.endTime,

      cheatWarnings: attempt.cheatWarnings || 0,

      answersDetail: attempt.answers.map((ans) => {
        const qInfo = questionMap.get(ans.questionId.toString());
        const examQuestionConfig = attempt.examId?.questions?.find(
          (eq) => eq.questionId.toString() === ans.questionId.toString(),
        );
        const assignedPoints = examQuestionConfig
          ? examQuestionConfig.points
          : qInfo?.points || 1;

        return {
          questionId: ans.questionId,
          type: qInfo?.type,
          questionContent: qInfo?.content,
          options: qInfo?.options,
          studentAnswer: ans.essayText || ans.selectedOption,
          correctAnswer: qInfo?.correctAnswer,
          pointsEarned: ans.pointsEarned,
          maxPoints: assignedPoints,
        };
      }),
    };

    return res.status(200).json({ success: true, data: reviewData });
  } catch (error) {
    console.error("Lỗi lấy chi tiết review:", error);
    return res.status(500).json({ message: error.message });
  }
};

// =======================================================
// 5. API CHO GIÁO VIÊN: Chấm điểm tự luận
// =======================================================
export const gradeEssaySubmit = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { essayGrades } = req.body;

    if (!essayGrades || !Array.isArray(essayGrades)) {
      return res
        .status(400)
        .json({ message: "Dữ liệu chấm điểm không hợp lệ!" });
    }

    const updatedAttempt = await examAttemptService.gradeEssay(
      attemptId,
      essayGrades,
    );

    res.status(200).json({
      message: "Chấm điểm tự luận thành công! Đã chốt điểm bài thi.",
      data: updatedAttempt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// =======================================================
// 6. Lấy danh sách sinh viên trong lớp
// =======================================================
export const getAttemptsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    // Tìm tất cả các bản ghi làm bài của kỳ thi này
    // Populate 'studentId' để lấy thông tin user (Họ tên, mã sinh viên, avatar...)
    const attempts = await ExamAttempt.find({ examId: examId })
      .populate({
        path: "studentId",
        select: "fullName studentCode avatar", // Lọc ra các trường cần thiết để hiển thị trên Card
      })
      .sort({ createdAt: -1 }); // Sắp xếp bài nộp mới nhất lên đầu

    // Tính toán một số thống kê nhanh (tùy chọn để gửi lên FE)
    const stats = {
      total: attempts.length,
      graded: attempts.filter((a) => a.status === "GRADED").length,
      pending: attempts.filter((a) => a.status === "SUBMITTED").length,
      // Thêm logic đếm số bài bị cảnh báo gian lận nếu schema của bạn có lưu
    };

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách bài thi thành công",
      data: attempts,
      stats: stats,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài thi:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ: " + error.message,
    });
  }
};

export const recordCheatWarning = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { reason } = req.body;
    console.log(attemptId);

    // Tìm phiên làm bài đang mở của học sinh
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiên làm bài!" });
    }

    // Tăng số lần cảnh báo lên 1 (Dùng $inc hoặc toán tử cộng trực tiếp)
    attempt.cheatWarnings = (attempt.cheatWarnings || 0) + 1;
    await attempt.save();

    console.log(
      `🚨 Đã ghi nhận gian lận cho attempt ${attemptId}. Tổng số lần: ${attempt.cheatWarnings}`,
    );

    return res.status(200).json({
      success: true,
      message: "Đã ghi nhận cảnh báo gian lận",
      cheatWarnings: attempt.cheatWarnings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
