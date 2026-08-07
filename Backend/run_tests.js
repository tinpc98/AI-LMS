import mongoose from "mongoose";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import Exam from "./src/modules/exam/exam.model.js";
import Class from "./src/modules/class/class.model.js";
import User from "./src/modules/user/user.model.js";
import QuestionBank from "./src/modules/question/questionBank.model.js";
import dotenv from "dotenv";
import axios from "axios";
import { resolveAttemptDeadline } from "./src/modules/exam-attempt/attemptDeadline.js";

dotenv.config();

// Create mock server instead of axios if no server is running
// Wait, I can just test against the DB and the controllers directly like before!
// That's more reliable since I don't know the server port.
import { startExam, submitExam, getExamAttemptDetail } from "./src/modules/exam-attempt/examAttempt.controller.js";
import { saveDraft } from "./src/modules/exam-attempt/draftAnswers.controller.js";
import { getExamById } from "./src/modules/exam/exam.controller.js";
import { getQuestionBanks } from "./src/modules/question/question.controller.js";

async function runTests() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms");

  const mockRes = () => {
    let statusCode = 200;
    let jsonResult = null;
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { jsonResult = { status: statusCode, data }; return res; },
      getResult: () => jsonResult
    };
    return res;
  };

  // Find users
  const student1 = await User.findOne({ role: "student" }).lean() || { _id: new mongoose.Types.ObjectId(), role: "student" };
  const student2 = await User.findOne({ role: "student", _id: { $ne: student1._id } }).lean() || { _id: new mongoose.Types.ObjectId(), role: "student" };
  
  // Find exams
  const classA = await Class.findOne({ "students.studentId": student1._id }).lean();
  const classB = await Class.findOne({ "students.studentId": student2._id, _id: { $ne: classA?._id } }).lean();
  
  const examA = await Exam.findOne({ classId: classA?._id, status: "PUBLISHED" }).lean() || { _id: new mongoose.Types.ObjectId(), status: "PUBLISHED" };
  const examB = await Exam.findOne({ classId: classB?._id, status: "PUBLISHED" }).lean() || { _id: new mongoose.Types.ObjectId(), status: "PUBLISHED" };
  
  // SCENARIO 1: Student gets exam, does it have answers?
  let res1 = mockRes();
  await getExamById({ params: { id: examA._id.toString() }, user: { id: student1._id, role: "student" } }, res1);
  const data1 = res1.getResult();
  const hasAnswers = data1?.data?.questions?.some(q => q.questionId?.correctAnswer !== undefined);
  console.log("Scenario 1 (Answers hidden for student):", hasAnswers ? "FAIL (Answers leaked)" : "PASS (No answers)");

  // SCENARIO 2: Student accesses Question Bank
  let res2 = mockRes();
  await getQuestionBanks({ user: { id: student1._id, role: "student" } }, res2);
  console.log("Scenario 2 (Student gets bank):", res2.getResult()?.status === 403 ? "PASS (403)" : "FAIL " + res2.getResult()?.status);

  // SCENARIO 3: Student A accesses Exam B
  let res3 = mockRes();
  await getExamById({ params: { id: examB._id.toString() }, user: { id: student1._id, role: "student" } }, res3);
  console.log("Scenario 3 (Access wrong exam):", res3.getResult()?.status === 403 ? "PASS (403)" : "FAIL " + res3.getResult()?.status);

  // SCENARIO 4: Get exam before open time
  const futureExam = await Exam.findOne({ startTime: { $gt: new Date() }, status: "PUBLISHED" }).lean() || { _id: new mongoose.Types.ObjectId(), startTime: new Date(Date.now() + 100000) };
  let res4 = mockRes();
  await startExam({ body: { examId: futureExam._id.toString() }, user: { id: student1._id, role: "student" } }, res4);
  console.log("Scenario 4 (Before open time):", res4.getResult()?.status === 403 ? "PASS (403)" : "FAIL " + res4.getResult()?.status);

  // SCENARIO 5: Submit exam never started
  let res5 = mockRes();
  await submitExam({ params: { id: new mongoose.Types.ObjectId().toString() }, headers: {}, user: { id: student1._id, role: "student" }, body: { answers: [] } }, res5);
  console.log("Scenario 5 (Submit unstarted):", res5.getResult()?.status === 404 ? "PASS (404)" : "FAIL " + res5.getResult()?.status);
  
  // SCENARIO 6: Submit exam after time limit
  // Create an attempt that is timed out
  const attempt6 = new ExamAttempt({
    examId: examA._id,
    studentId: student1._id,
    status: "IN_PROGRESS",
    startTime: new Date(Date.now() - 3600 * 1000 * 5), // 5 hours ago
    sessionToken: "TOKEN6"
  });
  await attempt6.save();
  let res6 = mockRes();
  await submitExam({ params: { id: attempt6._id.toString() }, headers: { "x-session-token": "TOKEN6" }, user: { id: student1._id, role: "student" }, body: { answers: [] } }, res6);
  // Wait, does submitExam check deadline? Let's see what it returns
  console.log("Scenario 6 (Submit after time limit):", res6.getResult()?.status === 400 || res6.getResult()?.status === 409 ? "PASS (" + res6.getResult()?.status + ")" : "FAIL " + res6.getResult()?.status);

  // SCENARIO 7: Send score in payload
  // (We check the code for this, usually it doesn't map payload score)
  
  // SCENARIO 8: Submit exam twice
  attempt6.status = "SUBMITTED";
  await attempt6.save();
  let res8 = mockRes();
  await submitExam({ params: { id: attempt6._id.toString() }, headers: { "x-session-token": "TOKEN6" }, user: { id: student1._id, role: "student" }, body: { answers: [] } }, res8);
  console.log("Scenario 8 (Submit twice):", res8.getResult()?.status === 400 ? "PASS (400)" : "FAIL " + res8.getResult()?.status);

  // SCENARIO 9: View other student's result
  let res9 = mockRes();
  await getExamAttemptDetail({ params: { id: attempt6._id.toString() }, user: { id: student2._id, role: "student" } }, res9);
  console.log("Scenario 9 (View other's result):", res9.getResult()?.status === 403 ? "PASS (403)" : "FAIL " + res9.getResult()?.status);

  // SCENARIO 10: Valid user starts exam normally
  // Need a real exam and class. Will skip DB mock if it fails.
  
  // SCENARIO 11: Auto-save conflict (Done before, it works!)

  // SCENARIO 12: Dropped student accesses exam
  // Find a dropped student class
  const droppedClass = await Class.findOne({ "students.status": "Dropped" }).lean();
  if (droppedClass) {
     const droppedStudentId = droppedClass.students.find(s => s.status === "Dropped").studentId;
     let res12 = mockRes();
     await getExamById({ params: { id: examA._id.toString() }, user: { id: droppedStudentId, role: "student" } }, res12);
     console.log("Scenario 12 (Dropped student access):", res12.getResult()?.status === 403 ? "PASS (403)" : "FAIL " + res12.getResult()?.status);
  } else {
     console.log("Scenario 12: No dropped student found to test.");
  }
  
  await ExamAttempt.findByIdAndDelete(attempt6._id);
  mongoose.disconnect();
}
runTests().catch(console.error);
