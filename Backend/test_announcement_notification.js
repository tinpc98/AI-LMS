import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: "d:/Dự Án/AI-LMS/Backend/.env" });

const JWT_SECRET = process.env.JWT_SECRET || "EduSynthAI_SeniorSecretKey_2026";
const MONGO_URI = process.env.MONGO_URI;

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
};

const runTests = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const Class = mongoose.model("Class", new mongoose.Schema({}, { strict: false }));
    const Notification = mongoose.model("Notification", new mongoose.Schema({}, { strict: false }));
    
    // Tìm một lớp học có teacher và student
    const targetClass = await Class.findOne({ isDeleted: false, "students.status": "Enrolled" });
    if (!targetClass) throw new Error("No class found");

    const teacherId = targetClass.get("teacherId");
    const teacher = await User.findById(teacherId);
    if (!teacher) throw new Error("No teacher found");

    const teacherToken = generateToken(teacher);

    const BASE_URL = "http://localhost:5000/api";
    
    // Đếm số lượng notification trước khi test
    const countBefore = await Notification.countDocuments({ classId: targetClass._id, type: "announcement" });
    console.log(`Notifications before: ${countBefore}`);

    // Call API tạo Announcement
    const res = await fetch(`${BASE_URL}/announcements`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${teacherToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: "Test Announcement Notification",
        content: "Nội dung thông báo test notification.",
        scope: "Class",
        classId: targetClass._id.toString()
      })
    });

    console.log("Create Announcement Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);

    // Chờ một chút để background task (nếu có) hoàn thành
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Đếm số lượng notification sau khi test
    const countAfter = await Notification.countDocuments({ classId: targetClass._id, type: "announcement" });
    console.log(`Notifications after: ${countAfter}`);
    
    console.log(`Created ${countAfter - countBefore} notifications.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTests();
