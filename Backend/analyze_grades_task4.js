import mongoose from "mongoose";
import dotenv from "dotenv";
import AssignmentModel from "./src/modules/assignment/assignment.model.js";
import SubmissionModel from "./src/modules/assignment/submission.model.js";

dotenv.config();

const analyze = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const submissions = await SubmissionModel.find({ grade: { $ne: null } });
    
    console.log(`Tổng số submission đã chấm: ${submissions.length}`);
    
    const dist = {
      "< 10": 0,
      "== 10": 0,
      "> 10": 0
    };
    
    const greaterThan10 = [];
    
    for (const sub of submissions) {
      if (sub.grade < 10) dist["< 10"]++;
      else if (sub.grade === 10) dist["== 10"]++;
      else {
        dist["> 10"]++;
        greaterThan10.push(sub);
      }
    }
    
    console.log("Phân bố giá trị grade:");
    console.log(dist);
    
    if (greaterThan10.length > 0) {
      console.log("Các bài nộp có điểm > 10:");
      for (const sub of greaterThan10) {
        const assignment = await AssignmentModel.findById(sub.assignmentId);
        console.log(`- Bài nộp ID: ${sub._id}, Điểm: ${sub.grade}, Thuộc bài tập: ${assignment?.title || sub.assignmentId}`);
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.connection.close();
  }
};

analyze();
