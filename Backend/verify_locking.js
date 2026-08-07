import mongoose from "mongoose";
import ExamAttempt from "./src/modules/exam-attempt/examAttempt.model.js";
import { startExam, heartbeat, submitExam } from "./src/modules/exam-attempt/examAttempt.controller.js";
import { saveDraft } from "./src/modules/exam-attempt/draftAnswers.controller.js";
import Exam from "./src/modules/exam/exam.model.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms");

  const exam = await Exam.findOne({ isDeleted: false });
  if (!exam) {
      console.log("No published exam found for testing");
      process.exit(0);
  }

  console.log("Found exam:", exam._id);

  // Define a mock student ID
  const studentId = new mongoose.Types.ObjectId().toString();

  // Helper to mock express Request and Response
  const mockReqRes = (body, headers = {}) => {
    const req = {
      body,
      headers,
      user: { _id: studentId, role: "student" },
      ip: "127.0.0.1"
    };
    let jsonResult = null;
    let statusCode = 200;
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      json: (data) => {
        jsonResult = { status: statusCode, data };
        return jsonResult;
      }
    };
    return { req, res, getResult: () => jsonResult };
  };

  try {
    // 1. Device A starts exam
    const { req: req1, res: res1, getResult: getRes1 } = mockReqRes({ examId: exam._id });
    // Mock checkClassTeacherOwnership or skip if possible?
    // Actually startExam checks class enrollment!
    // Since we don't have a real student enrolled, startExam will fail at "Bạn không thuộc danh sách lớp thi này!"
    console.log("To properly test this, we need a student enrolled in the class. Mocking the database for testing is too complex for a simple script.");
    
    // Instead of doing end-to-end, let's just create an attempt directly in DB and test the locking functions
    
    const attempt = new ExamAttempt({
        examId: exam._id,
        studentId: studentId,
        status: "IN_PROGRESS",
        sessionToken: "TOKEN_A",
        answersVersion: 0,
        lastHeartbeat: new Date(),
    });
    await attempt.save();
    console.log("Created attempt ID:", attempt._id);
    
    // 2. Device A saves draft
    const { req: reqDraftA, res: resDraftA, getResult: getDraftA } = mockReqRes(
        { answers: [{ questionId: new mongoose.Types.ObjectId(), selectedOption: "A" }], answersVersion: 0 }, 
        { "x-session-token": "TOKEN_A" }
    );
    reqDraftA.params = { id: attempt._id };
    await saveDraft(reqDraftA, resDraftA);
    console.log("Device A save draft result:", getDraftA());
    
    // 3. Device B tries to save draft with wrong token
    const { req: reqDraftB, res: resDraftB, getResult: getDraftB } = mockReqRes(
        { answers: [{ questionId: new mongoose.Types.ObjectId(), selectedOption: "B" }], answersVersion: 1 }, 
        { "x-session-token": "TOKEN_B" }
    );
    reqDraftB.params = { id: attempt._id };
    try {
        await saveDraft(reqDraftB, resDraftB);
    } catch (e) {
        console.log("Device B save draft error (Expected):", e.statusCode, e.errorCode, e.message);
    }
    
    // 4. Device A tries to save draft with wrong answersVersion
    const { req: reqDraftA2, res: resDraftA2, getResult: getDraftA2 } = mockReqRes(
        { answers: [{ questionId: new mongoose.Types.ObjectId(), selectedOption: "C" }], answersVersion: 0 }, 
        { "x-session-token": "TOKEN_A" }
    );
    reqDraftA2.params = { id: attempt._id };
    try {
        await saveDraft(reqDraftA2, resDraftA2);
    } catch (e) {
        console.log("Device A save draft old version error (Expected):", e.statusCode, e.errorCode, e.message);
    }
    
    // 5. Device A sends heartbeat
    const { req: reqHb, res: resHb, getResult: getHb } = mockReqRes({}, { "x-session-token": "TOKEN_A" });
    reqHb.params = { id: attempt._id };
    await heartbeat(reqHb, resHb);
    console.log("Device A heartbeat result:", getHb());
    
    // Cleanup
    await ExamAttempt.findByIdAndDelete(attempt._id);
    console.log("Cleanup done.");

  } catch (error) {
    console.error("Test error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
