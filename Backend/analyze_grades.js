import mongoose from "mongoose";
import dotenv from "dotenv";
import AssignmentModel from "./src/modules/assignment/assignment.model.js";
import SubmissionModel from "./src/modules/assignment/submission.model.js";
import "./src/modules/auth/user.model.js";
import "./src/modules/class/class.model.js";

dotenv.config();

const analyzeData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for Data Analysis");

    const submissions = await SubmissionModel.find({ grade: { $ne: null } })
      .populate("assignmentId", "title")
      .populate("gradedBy", "fullName email")
      .lean();

    console.log(`\n--- BÁO CÁO DỮ LIỆU CŨ ---`);
    console.log(`Tổng số bài nộp đã chấm: ${submissions.length}`);

    let hasGradeAbove10 = false;
    
    console.log(`\nChi tiết bài đã chấm:`);
    submissions.forEach(sub => {
      console.log(`- Bài nộp ID: ${sub._id}`);
      console.log(`  Bài tập: ${sub.assignmentId?.title || "N/A"}`);
      console.log(`  Người chấm: ${sub.gradedBy?.fullName || sub.gradedBy?.email || sub.gradedBy || "N/A"}`);
      console.log(`  Ngày chấm: ${sub.gradedAt}`);
      console.log(`  Điểm: ${sub.grade}`);
      
      if (sub.grade > 10) {
        hasGradeAbove10 = true;
      }
    });

    console.log(`\nCó giá trị grade > 10 không? ${hasGradeAbove10 ? "CÓ" : "KHÔNG"}`);

  } catch (error) {
    console.error("Lỗi:", error);
  } finally {
    mongoose.connection.close();
  }
};

analyzeData();
