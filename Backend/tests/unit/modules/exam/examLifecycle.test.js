import { describe, it, beforeAll, afterAll } from "vitest";
import { expect } from "chai";
import mongoose from "mongoose";
import Exam from "../../../../src/modules/exam/exam.model.js";
import ExamAttempt from "../../../../src/modules/exam-attempt/examAttempt.model.js";
import Question from "../../../../src/modules/question/question.model.js";
import ClassEnrollment from "../../../../src/modules/classEnrollment/classEnrollment.model.js";
import * as examAttemptService from "../../../../src/modules/exam-attempt/examAttempt.service.js";
import { connectDB, disconnectDB } from "../../../integration/domain04/testUtils.js";

describe("Domain 03.4 - Exam Lifecycle & Anti-Cheat", () => {
  let question;
  let exam;
  let studentId;

  beforeAll(async () => {
    // AN TOÀN: dùng DB test local riêng (testUtils.js), TUYỆT ĐỐI không connect thẳng
    // process.env.MONGO_URI (Atlas thật) — file gốc làm vậy trong khi after() bên dưới
    // deleteMany({}) toàn bộ Question/Exam/ExamAttempt, có thể xoá sạch dữ liệu thật.
    await connectDB();

    studentId = new mongoose.Types.ObjectId();

    question = new Question({
      topicId: new mongoose.Types.ObjectId(),
      type: "MCQ",
      selectionMode: "SINGLE",
      content: [{ id: "q1", type: "TEXT", text: "What is 10 * 10?" }],
      options: [
        {
          id: "opt1",
          content: [{ id: "o1", type: "TEXT", text: "100" }],
          isCorrect: true,
          order: 1,
        },
        {
          id: "opt2",
          content: [{ id: "o2", type: "TEXT", text: "20" }],
          isCorrect: false,
          order: 2,
        },
      ],
      status: "PUBLISHED",
    });
    await question.save();

    exam = new Exam({
      topicId: new mongoose.Types.ObjectId(),
      classId: new mongoose.Types.ObjectId(),
      title: "Math Final",
      status: "PUBLISHED",
      duration: 60, // 60 minutes
      attemptsAllowed: 2,
      scorePolicy: "HIGHEST",
      createdBy: new mongoose.Types.ObjectId(),
      questions: [{ questionId: question._id, order: 1, points: 10 }],
    });
    await exam.save();

    // startExamService kiểm tra student phải có ClassEnrollment ACTIVE ở đúng classId của exam
    // (thêm sau khi test này được viết) — thiếu thì luôn bị chặn "không được đăng ký vào lớp".
    await ClassEnrollment.create({
      enrollmentId: new mongoose.Types.ObjectId(),
      studentId,
      classId: exam.classId,
      status: "ACTIVE",
      createdBy: new mongoose.Types.ObjectId(),
    });
  });

  afterAll(async () => {
    await Question.deleteMany({});
    await Exam.deleteMany({});
    await ExamAttempt.deleteMany({});
    await ClassEnrollment.deleteMany({});
    await disconnectDB();
  });

  it("should enforce attemptsAllowed limit", async () => {
    // Attempt 1
    const attempt1 = await examAttemptService.startExamService(exam._id, studentId);
    expect(attempt1.sessionToken).to.exist;

    // Simulate submission of attempt 1
    await ExamAttempt.findByIdAndUpdate(attempt1.attemptId, { status: "GRADED" });

    // Attempt 2
    const attempt2 = await examAttemptService.startExamService(exam._id, studentId);
    expect(attempt2.sessionToken).to.exist;

    // Simulate submission of attempt 2
    await ExamAttempt.findByIdAndUpdate(attempt2.attemptId, { status: "GRADED" });

    // Attempt 3 (Should fail)
    let error;
    try {
      await examAttemptService.startExamService(exam._id, studentId);
    } catch (e) {
      error = e;
    }
    expect(error).to.exist;
    expect(error.message).to.include("maximum number of attempts");
  });

  it("should record cheat warnings atomically", async () => {
    // Get attempt 2 and reset status to IN_PROGRESS for testing
    const attempt = await ExamAttempt.findOne({ examId: exam._id, studentId }).sort({
      attemptNumber: -1,
    });
    attempt.status = "IN_PROGRESS";
    await attempt.save();

    // Trigger 2 cheat warnings
    await examAttemptService.incrementCheatWarningService(
      attempt._id,
      attempt.sessionToken,
      studentId,
      "TAB_SWITCH"
    );
    const finalAttempt = await examAttemptService.incrementCheatWarningService(
      attempt._id,
      attempt.sessionToken,
      studentId,
      "COPY_PASTE"
    );

    expect(finalAttempt.cheatWarnings).to.equal(2);
    expect(finalAttempt.cheatLogs.length).to.equal(2);
    expect(finalAttempt.cheatLogs[0].cheatType).to.equal("TAB_SWITCH");
    expect(finalAttempt.cheatLogs[1].cheatType).to.equal("COPY_PASTE");
  });

  it("should grade automatically and accurately", async () => {
    const attempt = await ExamAttempt.findOne({
      examId: exam._id,
      studentId,
      status: "IN_PROGRESS",
    });

    // Save answer
    await examAttemptService.saveExamAnswerService(
      attempt._id,
      attempt.sessionToken,
      studentId,
      question._id.toString(),
      {
        selectedOptionIds: ["opt1"],
      }
    );

    // Submit
    const graded = await examAttemptService.submitExamService(
      attempt._id,
      attempt.sessionToken,
      studentId
    );
    expect(graded.status).to.equal("GRADED");
    expect(graded.score).to.equal(10);
  });
});
