import mongoose from "mongoose";
import Exam from "./src/modules/exam/exam.model.js";
import { getExamById } from "./src/modules/exam/exam.controller.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms");
  
  const exam = await Exam.findOne({}).lean();
  if (!exam) {
    console.log("No exam found");
    process.exit(0);
  }
  
  const req = {
    params: { id: exam._id.toString() },
    user: { _id: "dummy", role: "teacher" } // Teacher to bypass class enrollment check
  };
  
  const res = {
    status: (code) => {
        return {
            json: (data) => {
                console.log(`Status: ${code}`);
                // Print the first question's questionId
                if (data.data && data.data.questions && data.data.questions.length > 0) {
                    console.log("First question ID object:", JSON.stringify(data.data.questions[0].questionId, null, 2));
                } else {
                    console.log("Response data:", data);
                }
            }
        }
    }
  };
  
  await getExamById(req, res);

  mongoose.disconnect();
}

run();
