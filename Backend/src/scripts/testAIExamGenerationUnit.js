import assert from "assert";
import mongoose from "mongoose";
import ExamSet from "../models/examSet.model.js";
import Exam from "../models/exam.model.js";
import classModel from "../models/class.model.js";
import aiExamGenerationService from "../ai/services/aiExamGeneration.service.js";
import { generateFromExamSet } from "../controllers/exam.controller.js";
import express from "express";

const fakeUserId = new mongoose.Types.ObjectId().toString();
const fakeTeacherId = fakeUserId;
const fakeClassId = new mongoose.Types.ObjectId().toString();
const fakeExamSetId = new mongoose.Types.ObjectId().toString();

const mockExamSet = {
  _id: fakeExamSetId,
  ownerId: fakeTeacherId,
  isDeleted: false,
  questions: [
    { questionId: "q1", type: "multiple_choice", difficulty: "easy", options: [{ id: "o1", text: "1", isCorrect: true }] },
    { questionId: "q2", type: "multiple_choice", difficulty: "medium", options: [{ id: "o1", text: "1", isCorrect: true }] },
    { questionId: "q3", type: "essay", difficulty: "hard" },
    { questionId: "q4", type: "essay", difficulty: "hard" },
    { questionId: "q5", type: "true_false", difficulty: "easy" },
    { questionId: "q6", type: "true_false", difficulty: "medium" },
    { questionId: "q7", type: "multiple_choice", difficulty: "medium" },
  ]
};

async function runUnitTests() {
  console.log("🚀 Bắt đầu chạy Test Unit cho AI Exam Generation (Sprint 4)...");
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

  // MOCK
  const origExamSetFindOne = ExamSet.findOne;
  const origClassFindOne = classModel.findOne;
  const origExamFindOne = Exam.findOne;
  const origExamSave = Exam.prototype.save;

  ExamSet.findOne = () => ({
    lean: async () => mockExamSet
  });

  classModel.findOne = async () => ({
    _id: fakeClassId,
    teacherId: fakeTeacherId,
    isDeleted: false
  });

  Exam.findOne = async () => null; // No duplicate draft
  Exam.prototype.save = async function() { return this; }; // mock save

  // === Tests cho Service (Blueprint Engine) ===

  await runTest("Service - distributePoints chia đều chính xác", async () => {
    const q = [{id:1}, {id:2}, {id:3}];
    const pts = aiExamGenerationService.distributePoints(q, 10);
    assert.strictEqual(pts[0].assignedPoints, 3.33);
    assert.strictEqual(pts[1].assignedPoints, 3.33);
    assert.strictEqual(pts[2].assignedPoints, 3.34);
    assert.strictEqual(pts.reduce((a,b)=>a+b.assignedPoints, 0), 10);
  });

  await runTest("Service - selectQuestionsByBlueprint chọn đúng số lượng và phân bố", async () => {
    const blueprint = {
      totalQuestions: 3,
      questionTypeDistribution: { multiple_choice: 2, essay: 1 },
      difficultyDistribution: { easy: 1, medium: 1, hard: 1 },
      shuffleQuestions: false,
      shuffleOptions: false
    };

    const selected = aiExamGenerationService.selectQuestionsByBlueprint(mockExamSet.questions, blueprint);
    assert.strictEqual(selected.length, 3);
    assert.strictEqual(selected.filter(q => q.type === "multiple_choice").length, 2);
    assert.strictEqual(selected.filter(q => q.type === "essay").length, 1);
    assert.strictEqual(selected.filter(q => q.difficulty === "easy").length, 1);
    assert.strictEqual(selected.filter(q => q.difficulty === "medium").length, 1);
    assert.strictEqual(selected.filter(q => q.difficulty === "hard").length, 1);
  });

  await runTest("Service - selectQuestionsByBlueprint ném 422 nếu không tìm được cách bốc", async () => {
    const blueprint = {
      totalQuestions: 2,
      questionTypeDistribution: { multiple_choice: 2 },
      difficultyDistribution: { hard: 2 }, // Khong co MCQ nao kho trong mock
    };

    try {
      aiExamGenerationService.selectQuestionsByBlueprint(mockExamSet.questions, blueprint);
      assert.fail("Phải throw error");
    } catch (e) {
      assert.strictEqual(e.statusCode, 422);
    }
  });

  await runTest("Service - IDOR kiểm tra ownerId ExamSet", async () => {
    ExamSet.findOne = () => ({ lean: async () => ({ ...mockExamSet, ownerId: "another_user" }) });
    try {
      await aiExamGenerationService.generateExamFromSet({
        userId: fakeTeacherId, classId: fakeClassId, examSetId: fakeExamSetId, blueprint: { totalQuestions: 1, totalPoints: 10 }
      });
      assert.fail("Phải block IDOR");
    } catch (e) {
      assert.strictEqual(e.statusCode, 403);
    } finally {
      ExamSet.findOne = () => ({ lean: async () => mockExamSet });
    }
  });

  await runTest("Service - Ngăn tạo duplicate Draft (Idempotency)", async () => {
    Exam.findOne = async () => ({ _id: "existing_exam" });
    try {
      await aiExamGenerationService.generateExamFromSet({
        userId: fakeTeacherId, classId: fakeClassId, examSetId: fakeExamSetId, blueprint: { title: "Draft", totalQuestions: 1, totalPoints: 10 }
      });
      assert.fail("Phải chặn trùng Draft");
    } catch (e) {
      assert.strictEqual(e.statusCode, 409);
    } finally {
      Exam.findOne = async () => null;
    }
  });

  // === Tests cho Controller ===
  
  const createMockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
  };

  await runTest("Controller - Chặn nếu thiếu classId", async () => {
    const req = { body: {} };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.ok(res.data.message.includes("lớp học"));
  });

  await runTest("Controller - Tạo Exam thành công trả về 201", async () => {
    const req = {
      user: { id: fakeTeacherId, role: "teacher" },
      body: {
        classId: fakeClassId,
        examSetId: fakeExamSetId,
        title: "Test Exam AI",
        durationMinutes: 45,
        totalQuestions: 2,
        totalPoints: 10,
        questionTypeDistribution: { essay: 2 },
        difficultyDistribution: { hard: 2 },
        shuffleQuestions: true
      }
    };
    const res = createMockRes();
    await generateFromExamSet(req, res);
    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.data.data.status, "DRAFT");
    assert.strictEqual(res.data.data.questions.length, 2);
    assert.strictEqual(res.data.data.questions[0].isSnapshot, true);
  });

  // Restore mocks
  ExamSet.findOne = origExamSetFindOne;
  classModel.findOne = origClassFindOne;
  Exam.findOne = origExamFindOne;
  Exam.prototype.save = origExamSave;

  console.log(`\nKết quả Test Exam Generation: ${passed} PASS / ${failed} FAIL\n`);
  if (failed > 0) process.exit(1);
}

runUnitTests().catch(e => {
  console.error(e);
  process.exit(1);
});
