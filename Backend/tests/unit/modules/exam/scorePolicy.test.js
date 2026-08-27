import { describe, it, beforeAll, afterAll, afterEach } from "vitest";
import { expect } from "chai";
import mongoose from "mongoose";
import Exam from "../../../../src/modules/exam/exam.model.js";
import ExamAttempt from "../../../../src/modules/exam-attempt/examAttempt.model.js";
import { getFinalExamResultService } from "../../../../src/modules/exam-attempt/examAttempt.service.js";
import { connectDB, disconnectDB } from "../../../integration/domain04/testUtils.js";

describe("Domain 03.4 - Exam Score Policy", () => {
  let examHighestId;
  let examLatestId;
  let studentId;
  let otherStudentId;

  beforeAll(async () => {
    // AN TOÀN: DB test local, không connect thẳng process.env.MONGO_URI (Atlas thật) — xem
    // examLifecycle.test.js cho lý do đầy đủ.
    await connectDB();

    studentId = new mongoose.Types.ObjectId();
    otherStudentId = new mongoose.Types.ObjectId();
    const topicId = new mongoose.Types.ObjectId();
    const createdBy = new mongoose.Types.ObjectId();

    const examHighest = new Exam({
      topicId,
      classId: new mongoose.Types.ObjectId(),
      title: "Exam Highest",
      duration: 60,
      attemptsAllowed: 3,
      scorePolicy: "HIGHEST",
      status: "PUBLISHED",
      createdBy,
      questions: [{ questionId: new mongoose.Types.ObjectId(), order: 1, points: 10 }],
    });
    await examHighest.save();
    examHighestId = examHighest._id;

    const examLatest = new Exam({
      topicId,
      classId: new mongoose.Types.ObjectId(),
      title: "Exam Latest",
      duration: 60,
      attemptsAllowed: 3,
      scorePolicy: "LATEST",
      status: "PUBLISHED",
      createdBy,
      questions: [{ questionId: new mongoose.Types.ObjectId(), order: 1, points: 10 }],
    });
    await examLatest.save();
    examLatestId = examLatest._id;
  });

  afterAll(async () => {
    await Exam.deleteMany({});
    await ExamAttempt.deleteMany({});
    await disconnectDB();
  });

  afterEach(async () => {
    await ExamAttempt.deleteMany({});
  });

  it("CASE 1: attemptsAllowed = 3, scorePolicy = HIGHEST. Scores: 6.5, 8.5, 7.0 => finalScore = 8.5", async () => {
    await ExamAttempt.create([
      {
        examId: examHighestId,
        studentId,
        attemptNumber: 1,
        score: 6.5,
        status: "GRADED",
        sessionToken: "t1",
        expiresAt: new Date(),
      },
      {
        examId: examHighestId,
        studentId,
        attemptNumber: 2,
        score: 8.5,
        status: "GRADED",
        sessionToken: "t2",
        expiresAt: new Date(),
      },
      {
        examId: examHighestId,
        studentId,
        attemptNumber: 3,
        score: 7.0,
        status: "GRADED",
        sessionToken: "t3",
        expiresAt: new Date(),
      },
    ]);

    const result = await getFinalExamResultService(examHighestId, studentId);
    expect(result.finalScore).to.equal(8.5);
    expect(result.attemptsUsed).to.equal(3);
    expect(result.scorePolicy).to.equal("HIGHEST");
  });

  it("CASE 2: attemptsAllowed = 3, scorePolicy = LATEST. Scores: 6.5, 8.5, 7.0 => finalScore = 7.0", async () => {
    await ExamAttempt.create([
      {
        examId: examLatestId,
        studentId,
        attemptNumber: 1,
        score: 6.5,
        status: "GRADED",
        sessionToken: "t1",
        expiresAt: new Date(),
      },
      {
        examId: examLatestId,
        studentId,
        attemptNumber: 2,
        score: 8.5,
        status: "GRADED",
        sessionToken: "t2",
        expiresAt: new Date(),
      },
      {
        examId: examLatestId,
        studentId,
        attemptNumber: 3,
        score: 7.0,
        status: "GRADED",
        sessionToken: "t3",
        expiresAt: new Date(),
      },
    ]);

    const result = await getFinalExamResultService(examLatestId, studentId);
    expect(result.finalScore).to.equal(7.0);
    expect(result.scorePolicy).to.equal("LATEST");
  });

  it("CASE 3: Chỉ có 1 Attempt => finalScore = score của Attempt đó", async () => {
    await ExamAttempt.create([
      {
        examId: examHighestId,
        studentId,
        attemptNumber: 1,
        score: 9.0,
        status: "GRADED",
        sessionToken: "t1",
        expiresAt: new Date(),
      },
    ]);

    const result = await getFinalExamResultService(examHighestId, studentId);
    expect(result.finalScore).to.equal(9.0);
  });

  it("CASE 4: Không có Attempt hợp lệ => finalScore = null", async () => {
    const result = await getFinalExamResultService(examHighestId, studentId);
    expect(result.finalScore).to.be.null;
    expect(result.attemptsUsed).to.equal(0);
  });

  it("CASE 5: Có IN_PROGRESS Attempt => không được dùng để tính Final Score", async () => {
    await ExamAttempt.create([
      {
        examId: examHighestId,
        studentId,
        attemptNumber: 1,
        score: 6.0,
        status: "GRADED",
        sessionToken: "t1",
        expiresAt: new Date(),
      },
      {
        examId: examHighestId,
        studentId,
        attemptNumber: 2,
        score: null,
        status: "IN_PROGRESS",
        sessionToken: "t2",
        expiresAt: new Date(),
      },
    ]);

    const result = await getFinalExamResultService(examHighestId, studentId);
    expect(result.finalScore).to.equal(6.0); // Bỏ qua IN_PROGRESS
  });

  it("CASE 6 & 7: Student có Attempt của Exam khác hoặc Student B không ảnh hưởng", async () => {
    await ExamAttempt.create([
      {
        examId: examLatestId,
        studentId,
        attemptNumber: 1,
        score: 4.0,
        status: "GRADED",
        sessionToken: "t1",
        expiresAt: new Date(),
      }, // Exam khác
      {
        examId: examHighestId,
        studentId: otherStudentId,
        attemptNumber: 1,
        score: 10.0,
        status: "GRADED",
        sessionToken: "t2",
        expiresAt: new Date(),
      }, // Học sinh khác
      {
        examId: examHighestId,
        studentId,
        attemptNumber: 1,
        score: 5.0,
        status: "GRADED",
        sessionToken: "t3",
        expiresAt: new Date(),
      }, // Hợp lệ
    ]);

    const result = await getFinalExamResultService(examHighestId, studentId);
    expect(result.finalScore).to.equal(5.0);
    expect(result.attemptsUsed).to.equal(1);
  });

  it("CASE 8: Sau khi lấy Final Result, ExamAttempt history không thay đổi", async () => {
    await ExamAttempt.create([
      {
        examId: examHighestId,
        studentId,
        attemptNumber: 1,
        score: 6.5,
        status: "GRADED",
        sessionToken: "t1",
        expiresAt: new Date(),
      },
    ]);

    await getFinalExamResultService(examHighestId, studentId);

    const attempts = await ExamAttempt.find({ examId: examHighestId, studentId });
    expect(attempts.length).to.equal(1);
    expect(attempts[0].score).to.equal(6.5);
    expect(attempts[0].status).to.equal("GRADED");
  });
});
