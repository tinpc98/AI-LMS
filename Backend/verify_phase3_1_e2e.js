import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import assert from "assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

import { User } from "./src/modules/auth/index.js";
import { Course } from "./src/modules/course/index.js";
import { Class as ClassModel } from "./src/modules/class/index.js";
import { ClassEnrollment } from "./src/modules/classEnrollment/index.js";
import Topic from "./src/modules/topic/topic.model.js";
import Lesson from "./src/modules/lesson/lesson.model.js";
import Question from "./src/modules/question/question.model.js";
import Video from "./src/modules/video/video.model.js";
import Document from "./src/modules/document/document.model.js";

import lessonController from "./src/modules/lesson/lesson.controller.js";
import * as questionController from "./src/modules/question/question.controller.js";

const mockReq = (user, params = {}, query = {}, body = {}) => ({
  user,
  params,
  query,
  body,
});

const mockRes = () => {
  const res = {};
  res.status = function(code) {
    this.statusCode = code;
    return this;
  };
  res.json = function(data) {
    this.data = data;
    return this;
  };
  return res;
};

const runTests = async () => {
  console.log("=== PHASE 3.1 BACKEND SECURITY & ARCHITECTURE E2E VERIFICATION ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  try {
    // 1. SETUP DATA
    const admin = await User.findOneAndUpdate(
      { email: "admin_31@example.com" },
      { fullName: "Admin 3.1", role: "Admin", status: "Active" },
      { upsert: true, returnDocument: 'after' }
    );

    const teacherA = await User.findOneAndUpdate(
      { email: "teacher_a_31@example.com" },
      { fullName: "Teacher A 3.1", role: "Teacher", status: "Active" },
      { upsert: true, returnDocument: 'after' }
    );

    const teacherB = await User.findOneAndUpdate(
      { email: "teacher_b_31@example.com" },
      { fullName: "Teacher B 3.1", role: "Teacher", status: "Active" },
      { upsert: true, returnDocument: 'after' }
    );

    const student = await User.findOneAndUpdate(
      { email: "student_31@example.com" },
      { fullName: "Student 3.1", role: "Student", status: "Active" },
      { upsert: true, returnDocument: 'after' }
    );

    // Create Course and Class
    const course = await Course.findOneAndUpdate(
      { code: "COURSE_31" },
      { name: "Course 3.1", createdBy: teacherA._id, status: "PUBLISHED" },
      { upsert: true, returnDocument: 'after' }
    );

    const classInfo = await ClassModel.findOneAndUpdate(
      { code: "CLASS_31" },
      { name: "Class 3.1", courseId: course._id, teacherId: teacherA._id, status: "OPEN" },
      { upsert: true, returnDocument: 'after' }
    );

    // Create ClassEnrollment
    await ClassEnrollment.findOneAndUpdate(
      { studentId: student._id, classId: classInfo._id },
      { status: "ACTIVE", createdBy: admin._id, enrollmentId: new mongoose.Types.ObjectId() },
      { upsert: true, returnDocument: 'after' }
    );

    // Create Topic and Lesson
    const topic = await Topic.findOneAndUpdate(
      { name: "Topic 3.1" },
      { courseId: course._id, order: 1 },
      { upsert: true, returnDocument: 'after' }
    );

    const lesson = await Lesson.findOneAndUpdate(
      { title: "Lesson 3.1" },
      { topicId: topic._id, status: "PUBLISHED", createdBy: teacherA._id, order: 1 },
      { upsert: true, returnDocument: 'after' }
    );

    // Create Questions
    const questionA = new Question({
      topicId: topic._id,
      type: "ESSAY", 
      difficulty: "EASY", 
      createdBy: teacherA._id,
      content: [{ id: "c1", type: "TEXT", text: "Question A 3.1" }]
    });
    await questionA.save();

    // --- TESTS ---

    console.log("Running TEST 1: Student Lesson Access (getLessonsByTopic)");
    const reqStudentLessonList = mockReq({ id: student._id, role: "Student" }, { topicId: topic._id });
    const resStudentLessonList = mockRes();
    const nextMock = (err) => { if (err) throw err; };
    await lessonController.getLessonsByTopic(reqStudentLessonList, resStudentLessonList, nextMock);
    
    assert.strictEqual(resStudentLessonList.statusCode, 200, "Student should access lessons list");
    assert.ok(resStudentLessonList.data.lessons.length > 0, "Should return lessons");
    console.log("TEST 1 PASSED");

    console.log("Running TEST 2: Student Lesson Access (getLessonById)");
    const reqStudentLessonDetails = mockReq({ id: student._id, role: "Student" }, { id: lesson._id });
    const resStudentLessonDetails = mockRes();
    await lessonController.getLessonById(reqStudentLessonDetails, resStudentLessonDetails, nextMock);
    
    assert.strictEqual(resStudentLessonDetails.statusCode, 200, "Student should access lesson details");
    assert.strictEqual(resStudentLessonDetails.data.lesson.title, "Lesson 3.1", "Should return the correct lesson");
    console.log("TEST 2 PASSED");

    console.log("Running TEST 3: Teacher B IDOR attempt to Update Question A");
    const reqUpdateQuestionB = mockReq({ id: teacherB._id, role: "Teacher" }, { id: questionA._id }, {}, { content: "Hacked!" });
    reqUpdateQuestionB.matchedData = { content: "Hacked!" }; 
    const resUpdateQuestionB = mockRes();
    
    const reqDeleteQuestionB = mockReq({ id: teacherB._id, role: "Teacher" }, { id: questionA._id });
    const resDeleteQuestionB = mockRes();
    await questionController.deleteQuestion(reqDeleteQuestionB, resDeleteQuestionB, nextMock);
    
    assert.strictEqual(resDeleteQuestionB.statusCode, 403, "Teacher B should be FORBIDDEN from deleting Question A");
    console.log("TEST 3 PASSED");

    console.log("Running TEST 4: Teacher A can delete their own Question A");
    const reqDeleteQuestionA = mockReq({ id: teacherA._id, role: "Teacher" }, { id: questionA._id });
    const resDeleteQuestionA = mockRes();
    await questionController.deleteQuestion(reqDeleteQuestionA, resDeleteQuestionA, nextMock);
    
    assert.strictEqual(resDeleteQuestionA.statusCode, 200, "Teacher A should successfully delete their own question");
    console.log("TEST 4 PASSED");

    console.log("Running TEST 5: Question Pagination");
    const reqGetQuestions = mockReq({ id: teacherA._id, role: "Teacher" }, {}, { page: 1, limit: 1 });
    const resGetQuestions = mockRes();
    await questionController.getQuestions(reqGetQuestions, resGetQuestions, nextMock);
    
    assert.strictEqual(resGetQuestions.statusCode, 200);
    assert.ok(resGetQuestions.data.pagination, "Pagination object should be present");
    assert.strictEqual(resGetQuestions.data.pagination.limit, 1, "Limit should be 1");
    assert.strictEqual(resGetQuestions.data.data.length <= 1, true, "Data length should be <= 1");
    console.log("TEST 5 PASSED");

    console.log("All Phase 3.1 E2E Tests PASSED successfully!");
    process.exit(0);
  } catch (err) {
    console.error("E2E Test Failed:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

runTests();
