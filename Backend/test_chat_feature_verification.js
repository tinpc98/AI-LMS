import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "./src/modules/auth/index.js";
import { Class } from "./src/modules/class/index.js";
import Message from "./src/modules/chat/message.model.js";
import fetch from "node-fetch";

dotenv.config();

const URL_CLASSES = "http://localhost:5000/api/classes";
const URL_GLOBAL = "http://localhost:5000/api/messages";

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, status: user.status },
    process.env.JWT_SECRET || "edusynth_secret_key_2024",
    { expiresIn: "1h" }
  );
};

const runTests = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");

  const teacher = await User.findOne({ role: "Teacher" });
  const student = await User.findOne({ role: "Student" });
  const otherStudent = await User.findOne({ role: "Student", _id: { $ne: student._id } });
  const admin = await User.findOne({ role: "Admin" });

  const teacherToken = generateToken(teacher);
  const studentToken = generateToken(student);
  const otherStudentToken = generateToken(otherStudent);
  const adminToken = generateToken(admin);

  const classA = await Class.findOne({ "students.studentId": student._id, "students.status": "Enrolled" });
  const classB = await Class.findOne({ "students.studentId": { $ne: student._id } });

  // 1. Tạo một tin nhắn mới để test
  const msgRes = await fetch(`${URL_CLASSES}/${classA._id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${teacherToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Tin nhắn test reaction" })
  });
  const msgData = await msgRes.json();
  const msgId = msgData.data._id;

  console.log("\n=== PHẦN A: REACTION ===");
  // Kịch bản 1: Thả 👍 vào tin nhắn
  let res = await fetch(`${URL_CLASSES}/${classA._id}/messages/${msgId}/reactions`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ emoji: "👍" })
  });
  let data = await res.json();
  console.log("1. Thả 👍:", data.data.reactionsSummary);

  // Kịch bản 2: Thả ❤️ vào cùng tin đó
  res = await fetch(`${URL_CLASSES}/${classA._id}/messages/${msgId}/reactions`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ emoji: "❤️" })
  });
  data = await res.json();
  console.log("2. Thả ❤️ thay thế:", data.data.reactionsSummary);

  // Kịch bản 3: Thả lại ❤️ lần nữa
  res = await fetch(`${URL_CLASSES}/${classA._id}/messages/${msgId}/reactions`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ emoji: "❤️" })
  });
  data = await res.json();
  console.log("3. Thả lại ❤️ (Xóa):", data.data.reactionsSummary);

  // Kịch bản 4: 3 người cùng thả 👍
  await fetch(`${URL_CLASSES}/${classA._id}/messages/${msgId}/reactions`, {
    method: "PUT", headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ emoji: "👍" })
  });
  await fetch(`${URL_CLASSES}/${classA._id}/messages/${msgId}/reactions`, {
    method: "PUT", headers: { Authorization: `Bearer ${teacherToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ emoji: "👍" })
  });
  // Giả lập admin thả cho nhanh (admin có quyền vào class)
  res = await fetch(`${URL_CLASSES}/${classA._id}/messages/${msgId}/reactions`, {
    method: "PUT", headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ emoji: "👍" })
  });
  data = await res.json();
  console.log("4. Ba người thả 👍:", data.data.reactionsSummary);

  // Kịch bản 5: Thả emoji ngoài whitelist
  res = await fetch(`${URL_CLASSES}/${classA._id}/messages/${msgId}/reactions`, {
    method: "PUT", headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ emoji: "😈" })
  });
  console.log("5. Ngoài whitelist status:", res.status);

  // Kịch bản 6: Thả vào tin nhắn xóa
  const deletedMsg = await Message.create({ classId: classA._id, senderId: teacher._id, content: "Deleted", isDeleted: true });
  res = await fetch(`${URL_CLASSES}/${classA._id}/messages/${deletedMsg._id}/reactions`, {
    method: "PUT", headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ emoji: "👍" })
  });
  console.log("6. Tin nhắn đã xóa status:", res.status);

  // Kịch bản 7: Lớp không tham gia
  res = await fetch(`${URL_CLASSES}/${classB._id}/messages/${msgId}/reactions`, {
    method: "PUT", headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ emoji: "👍" })
  });
  console.log("7. Lớp không tham gia status:", res.status);

  // Kịch bản 8: Gửi userId người khác
  res = await fetch(`${URL_CLASSES}/${classA._id}/messages/${msgId}/reactions`, {
    method: "PUT", headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ emoji: "❤️", userId: admin._id })
  });
  data = await res.json();
  // Kiểm tra userReaction trả về xem có phải là của token không
  console.log("8. Gửi userId giả, userReaction nhận diện là:", data.data.userReaction === "❤️" ? "Đúng (Dùng token)" : "Sai");

  // Kịch bản 9: Lịch sử tin nhắn
  res = await fetch(`${URL_CLASSES}/${classA._id}/messages`, { headers: { Authorization: `Bearer ${studentToken}` } });
  data = await res.json();
  const testMsg = data.data.find(m => m._id === msgId);
  console.log("9. Lịch sử tin nhắn reactions:", testMsg.reactionsSummary, "userReaction:", testMsg.userReaction);


  console.log("\n=== PHẦN B: TỔNG SỐ TIN CHƯA ĐỌC ===");
  // Test 5 (Không có lớp)
  res = await fetch(`${URL_GLOBAL}/unread-summary`, { headers: { Authorization: `Bearer ${otherStudentToken}` } }); // Assume otherStudent has 0 classes enrolled
  data = await res.json();
  console.log("5. Người dùng không có lớp (hoặc ít lớp): Total =", data.data?.totalUnread, "| Danh sách rỗng/chi tiết:", data.data?.details?.length);

  // Test 1: Lấy của Student hiện tại
  res = await fetch(`${URL_GLOBAL}/unread-summary`, { headers: { Authorization: `Bearer ${studentToken}` } });
  data = await res.json();
  console.log("1. Student Summary Total:", data.data.totalUnread);
  console.log("   Chi tiết:", data.data.details.map(d => `${d.className}: ${d.unreadCount}`).join(", "));

  // Test 2: Đánh dấu đã đọc lớp A
  await fetch(`${URL_CLASSES}/${classA._id}/messages/read`, {
    method: "POST", headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ lastReadMessageId: msgId })
  });
  res = await fetch(`${URL_GLOBAL}/unread-summary`, { headers: { Authorization: `Bearer ${studentToken}` } });
  data = await res.json();
  console.log("2. Sau khi đánh dấu đọc lớp A, Total:", data.data.totalUnread);

  // Test 4: Teacher
  res = await fetch(`${URL_GLOBAL}/unread-summary`, { headers: { Authorization: `Bearer ${teacherToken}` } });
  data = await res.json();
  console.log("4. Teacher Summary Total:", data.data.totalUnread, "| Số lớp quản lý:", data.data.details.length);
  
  process.exit(0);
};

runTests();
