import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import assert from "assert";

import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import User from "./src/modules/auth/user.model.js";
import Class from "./src/modules/class/class.model.js";
import Course from "./src/modules/course/course.model.js";
import Subject from "./src/modules/subject/subject.model.js";
import Enrollment from "./src/modules/enrollment/enrollment.model.js";
import Topic from "./src/modules/topic/topic.model.js";
import Question from "./src/modules/question/question.model.js";
import ClassEnrollment from "./src/modules/classEnrollment/classEnrollment.model.js";
import Exam from "./src/modules/exam/exam.model.js";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import PerformanceEvidence from "./src/modules/performance/performanceEvidence.model.js";
import createApp from "./src/app.js";
import request from "supertest";

const app = createApp();

async function runTests() {
  console.log("=== PHASE 2G E2E VERIFICATION ===");
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eduspace_thpt");
    console.log("Connected to DB");

    // Clear previous test data
    await User.deleteMany({ email: { $in: ["teacher_2g@test.com", "student_2g_1@test.com", "student_2g_2@test.com"] } });
    await Class.deleteMany({ name: "Class 2G" });
    await Course.deleteMany({ name: "Course 2G" });
    await Topic.deleteMany({ name: "Topic 2G" });
    await Question.deleteMany({ tags: "test2g" });
    await Exam.deleteMany({ title: "Exam 2G" });
    await ExamAttempt.deleteMany({});
    await Subject.deleteMany({ code: "SUB2G" });
    
    // 1. Preconditions
    const teacher = await User.create({ email: "teacher_2g@test.com", username: "teacher2g", password: "password", role: "Teacher", fullName: "Teacher 2G" });
    const student1 = await User.create({ email: "student_2g_1@test.com", username: "student2g_1", password: "password", role: "Student", fullName: "Student 2G 1" });
    const student2 = await User.create({ email: "student_2g_2@test.com", username: "student2g_2", password: "password", role: "Student", fullName: "Student 2G 2" });
    
    const subject = await Subject.create({ name: "Subject 2G", code: "SUB2G", createdBy: teacher._id });
    const course = await Course.create({ name: "Course 2G", code: "C2G", description: "Course for 2G", createdBy: teacher._id, subjectId: subject._id, duration: { value: 1, unit: "MONTH" }, grade: 10 });
    const topic = await Topic.create({ name: "Topic 2G", courseId: course._id });
    
    const cls = await Class.create({ name: "Class 2G", courseId: course._id, teacherId: teacher._id, status: "OPEN", capacity: 30, level: "FOUNDATION", code: "CLS2G" });
    
    const enrollment = await Enrollment.create({ studentId: student1._id, courseId: course._id, status: "CLASS_ASSIGNED", level: "FOUNDATION", price: 100000, createdBy: teacher._id });
    await ClassEnrollment.create({ studentId: student1._id, classId: cls._id, enrollmentId: enrollment._id, status: "ACTIVE", createdBy: teacher._id });
    
    const q1 = await Question.create({
      topicId: topic._id,
      type: "MCQ",
      difficulty: "MEDIUM",
      content: [{ id: "q1_1", type: "TEXT", order: 1, text: "What is 1+1?" }],
      options: [
        { id: "opt1", content: [{ id: "opt1_1", type: "TEXT", text: "1" }], isCorrect: false },
        { id: "opt2", content: [{ id: "opt2_1", type: "TEXT", text: "2" }], isCorrect: true }
      ],
      status: "PUBLISHED",
      tags: ["test2g"],
      createdBy: teacher._id
    });
    
    const q2 = await Question.create({
      topicId: topic._id,
      type: "ESSAY",
      difficulty: "HARD",
      content: [{ id: "q2_1", type: "TEXT", order: 1, text: "Explain exam protocol." }],
      status: "PUBLISHED",
      tags: ["test2g"],
      createdBy: teacher._id
    });

    const teacherToken = jwt.sign({ id: teacher._id, role: teacher.role }, process.env.JWT_SECRET || "eduspace_secret_key");
    const student1Token = jwt.sign({ id: student1._id, role: student1.role }, process.env.JWT_SECRET || "eduspace_secret_key");
    const student2Token = jwt.sign({ id: student2._id, role: student2.role }, process.env.JWT_SECRET || "eduspace_secret_key");

    // TEST 2: Teacher Create Exam
    console.log("Running TEST 2...");
    const createRes = await request(app)
      .post("/api/exams")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        classId: cls._id,
        topicId: topic._id,
        title: "Exam 2G",
        description: "Test description",
        status: "DRAFT",
        duration: 60,
        startAt: new Date(Date.now() - 1000).toISOString(),
        endAt: new Date(Date.now() + 3600000).toISOString(),
        attemptsAllowed: 1,
        questions: [
          { questionId: q1._id, order: 1, points: 5 },
          { questionId: q2._id, order: 2, points: 5 }
        ]
      });
    if (createRes.status !== 201) {
      console.error("TEST 2 Failed:", createRes.body);
    }
    assert.strictEqual(createRes.status, 201, "Teacher should be able to create exam");
    const examId = createRes.body.data._id;
    console.log("TEST 2 PASSED");

    // TEST 3: Publish
    console.log("Running TEST 3...");
    const publishRes = await request(app)
      .put(`/api/exams/${examId}`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ status: "PUBLISHED" });
    assert.strictEqual(publishRes.status, 200, "Teacher should be able to publish exam");
    console.log("TEST 3 PASSED");

    // TEST 4: Student Access / Exams List
    console.log("Running TEST 4...");
    const accessRes1 = await request(app)
      .get(`/api/exams/class/${cls._id}`)
      .set("Authorization", `Bearer ${student1Token}`);
    assert.strictEqual(accessRes1.status, 200, "Enrolled student should see exams in class");
    assert.strictEqual(accessRes1.body.data.length, 1);
    console.log("TEST 4 PASSED");

    // TEST 5: Start Attempt
    console.log("Running TEST 5...");
    const startRes = await request(app)
      .post(`/api/exams/${examId}/start`)
      .set("Authorization", `Bearer ${student1Token}`)
      .send({ tabId: "test_tab_1" });
    assert.strictEqual(startRes.status, 201, "Enrolled student should be able to start attempt");
    const attemptId = startRes.body.data._id;
    const sessionToken = startRes.body.data.sessionToken;
    const initialVersion = startRes.body.data.answersVersion || 0;
    console.log("TEST 5 PASSED");

    // TEST 6 & 7: Save MCQ & Essay Answer (Autosave Heartbeat)
    console.log("Running TEST 6 & 7...");
    const q1OptionId = q1.options.find(o => o.isCorrect)._id;
    
    // Heartbeat PATCH to /api/exam-attempts/:id/answers
    const saveQ1Res = await request(app)
      .patch(`/api/exam-attempts/${attemptId}/answers`)
      .set("Authorization", `Bearer ${student1Token}`)
      .set("x-session-token", sessionToken)
      .send({
        answers: [
          { questionId: q1._id, selectedOptionIds: [q1OptionId] },
          { questionId: q2._id, content: [{ id: "ans1", type: "TEXT", text: "Exam protocol" }] }
        ],
        answersVersion: initialVersion
      });
    if (saveQ1Res.status !== 200) {
      console.error("TEST 6 & 7 Failed:", saveQ1Res.body);
    }
    assert.strictEqual(saveQ1Res.status, 200, "Should save answers");
    assert.strictEqual(saveQ1Res.body.data.newVersion, initialVersion + 1, "Should increment answersVersion");
    console.log("TEST 6 & 7 PASSED");

    // TEST 8: Submit
    console.log("Running TEST 8...");
    const submitRes = await request(app)
      .post(`/api/exam-attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${student1Token}`)
      .set("x-session-token", sessionToken);
    if (submitRes.status !== 200) {
      console.error("TEST 8 Failed:", submitRes.body);
    }
    assert.strictEqual(submitRes.status, 200, "Should submit successfully");
    assert.strictEqual(submitRes.body.data.status, "PARTIALLY_GRADED", "Attempt with essay should be PARTIALLY_GRADED pending grading");
    console.log("TEST 8 PASSED");

    // TEST 9 & 10: IDOR and Teacher Review list
    console.log("Running TEST 9 & 10...");
    const teacherAttemptsRes = await request(app)
      .get(`/api/exam-attempts/exam/${examId}`)
      .set("Authorization", `Bearer ${teacherToken}`);
    assert.strictEqual(teacherAttemptsRes.status, 200);
    assert.strictEqual(teacherAttemptsRes.body.data.length, 1, "Teacher should see attempt in list");

    const student2GetRes = await request(app)
      .get(`/api/exam-attempts/${attemptId}`)
      .set("Authorization", `Bearer ${student2Token}`);
    assert.strictEqual(student2GetRes.status, 403, "Student B cannot view Student A attempt");
    console.log("TEST 9 & 10 PASSED");

    // TEST 11: Essay Grading
    console.log("Running TEST 11...");
    // Teacher gets review data first
    const reviewDataRes = await request(app)
      .get(`/api/exam-attempts/${attemptId}/review`)
      .set("Authorization", `Bearer ${teacherToken}`);
    assert.strictEqual(reviewDataRes.status, 200);
    
    // Grade the essay question
    const gradeRes = await request(app)
      .put(`/api/exam-attempts/${attemptId}/grade-essay`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        essayGrades: [
          { questionId: q2._id, pointsEarned: 4 }
        ]
      });
    assert.strictEqual(gradeRes.status, 200, "Teacher should be able to grade essay");
    assert.strictEqual(gradeRes.body.data.status, "GRADED", "Attempt should transition to GRADED once all questions are graded");
    console.log("TEST 11 PASSED");

    // TEST 12: Performance Integration
    console.log("Running TEST 12...");
    // Check if PerformanceEvidence was created
    await new Promise(resolve => setTimeout(resolve, 1000));
    const evidences = await PerformanceEvidence.find({ sourceId: attemptId, sourceType: "EXAM" });
    assert.strictEqual(evidences.length, 2, "Should have created evidence for the two questions in exam attempt");
    console.log("TEST 12 PASSED");

    console.log("All E2E Tests PASSED successfully!");
    process.exit(0);

  } catch (err) {
    console.error("E2E Tests Failed:");
    console.error(err);
    process.exit(1);
  }
}

runTests();
