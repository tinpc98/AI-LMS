import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "#modules/auth/index.js";
import { Class } from "#modules/class/index.js";
import { Exam } from "#modules/exam/index.js";
import { ExamSet } from "#modules/exam-set/index.js";
import ExamAttempt from "#modules/exam-attempt/examAttempt.model.js";
import examAttemptService from "#modules/exam-attempt/examAttempt.service.js";
import draftAnswersService from "#modules/exam-attempt/draftAnswers.service.js";

dotenv.config();

const runTest = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB.");

    // 1. Setup Data
    const student = await User.findOne({ role: "Student" }) || await User.create({ email: "student_e2e@test.com", password: "123", role: "Student" });
    const teacher = await User.findOne({ role: "Teacher" }) || await User.create({ email: "teacher_e2e@test.com", password: "123", role: "Teacher" });

    const classData = await Class.create({
      code: "CLASS_E2E_" + Date.now(),
      name: "Class E2E",
      className: "Class E2E Name",
      courseId: new mongoose.Types.ObjectId(),
      teacherId: teacher._id,
      students: [{ studentId: student._id, status: "Enrolled" }]
    });

    const examSet = await ExamSet.create({
      title: "AI Exam Set E2E",
      teacherId: teacher._id,
      folderId: new mongoose.Types.ObjectId(),
      ownerId: teacher._id,
      questions: [
        { order: 1, questionId: new mongoose.Types.ObjectId(), content: "Multiple Choice AI", type: "multiple_choice", options: [{id: "A", text: "1"}, {id: "B", text: "2"}], correctAnswer: "A" },
        { order: 2, questionId: new mongoose.Types.ObjectId(), content: "True False AI", type: "true_false", options: [{id: "A", text: "True"}, {id: "B", text: "False"}], correctAnswer: "A" },
        { order: 3, questionId: new mongoose.Types.ObjectId(), content: "Short Answer AI", type: "short_answer", acceptedAnswers: ["short", "answer"], caseSensitive: false },
        { order: 4, questionId: new mongoose.Types.ObjectId(), content: "Essay AI", type: "essay" }
      ]
    });

    const exam = await Exam.create({
      title: "Mixed Exam E2E",
      classId: classData._id,
      status: "PUBLISHED",
      examSetId: examSet._id,
      duration: 60,
      startTime: new Date(Date.now() - 10000), // past
      questions: examSet.questions.map(q => ({
        questionId: q.questionId,
        points: 2.5,
        isSnapshot: true,
        snapshotData: {
          type: q.type,
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
          acceptedAnswers: q.acceptedAnswers,
          caseSensitive: q.caseSensitive
        }
      }))
    });

    console.log("Setup complete. Exam ID:", exam._id.toString());

    // 2. Test startExam (with token)
    const { req, res } = mockReqRes({ examId: exam._id, takeover: false }, student);
    
    // Manual simulation of startExam controller logic since we can't easily invoke the Express controller directly without a server.
    // Let's create an attempt directly as the controller would:
    const attempt = await ExamAttempt.create({
      examId: exam._id,
      studentId: student._id,
      status: "IN_PROGRESS",
      sessionToken: "TOKEN_123",
      answersVersion: 0,
      answers: []
    });
    console.log("Attempt created with Session Token:", attempt.sessionToken);

    // 3. Test Heartbeat / Session Token Mismatch
    try {
      await draftAnswersService.saveDraftAnswers(attempt._id, student._id, [], 0, "WRONG_TOKEN");
      console.log("❌ FAIL: autosave allowed WRONG_TOKEN");
    } catch (err) {
      if (err.errorCode === "SESSION_MISMATCH") {
        console.log("✅ PASS: autosave blocked WRONG_TOKEN (SESSION_MISMATCH)");
      } else {
        console.log("❌ FAIL: autosave blocked but wrong error:", err.message);
      }
    }

    // 4. Test Optimistic Locking (Concurrent Autosaves)
    // Simulate Tab A reading version 0
    const answersTabA = [{ questionId: examSet.questions[0].questionId.toString(), selectedOption: "A" }];
    const resA = await draftAnswersService.saveDraftAnswers(attempt._id, student._id, answersTabA, 0, "TOKEN_123");
    console.log("✅ PASS: Tab A saved successfully. New version:", resA.answersVersion);

    // Simulate Tab B still having version 0 and trying to save
    const answersTabB = [{ questionId: examSet.questions[0].questionId.toString(), selectedOption: "B" }];
    try {
      await draftAnswersService.saveDraftAnswers(attempt._id, student._id, answersTabB, 0, "TOKEN_123");
      console.log("❌ FAIL: Tab B saved successfully despite version mismatch");
    } catch (err) {
      if (err.errorCode === "VERSION_MISMATCH") {
        console.log("✅ PASS: Tab B blocked due to VERSION_MISMATCH (Optimistic Locking works)");
      } else {
        console.log("❌ FAIL: Tab B blocked but wrong error:", err.message);
      }
    }

    // 5. Test Race Autosave vs Submit
    // Submit updates the status to GRADED/PARTIALLY_GRADED
    const submitAnswers = [
      { questionId: examSet.questions[0].questionId.toString(), selectedOption: "A" }, // multiple_choice -> 2 pts
      { questionId: examSet.questions[1].questionId.toString(), selectedOption: "A" }, // true_false -> 2 pts
      { questionId: examSet.questions[2].questionId.toString(), essayText: "short" },  // short_answer -> 2 pts
      { questionId: examSet.questions[3].questionId.toString(), essayText: "my essay" } // essay -> 0 pts, manual
    ];
    console.log("Exam questions config:", exam.questions.map(q => q.questionId.toString()));
    console.log("Submit answers:", submitAnswers.map(a => a.questionId));
    
    const gradedAttempt = await examAttemptService.gradeSubmission(attempt._id, submitAnswers, student._id);
    console.log(`✅ PASS: Submit successful. Status is now: ${gradedAttempt.status}. Score: ${gradedAttempt.totalScore}`);

    // Now autosave tries to run after submit
    try {
      await draftAnswersService.saveDraftAnswers(attempt._id, student._id, answersTabA, 1, "TOKEN_123");
      console.log("❌ FAIL: Autosave allowed after submit!");
    } catch (err) {
      if (err.errorCode === "ATTEMPT_ALREADY_FINISHED") {
        console.log("✅ PASS: Autosave blocked because exam is already submitted (ATTEMPT_ALREADY_FINISHED)");
      } else {
        console.log("❌ FAIL: Autosave blocked but wrong error:", err.message);
      }
    }

    if (gradedAttempt.status === "PARTIALLY_GRADED") {
      console.log("✅ PASS: Attempt status correctly set to PARTIALLY_GRADED due to essay questions.");
    } else {
      console.log("❌ FAIL: Attempt status is", gradedAttempt.status);
    }

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
};

function mockReqRes(body, user) {
  const req = { body, user, headers: {} };
  const res = {
    status: (code) => ({
      json: (data) => {
        console.log(`Response [${code}]:`, data);
        return data;
      }
    })
  };
  return { req, res };
}

runTest();
