import mongoose from "mongoose";
import dotenv from "dotenv";
import { gradeSubmissionService } from "./src/modules/assignment/assignment.service.js";
import AssignmentModel from "./src/modules/assignment/assignment.model.js";
import SubmissionModel from "./src/modules/assignment/submission.model.js";

dotenv.config();

const testApi = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 1. Tạo 1 bài tập nháp maxScore = 10
    const assignment = await AssignmentModel.create({
      title: "Test MaxScore",
      classId: new mongoose.Types.ObjectId(),
      teacherId: new mongoose.Types.ObjectId(),
      deadline: new Date(),
      submissionMode: "file",
      maxScore: 10
    });

    // 2. Tạo 1 bài nộp nháp
    const submission = await SubmissionModel.create({
      assignmentId: assignment._id,
      studentId: new mongoose.Types.ObjectId(),
      classId: assignment.classId,
      submissionType: "file",
      status: "submitted"
    });

    console.log("Đã tạo bài tập maxScore=10 và bài nộp.");
    console.log("Thử chấm điểm = 500...");

    // 3. Gọi service để chấm điểm 500
    try {
      await gradeSubmissionService({
        submissionId: submission._id.toString(),
        grade: 500,
        feedback: "Điểm cao quá!",
        graderId: new mongoose.Types.ObjectId().toString(),
        graderName: "Teacher",
        userId: new mongoose.Types.ObjectId().toString(),
        userRole: "teacher",
      });
      console.log("ERROR: API cho phép chấm điểm!");
    } catch (error) {
      console.log("RESPONSE TỪ BACKEND BỊ CHẶN (PASS):");
      console.log({
        status: error.status || 500,
        message: error.message
      });
    }

    // Xóa dữ liệu rác
    await AssignmentModel.findByIdAndDelete(assignment._id);
    await SubmissionModel.findByIdAndDelete(submission._id);

  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

testApi();
