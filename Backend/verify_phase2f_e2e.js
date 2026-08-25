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
import Assignment from "./src/modules/assignment/assignment.model.js";
import AssignmentAttempt from "./src/modules/assignment/assignmentAttempt.model.js";
import PerformanceEvidence from "./src/modules/performance/performanceEvidence.model.js";
import createApp from "./src/app.js";
import request from "supertest";

const app = createApp();

async function runTests() {
  console.log("=== PHASE 2F E2E VERIFICATION ===");
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/eduspace_thpt");
    console.log("Connected to DB");

    // Clear previous test data
    await User.deleteMany({ email: { $in: ["teacher_2f@test.com", "student_2f_1@test.com", "student_2f_2@test.com"] } });
    await Class.deleteMany({ name: "Class 2F" });
    await Course.deleteMany({ name: "Course 2F" });
    await Topic.deleteMany({ name: "Topic 2F" });
    await Question.deleteMany({ tags: "test2f" });
    await Assignment.deleteMany({ title: "Assignment 2F" });
    await AssignmentAttempt.deleteMany({});
    await Subject.deleteMany({ code: "SUB2F" });
    
    // 1. Preconditions
    const teacher = await User.create({ email: "teacher_2f@test.com", username: "teacher2f", password: "password", role: "Teacher", fullName: "Teacher 2F" });
    const student1 = await User.create({ email: "student_2f_1@test.com", username: "student2f_1", password: "password", role: "Student", fullName: "Student 2F 1" });
    const student2 = await User.create({ email: "student_2f_2@test.com", username: "student2f_2", password: "password", role: "Student", fullName: "Student 2F 2" });
    
    const subject = await Subject.create({ name: "Subject 2F", code: "SUB2F", createdBy: teacher._id });
    const course = await Course.create({ name: "Course 2F", code: "C2F", description: "Course for 2F", createdBy: teacher._id, subjectId: subject._id, duration: { value: 1, unit: "MONTH" }, grade: 10 });
    const topic = await Topic.create({ name: "Topic 2F", courseId: course._id });
    
    const cls = await Class.create({ name: "Class 2F", courseId: course._id, teacherId: teacher._id, status: "OPEN", capacity: 30, level: "FOUNDATION", code: "CLS2F" });
    
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
      tags: ["test2f"],
      createdBy: teacher._id
    });
    
    const q2 = await Question.create({
      topicId: topic._id,
      type: "ESSAY",
      difficulty: "HARD",
      content: [{ id: "q2_1", type: "TEXT", order: 1, text: "Explain theory of relativity." }],
      status: "PUBLISHED",
      tags: ["test2f"],
      createdBy: teacher._id
    });

    const teacherToken = jwt.sign({ id: teacher._id, role: teacher.role }, process.env.JWT_SECRET || "eduspace_secret_key");
    const student1Token = jwt.sign({ id: student1._id, role: student1.role }, process.env.JWT_SECRET || "eduspace_secret_key");
    const student2Token = jwt.sign({ id: student2._id, role: student2.role }, process.env.JWT_SECRET || "eduspace_secret_key");

    // TEST 2: Teacher Create Assignment
    console.log("Running TEST 2...");
    const createRes = await request(app)
      .post("/api/assignments")
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({
        classId: cls._id,
        topicId: topic._id,
        title: "Assignment 2F",
        description: "Test description",
        status: "DRAFT",
        questions: [
          { questionId: q1._id, order: 1, points: 5 },
          { questionId: q2._id, order: 2, points: 5 }
        ]
      });
    assert.strictEqual(createRes.status, 201, "Teacher should be able to create assignment");
    const assignmentId = createRes.body.assignment._id;
    console.log("TEST 2 PASSED");

    // TEST 3: Publish
    console.log("Running TEST 3...");
    const publishRes = await request(app)
      .patch(`/api/assignments/${assignmentId}/publish`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ status: "PUBLISHED" });
    assert.strictEqual(publishRes.status, 200, "Teacher should be able to publish assignment");
    console.log("TEST 3 PASSED");

    // TEST 4: Student Access
    console.log("Running TEST 4...");
    const accessRes1 = await request(app)
      .get(`/api/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${student1Token}`);
    assert.strictEqual(accessRes1.status, 200, "Enrolled student should see assignment");
    
    const accessRes2 = await request(app)
      .get(`/api/assignments/${assignmentId}`)
      .set("Authorization", `Bearer ${student2Token}`);
    assert.strictEqual(accessRes2.status, 403, "Unenrolled student should not be able to access assignment");
    console.log("TEST 4 PASSED");

    // TEST 5: Start Attempt
    console.log("Running TEST 5...");
    const startRes = await request(app)
      .post(`/api/assignments/${assignmentId}/attempts`)
      .set("Authorization", `Bearer ${student1Token}`);
    assert.strictEqual(startRes.status, 201, "Enrolled student should be able to start attempt");
    const attemptId = startRes.body.attempt._id;
    
    const startResDup = await request(app)
      .post(`/api/assignments/${assignmentId}/attempts`)
      .set("Authorization", `Bearer ${student1Token}`);
    assert.strictEqual(startResDup.status, 400, "Should prevent duplicate IN_PROGRESS attempt");
    console.log("TEST 5 PASSED");

    // TEST 6 & 7: Save MCQ & Essay Answer
    console.log("Running TEST 6 & 7...");
    const q1OptionId = q1.options.find(o => o.isCorrect)._id;
    
    const saveQ1Res = await request(app)
      .patch(`/api/assignments/attempts/${attemptId}/questions/${q1._id}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .send({ selectedOptionIds: [q1OptionId] });
    assert.strictEqual(saveQ1Res.status, 200, "Should save MCQ answer");

    const saveRes2 = await request(app)
      .patch(`/api/assignments/attempts/${attemptId}/questions/${q2._id}`)
      .set("Authorization", `Bearer ${student1Token}`)
      .send({ answer: { content: [{ id: "ans2", type: "TEXT", text: "Theory of Relativity" }] } });
    if (saveRes2.status !== 200) console.error("TEST 6 Error:", saveRes2.body);
    assert.strictEqual(saveRes2.status, 200, "Should save Essay answer");
    console.log("TEST 6 & 7 PASSED");

    // TEST 8: Submit
    console.log("Running TEST 8...");
    const submitRes = await request(app)
      .post(`/api/assignments/attempts/${attemptId}/submit`)
      .set("Authorization", `Bearer ${student1Token}`);
    assert.strictEqual(submitRes.status, 200, "Should submit successfully");
    assert.strictEqual(submitRes.body.attempt.status, "SUBMITTED", "Attempt with essay should be SUBMITTED pending grading");
    console.log("TEST 8 PASSED");

    // TEST 9 & 10: IDOR and Teacher Attempts
    console.log("Running TEST 9 & 10...");
    const teacherAttemptsRes = await request(app)
      .get(`/api/assignments/${assignmentId}/teacher-attempts`)
      .set("Authorization", `Bearer ${teacherToken}`);
    assert.strictEqual(teacherAttemptsRes.status, 200);
    assert.strictEqual(teacherAttemptsRes.body.attempts.length, 1);

    const student2GetRes = await request(app)
      .get(`/api/assignments/attempts/${attemptId}`)
      .set("Authorization", `Bearer ${student2Token}`);
    assert.strictEqual(student2GetRes.status, 403, "Student B cannot view Student A attempt");
    console.log("TEST 9 & 10 PASSED");

    // TEST 11: Essay Grading
    console.log("Running TEST 11...");
    const gradeRes = await request(app)
      .patch(`/api/assignments/attempts/${attemptId}/questions/${q2._id}/grade`)
      .set("Authorization", `Bearer ${teacherToken}`)
      .send({ score: 4, feedback: "Good effort" });
    assert.strictEqual(gradeRes.status, 200, "Teacher should be able to grade essay");
    assert.strictEqual(gradeRes.body.attempt.status, "GRADED", "Attempt should transition to GRADED once all questions are graded");
    console.log("TEST 11 PASSED");

    // TEST 12 & 13: Performance
    console.log("Running TEST 12...");
    // Check if PerformanceEvidence was created
    await new Promise(resolve => setTimeout(resolve, 1000));
    const evidences = await PerformanceEvidence.find({ sourceId: attemptId });
    assert.strictEqual(evidences.length, 2, "Should have created evidence for the two questions in attempt");
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
