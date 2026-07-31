import assert from "assert";
import mongoose from "mongoose";
import ExamSet from "../models/examSet.model.js";
import ExamSetShare from "../models/examSetShare.model.js";
import Exam from "../models/exam.model.js";
import User from "../models/user.model.js";
import classModel from "../models/class.model.js";
import aiExamGenerationService from "../ai/services/aiExamGeneration.service.js";
import { generateFromExamSet, getExamById, getAllExams } from "../controllers/exam.controller.js";

const fakeUserId = new mongoose.Types.ObjectId().toString();
const fakeTeacherId = fakeUserId;
const fakeStudentId = new mongoose.Types.ObjectId().toString();
const fakeAdminId = new mongoose.Types.ObjectId().toString();
const fakeClassId = new mongoose.Types.ObjectId().toString();
const fakeExamSetId = new mongoose.Types.ObjectId().toString();

const mockExamSet = {
  _id: fakeExamSetId,
  ownerId: fakeTeacherId,
  isDeleted: false,
  questions: [
    {
      questionId: "q1",
      type: "multiple_choice",
      difficulty: "easy",
      options: [{ id: "o1", text: "1", isCorrect: true }],
    },
    {
      questionId: "q2",
      type: "multiple_choice",
      difficulty: "medium",
      options: [{ id: "o1", text: "1", isCorrect: true }],
    },
    { questionId: "q3", type: "essay", difficulty: "hard" },
    { questionId: "q4", type: "essay", difficulty: "hard" },
    {
      questionId: "q5",
      type: "true_false",
      difficulty: "easy",
      options: [{ id: "o2", text: "True", isCorrect: true }],
    },
    {
      questionId: "q6",
      type: "true_false",
      difficulty: "medium",
      options: [{ id: "o3", text: "False", isCorrect: true }],
    },
    { questionId: "q7", type: "multiple_choice", difficulty: "medium" },
  ],
};

async function runUnitTests() {
  console.log("🚀 Bắt đầu chạy Test Unit cho AI Exam Generation (Sprint 4 Fixes)...");
  let passed = 0;
  let failed = 0;

  const runTest = async (name, testFn) => {
    try {
      await testFn();
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Lỗi: ${err.message}`);
      failed++;
    }
  };

  // ==========================================
  // SETUP MOCKS
  // ==========================================
  const origExamSetFindOne = ExamSet.findOne;
  const origExamSetShareFindOne = ExamSetShare.findOne;
  const origUserFindById = User.findById;
  const origClassFindOne = classModel.findOne;
  const origClassFindById = classModel.findById;
  const origExamFindOne = Exam.findOne;
  const origExamFindById = Exam.findById;
  const origExamFind = Exam.find;
  const origExamSave = Exam.prototype.save;

  const resetMocks = () => {
    ExamSet.findOne = () => ({ lean: async () => mockExamSet });
    ExamSetShare.findOne = () => ({ lean: async () => null });
    User.findById = (id) => ({
      lean: async () => {
        if (id === fakeAdminId) return { _id: id, role: "admin" };
        if (id === fakeTeacherId) return { _id: id, role: "teacher" };
        if (id === fakeStudentId) return { _id: id, role: "student" };
        return { _id: id, role: "teacher" };
      },
    });
    classModel.findOne = async () => ({
      _id: fakeClassId,
      teacherId: fakeTeacherId,
      isDeleted: false,
    });
    classModel.findById = () => ({
      lean: async () => ({
        _id: fakeClassId,
        teacherId: fakeTeacherId,
        students: [{ studentId: fakeStudentId }],
      }),
    });
    Exam.findOne = async () => null;
    Exam.findById = () => ({
      lean: async () => null,
      populate: () => ({ lean: async () => null }),
    });
    Exam.find = () => ({
      sort: () => [],
    });
    Exam.prototype.save = async function () {
      return this;
    };
  };

  const createMockRes = () => {
    const res = {};
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.data = data;
      return res;
    };
    return res;
  };

  // ==========================================
  // TESTS
  // ==========================================

  // 1. Router import
  await runTest("Router: Load router thành công", async () => {
    const routerModule = await import("../routes/exam.routes.js");
    assert.ok(routerModule.default, "Router loaded");
  });

  // 2. Validation
  resetMocks();
  await runTest("Validation: Thiếu params bắt buộc trả 400", async () => {
    const req = { body: {} };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  // 3. Validation: totalPoints
  await runTest("Validation: totalPoints = 9 trả 400", async () => {
    const req = {
      user: { _id: fakeTeacherId, role: "teacher" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "T",
        durationMinutes: 10,
        totalQuestions: 1,
        totalPoints: 9,
        questionTypeDistribution: {},
        difficultyDistribution: {},
      },
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.data.message.includes("10"));
  });

  await runTest("Validation: totalPoints = 11 trả 400", async () => {
    const req = {
      user: { _id: fakeTeacherId, role: "teacher" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "T",
        durationMinutes: 10,
        totalQuestions: 1,
        totalPoints: 11,
        questionTypeDistribution: {},
        difficultyDistribution: {},
      },
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.data.message.includes("10"));
  });

  await runTest("Validation: NaN totalPoints trả 400", async () => {
    const req = {
      user: { _id: fakeTeacherId, role: "teacher" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "T",
        durationMinutes: 10,
        totalQuestions: 1,
        totalPoints: NaN,
        questionTypeDistribution: {},
        difficultyDistribution: {},
      },
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 400);
  });

  await runTest("Validation: totalPoints = 10, config hợp lệ trả 201", async () => {
    const req = {
      user: { _id: fakeTeacherId, role: "teacher" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "T",
        durationMinutes: 10,
        totalQuestions: 2,
        totalPoints: 10,
        questionTypeDistribution: { essay: 2 },
        difficultyDistribution: { hard: 2 },
      },
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 201);
  });

  // 4. Fingerprint & Idempotency
  await runTest("Fingerprint: Đổi thứ tự key không đổi fingerprint (Canonicalize)", async () => {
    const bp1 = {
      title: "T",
      durationMinutes: 10,
      totalQuestions: 2,
      totalPoints: 10,
      questionTypeDistribution: { essay: 2 },
      difficultyDistribution: { hard: 2 },
      a: 1,
      b: 2,
    };
    const bp2 = {
      title: "T",
      durationMinutes: 10,
      totalQuestions: 2,
      totalPoints: 10,
      questionTypeDistribution: { essay: 2 },
      difficultyDistribution: { hard: 2 },
      b: 2,
      a: 1,
    };

    let searchedFingerprints = [];
    Exam.findOne = async (q) => {
      if (q.aiSourceFingerprint) searchedFingerprints.push(q.aiSourceFingerprint);
      return null;
    };

    await aiExamGenerationService.generateExamFromSet({
      userId: fakeTeacherId,
      classId: fakeClassId,
      examSetId: fakeExamSetId,
      blueprint: bp1,
    });
    await aiExamGenerationService.generateExamFromSet({
      userId: fakeTeacherId,
      classId: fakeClassId,
      examSetId: fakeExamSetId,
      blueprint: bp2,
    });

    assert.strictEqual(searchedFingerprints[0], searchedFingerprints[1]);
  });

  await runTest("Fingerprint: Config khác nhau tạo fingerprint khác nhau", async () => {
    let searchedFingerprints = [];
    Exam.findOne = async (q) => {
      if (q.aiSourceFingerprint) searchedFingerprints.push(q.aiSourceFingerprint);
      return null;
    };

    const bp1 = {
      title: "T",
      durationMinutes: 10,
      totalQuestions: 2,
      totalPoints: 10,
      questionTypeDistribution: { essay: 2 },
      difficultyDistribution: { hard: 2 },
      a: 1,
    };
    const bp2 = {
      title: "T",
      durationMinutes: 10,
      totalQuestions: 2,
      totalPoints: 10,
      questionTypeDistribution: { essay: 2 },
      difficultyDistribution: { hard: 2 },
      a: 2,
    };

    await aiExamGenerationService.generateExamFromSet({
      userId: fakeTeacherId,
      classId: fakeClassId,
      examSetId: fakeExamSetId,
      blueprint: bp1,
    });
    await aiExamGenerationService.generateExamFromSet({
      userId: fakeTeacherId,
      classId: fakeClassId,
      examSetId: fakeExamSetId,
      blueprint: bp2,
    });

    assert.notStrictEqual(searchedFingerprints[0], searchedFingerprints[1]);
  });

  await runTest(
    "Idempotency: Trả 409 nếu request lặp lại (cùng fingerprint và draft tồn tại)",
    async () => {
      resetMocks();
      Exam.findOne = async () => ({ _id: "existing_draft" });
      try {
        await aiExamGenerationService.generateExamFromSet({
          userId: fakeTeacherId,
          classId: fakeClassId,
          examSetId: fakeExamSetId,
          blueprint: { totalQuestions: 1, totalPoints: 10 },
        });
        assert.fail("Phải ném lỗi 409");
      } catch (e) {
        assert.strictEqual(e.statusCode, 409);
      }
    }
  );

  // 5. IDOR & Access Control
  await runTest("Class IDOR: Giáo viên không phải chủ lớp bị chặn", async () => {
    resetMocks();
    classModel.findOne = async () => ({
      _id: fakeClassId,
      teacherId: "another_teacher",
      isDeleted: false,
    });
    const req = {
      user: { _id: fakeTeacherId, role: "teacher" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "T",
        durationMinutes: 10,
        totalQuestions: 2,
        totalPoints: 10,
        questionTypeDistribution: { essay: 2 },
        difficultyDistribution: { hard: 2 },
      },
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 403);
  });

  await runTest("ExamSet IDOR: Giáo viên khác không có quyền Share bị chặn 404", async () => {
    resetMocks();
    ExamSet.findOne = () => ({ lean: async () => ({ ...mockExamSet, ownerId: "another_owner" }) });
    const req = {
      user: { _id: fakeTeacherId, role: "teacher" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "T",
        durationMinutes: 10,
        totalQuestions: 2,
        totalPoints: 10,
        questionTypeDistribution: { essay: 2 },
        difficultyDistribution: { hard: 2 },
      },
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 404);
  });

  await runTest("ExamSet IDOR: Quyền Admin bypass ExamSet owner", async () => {
    resetMocks();
    ExamSet.findOne = () => ({ lean: async () => ({ ...mockExamSet, ownerId: "another_owner" }) });
    const req = {
      user: { _id: fakeAdminId, role: "admin" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "T",
        durationMinutes: 10,
        totalQuestions: 2,
        totalPoints: 10,
        questionTypeDistribution: { essay: 2 },
        difficultyDistribution: { hard: 2 },
      },
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 201); // Admin bypasses
  });

  await runTest("ExamSet IDOR: Giáo viên có Share VIEW/EDIT được pass", async () => {
    resetMocks();
    ExamSet.findOne = () => ({ lean: async () => ({ ...mockExamSet, ownerId: "another_owner" }) });
    ExamSetShare.findOne = () => ({ lean: async () => ({ permission: "EDIT" }) });
    const req = {
      user: { _id: fakeTeacherId, role: "teacher" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "T",
        durationMinutes: 10,
        totalQuestions: 2,
        totalPoints: 10,
        questionTypeDistribution: { essay: 2 },
        difficultyDistribution: { hard: 2 },
      },
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 201);
  });

  // 6. getExamById (Ngăn lộ đáp án)
  const fakeExamId = new mongoose.Types.ObjectId().toString();

  const mockDraftExam = {
    _id: fakeExamId,
    classId: fakeClassId,
    status: "DRAFT",
    createdBy: fakeTeacherId,
    questions: [
      {
        isSnapshot: true,
        snapshotData: { id: "q1", correctAnswer: "A", options: [{ isCorrect: true, text: "A" }] },
      },
    ],
  };
  const mockPubExam = {
    _id: fakeExamId,
    classId: fakeClassId,
    status: "PUBLISHED",
    createdBy: fakeTeacherId,
    questions: [
      {
        isSnapshot: true,
        snapshotData: {
          id: "q1",
          correctAnswer: "A",
          rubric: "R",
          options: [{ isCorrect: true, text: "A" }],
        },
      },
    ],
  };

  await runTest("Student View: Không xem được DRAFT", async () => {
    resetMocks();
    Exam.findById = () => ({ populate: () => ({ lean: async () => mockDraftExam }) });
    const req = { params: { id: fakeExamId }, user: { _id: fakeStudentId, role: "student" } };
    const res = createMockRes();
    await getExamById(req, res);
    assert.strictEqual(res.statusCode, 404);
  });

  await runTest("Student View: Lớp khác bị chặn", async () => {
    resetMocks();
    Exam.findById = () => ({ populate: () => ({ lean: async () => mockPubExam }) });
    classModel.findById = () => ({
      lean: async () => ({ _id: fakeClassId, students: [{ studentId: "another" }] }),
    });
    const req = { params: { id: fakeExamId }, user: { _id: fakeStudentId, role: "student" } };
    const res = createMockRes();
    await getExamById(req, res);
    assert.strictEqual(res.statusCode, 404);
  });

  await runTest(
    "Student View: Đúng lớp xem được PUBLISHED, bị ẩn correctAnswer/rubric/isCorrect",
    async () => {
      resetMocks();
      Exam.findById = () => ({ populate: () => ({ lean: async () => mockPubExam }) });
      const req = { params: { id: fakeExamId }, user: { _id: fakeStudentId, role: "student" } };
      const res = createMockRes();
      await getExamById(req, res);
      assert.strictEqual(res.statusCode, 200);
      const q = res.data.data.questions[0].questionId;
      assert.strictEqual(q.correctAnswer, undefined);
      assert.strictEqual(q.rubric, undefined);
      assert.strictEqual(q.options[0].isCorrect, undefined);
    }
  );

  await runTest("Teacher View: Xem được DRAFT và đủ đáp án", async () => {
    resetMocks();
    Exam.findById = () => ({ populate: () => ({ lean: async () => mockDraftExam }) });
    const req = { params: { id: fakeExamId }, user: { _id: fakeTeacherId, role: "teacher" } };
    const res = createMockRes();
    await getExamById(req, res);
    assert.strictEqual(res.statusCode, 200);
    const q = res.data.data.questions[0].questionId;
    assert.strictEqual(q.correctAnswer, "A");
    assert.strictEqual(q.options[0].isCorrect, true);
  });

  // 7. Draft lifecycle
  await runTest("Draft Lifecycle: DRAFT hết thời gian không chuyển COMPLETED", async () => {
    resetMocks();
    const pastTime = new Date(Date.now() - 100000);
    let saved = false;
    Exam.find = () => ({
      sort: () => [
        {
          status: "DRAFT",
          startTime: pastTime,
          duration: 1,
          save: async () => {
            saved = true;
          },
        },
        {
          status: "PUBLISHED",
          startTime: pastTime,
          duration: 1,
          save: async () => {
            saved = true;
          },
        },
      ],
    });
    const req = {};
    const res = createMockRes();
    await getAllExams(req, res);
    assert.strictEqual(res.statusCode, 200);
    const draft = res.data.data[0];
    const pub = res.data.data[1];
    assert.strictEqual(draft.status, "DRAFT"); // stays draft
    assert.strictEqual(pub.status, "COMPLETED"); // converted
    assert.strictEqual(saved, true); // at least one saved
  });

  // Restore global mocks before exit
  ExamSet.findOne = origExamSetFindOne;
  ExamSetShare.findOne = origExamSetShareFindOne;
  User.findById = origUserFindById;
  classModel.findOne = origClassFindOne;
  classModel.findById = origClassFindById;
  Exam.findOne = origExamFindOne;
  Exam.findById = origExamFindById;
  Exam.find = origExamFind;
  Exam.prototype.save = origExamSave;

  console.log(`\nKết quả Test Exam Generation: ${passed} PASS / ${failed} FAIL\n`);
  process.exitCode = failed > 0 ? 1 : 0;
}

runUnitTests().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
