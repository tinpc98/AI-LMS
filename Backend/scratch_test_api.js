import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Node 18+ has native fetch, but just in case we use global fetch

dotenv.config();

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

    // Find a student and a teacher
    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const Class = mongoose.model("Class", new mongoose.Schema({}, { strict: false }));
    const Exam = mongoose.model("Exam", new mongoose.Schema({}, { strict: false }));
    
    const classes = await Class.find({ isDeleted: false, "students.status": "Enrolled" }).limit(5);
    if (!classes.length) throw new Error("No classes found");
    
    let targetClass = null;
    let targetExam = null;
    
    for (const c of classes) {
      const exam = await Exam.findOne({ classId: c._id, isDeleted: false, status: "PUBLISHED" });
      if (exam) {
        targetClass = c;
        targetExam = exam;
        break;
      }
    }
    
    if (!targetExam) {
      targetClass = classes[0];
      targetExam = await Exam.findOne({ classId: targetClass._id });
    }

    if (!targetClass || !targetExam) {
        throw new Error("Could not find a class with an exam.");
    }

    const studentId = targetClass.get("students")[0].studentId;
    const teacherId = targetClass.get("teacherId");

    const student = await User.findById(studentId);
    const teacher = await User.findById(teacherId);

    const studentToken = generateToken(student);
    const teacherToken = generateToken(teacher);

    // Find another student from a DIFFERENT class for negative tests
    const otherClass = await Class.findOne({ _id: { $ne: targetClass._id }, "students.0": { $exists: true } });
    const otherStudent = await User.findById(otherClass.get("students")[0].studentId);
    const otherStudentToken = generateToken(otherStudent);

    const BASE_URL = "http://localhost:5000/api";
    
    const request = async (method, path, token, body = null) => {
      const options = {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      };
      if (body) options.body = JSON.stringify(body);
      
      const res = await fetch(`${BASE_URL}${path}`, options);
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch(e) { data = text; }
      return { status: res.status, data };
    };

    console.log("=============================================");
    console.log("SCENARIO 1: Sinh viên lấy đề thi (có bị lộ đáp án?)");
    let res1 = await request("GET", `/exams/${targetExam._id}`, studentToken);
    console.log("Status:", res1.status);
    console.log("Response fields in question 0:", Object.keys(res1.data.data?.questions?.[0]?.questionId || {}));
    if (res1.data.data?.questions?.[0]?.questionId?.options) {
        console.log("Options in question 0:", res1.data.data.questions[0].questionId.options);
    }
    
    console.log("=============================================");
    console.log("SCENARIO 2: Sinh viên gọi API ngân hàng câu hỏi");
    let res2 = await request("GET", `/questions`, studentToken);
    console.log("Status:", res2.status);
    console.log("Response:", JSON.stringify(res2.data).substring(0, 100));

    console.log("=============================================");
    console.log("SCENARIO 3: Sinh viên lớp A lấy đề thi lớp B");
    let res3 = await request("GET", `/exams/${targetExam._id}`, otherStudentToken);
    console.log("Status:", res3.status);
    console.log("Response:", res3.data);

    console.log("=============================================");
    console.log("SCENARIO 4: Lấy đề thi trước giờ mở (nếu có đề tương lai)");
    // Let's create a future exam for targetClass
    const futureExam = await Exam.create({
        title: "Future Exam",
        classId: targetClass._id,
        status: "PUBLISHED",
        startTime: new Date(Date.now() + 86400000), // tomorrow
        duration: 60,
        questions: targetExam.get("questions")
    });
    let res4 = await request("POST", `/exam-attempts/start`, studentToken, { examId: futureExam._id });
    console.log("Status:", res4.status);
    console.log("Response:", res4.data);

    console.log("=============================================");
    console.log("SCENARIO 5: Nộp bài mà chưa từng bắt đầu");
    let res5 = await request("POST", `/exam-attempts/${new mongoose.Types.ObjectId()}/submit`, studentToken, { answers: [] });
    console.log("Status:", res5.status);
    console.log("Response:", res5.data);

    console.log("=============================================");
    console.log("SCENARIO 10: Người dùng hợp lệ làm bài bình thường");
    let res10_start = await request("POST", `/exam-attempts/start`, studentToken, { examId: targetExam._id });
    console.log("Start Exam Status:", res10_start.status);
    
    if (res10_start.status === 201 || res10_start.status === 200) {
        const attemptId = res10_start.data.data._id;
        let res10_detail = await request("GET", `/exam-attempts/${attemptId}`, studentToken);
        console.log("Detail Exam Status:", res10_detail.status);
        console.log("Detail Fields in question 0:", Object.keys(res10_detail.data?.data?.questions?.[0] || {}));
        
        console.log("=============================================");
        console.log("SCENARIO 7: Gửi kèm `score` trong payload nộp bài");
        let res7 = await request("POST", `/exam-attempts/${attemptId}/submit`, studentToken, { answers: [], score: 100 });
        console.log("Status:", res7.status);
        console.log("Returned Score:", res7.data?.data?.score);
        
        console.log("=============================================");
        console.log("SCENARIO 8: Nộp bài lần 2");
        let res8 = await request("POST", `/exam-attempts/${attemptId}/submit`, studentToken, { answers: [] });
        console.log("Status:", res8.status);
        console.log("Response:", JSON.stringify(res8.data).substring(0, 100));
        
        console.log("=============================================");
        console.log("SCENARIO 9: Xem kết quả của sv khác");
        let res9 = await request("GET", `/exam-attempts/${attemptId}`, otherStudentToken);
        console.log("Status:", res9.status);
        console.log("Response:", res9.data);
    }
    
    console.log("=============================================");
    console.log("SCENARIO 6: Nộp bài sau khi hết giờ");
    // We create an attempt that started in the past
    const ExpiredAttempt = mongoose.model("ExamAttempt", new mongoose.Schema({}, { strict: false }));
    const expired = await ExpiredAttempt.create({
        examId: targetExam._id,
        studentId: student._id,
        status: "IN_PROGRESS",
        startTime: new Date(Date.now() - 3600000 * 2) // 2 hours ago
    });
    let res6 = await request("POST", `/exam-attempts/${expired._id}/submit`, studentToken, { answers: [] });
    console.log("Status:", res6.status);
    console.log("Response:", res6.data);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

runTests();
