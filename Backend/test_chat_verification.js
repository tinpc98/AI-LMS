import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "./src/modules/auth/index.js";
import { Class } from "./src/modules/class/index.js";
import Message from "./src/modules/chat/message.model.js";
import { io } from "socket.io-client";
import fetch from "node-fetch";

dotenv.config();

const URL = "http://localhost:5000/api/classes";
const SOCKET_URL = "http://localhost:5000";

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

  const teacherToken = generateToken(teacher);
  const studentToken = generateToken(student);

  const classA = await Class.findOne({ "students.studentId": student._id, "students.status": "Enrolled" });
  const classB = await Class.findOne({ "students.studentId": { $ne: student._id } });

  console.log("=== 1a. Sửa tin sau 15 phút ===");
  // Tạo tin nhắn cách đây 20 phút
  const oldMessage = await Message.create({
    classId: classA._id,
    senderId: student._id,
    type: "text",
    content: "Old message",
    createdAt: new Date(Date.now() - 20 * 60 * 1000)
  });

  const res1a = await fetch(`${URL}/${classA._id}/messages/${oldMessage._id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Try edit" })
  });
  const data1a = await res1a.json();
  console.log("Status:", res1a.status);
  console.log("Response:", data1a);

  console.log("\n=== 1b. Phân trang cursor ===");
  // Clear old messages for clean test
  await Message.deleteMany({ classId: classA._id });

  // Tạo 100 tin nhắn (để đảm bảo thứ tự thời gian chuẩn, ta tạo tuần tự hoặc set createdAt)
  const msgsToInsert = [];
  for (let i = 0; i < 100; i++) {
    msgsToInsert.push({
      classId: classA._id,
      senderId: student._id,
      content: `Msg ${i + 1}`,
      createdAt: new Date(Date.now() - (100 - i) * 1000)
    });
  }
  const inserted = await Message.insertMany(msgsToInsert);
  // Sort theo ID desc (mới nhất đầu)
  const sortedInserted = inserted.sort((a, b) => b._id.toString().localeCompare(a._id.toString()));

  // Lấy trang 1 (limit 50)
  const res1b_page1 = await fetch(`${URL}/${classA._id}/messages?limit=50`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const page1 = await res1b_page1.json();
  console.log(`Page 1 count: ${page1.data.length}`);
  console.log(`Page 1 first msg: ${page1.data[page1.data.length - 1].content}`); // Do API trả về mảng reverse (cũ trước)
  console.log(`Page 1 last msg: ${page1.data[0].content}`);

  // Chèn 1 tin nhắn mới xen ngang lúc đang đọc trang 2
  await Message.create({
    classId: classA._id,
    senderId: student._id,
    content: `Msg Xen Ngang`
  });

  // Lấy trang 2 bằng cursor (NextCursor của trang 1)
  const cursor = page1.nextCursor;
  const res1b_page2 = await fetch(`${URL}/${classA._id}/messages?limit=50&cursor=${cursor}`, {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const page2 = await res1b_page2.json();
  console.log(`Page 2 count: ${page2.data.length}`);
  // In tin đầu và cuối của trang 2
  console.log(`Page 2 first msg: ${page2.data[page2.data.length - 1].content}`);
  console.log(`Page 2 last msg: ${page2.data[0].content}`);

  console.log("\n=== 1c. Emoji Unicode ===");
  const testString = "Chào tiếng Việt có dấu 👨‍👩‍👧‍👦 🚀 cờ 🇻🇳";
  let res1c_send = await fetch(`${URL}/${classA._id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${studentToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: testString })
  });
  const data1c = await res1c_send.json();
  
  // Get from DB
  const dbMsg = await Message.findById(data1c.data._id);
  console.log("DB value:", dbMsg.content);
  console.log("API response value:", data1c.data.content);

  console.log("\n=== 4. Kiểm tra rò rỉ qua socket ===");
  const socketStudent = io(SOCKET_URL, { auth: { token: studentToken }, transports: ["websocket"], reconnection: false });
  
  await new Promise(r => socketStudent.on("connect", r));

  // Thử join room lớp B
  const joinRes = await new Promise(r => socketStudent.emit("JOIN_CHAT_ROOM", { classId: classB._id }, r));
  console.log("Join lớp B response:", joinRes);

  let leakReceived = false;
  socketStudent.on("CHAT_NEW_MESSAGE", (msg) => {
    if (msg.classId === classB._id.toString()) {
      leakReceived = true;
    }
  });

  // Teacher gửi tin vào lớp B qua REST API
  await fetch(`${URL}/${classB._id}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${teacherToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ content: "Top secret msg for class B" })
  });

  await new Promise(r => setTimeout(r, 1000));
  console.log("Socket nhận được tin rò rỉ không?:", leakReceived);
  
  process.exit(0);
};

runTests();
