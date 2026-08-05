import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./src/modules/auth/user.model.js";
import AssignmentModel from "./src/modules/assignment/assignment.model.js";
import FormData from "form-data";
import jwt from "jsonwebtoken";

dotenv.config();

const testSubmitHttp = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const student = await User.findOne({ email: /@/ });
    const assignment = await AssignmentModel.findOne({ deadline: { $gt: new Date() } });

    const token = jwt.sign(
      { id: student._id.toString(), role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("Bắt đầu submit HTTP...");
    const formData = new FormData();
    formData.append("content", "Đây là bài làm HTTP");
    formData.append("submissionType", "direct");

    const res = await fetch(`http://localhost:5000/api/assignments/submit/${assignment._id}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Lỗi script:", error.message);
  } finally {
    mongoose.connection.close();
  }
};

testSubmitHttp();
