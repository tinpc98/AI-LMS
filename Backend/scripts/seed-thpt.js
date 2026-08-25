import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

import { User } from "#modules/auth";
import { Class } from "#modules/class";
import { Lesson, LessonProgress } from "#modules/lesson";
import { Assignment } from "#modules/assignment";
import { LiveSession } from "#modules/live-session";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ai-lms";

// Tạo Model Course tạm thời (do class.model.js dùng ref: "Course")
const courseSchema = new mongoose.Schema({
  courseName: String,
  subject: String,
  code: String,
  title: String,
  grade: { type: Number, default: 12 },
  status: { type: String, default: "Published" },
  description: String,
});
const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

async function seedTHPT() {
  try {
    console.log("🔄 Đang kết nối tới database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Đã kết nối MongoDB thành công!");

    // ==========================================
    // BƯỚC 1: XÓA DỮ LIỆU CŨ ĐỂ SEED LẠI TRƠN TRU
    // ==========================================
    console.log("🗑️ Đang xóa dữ liệu THPT cũ...");
    await User.deleteMany({ email: { $in: ["admin@lms.edu.vn", "toan@lms.edu.vn", "khoia@lms.edu.vn"] } });
    await Class.deleteMany({ className: "Luyện thi Toán 12 - Khối A" });
    await Course.deleteMany({ code: "THPT_TOAN_12" });
    await Lesson.deleteMany({ title: "Ứng dụng Đạo hàm & Khảo sát hàm số" });
    
    // ==========================================
    // BƯỚC 2: KHỞI TẠO TÀI KHOẢN (USERS)
    // ==========================================
    console.log("👤 Đang tạo tài khoản Admin, Giáo viên, Học sinh...");
    const hashedPassword = await bcrypt.hash("password123", 10);

    const admin = await User.create({
      fullName: "Quản trị viên",
      email: "admin@lms.edu.vn",
      password: hashedPassword,
      role: "Admin",
      status: "Active"
    });

    const teacher = await User.create({
      fullName: "Thầy Trần Văn Toán",
      email: "toan@lms.edu.vn",
      password: hashedPassword,
      role: "Teacher",
      status: "Active"
    });

    const student = await User.create({
      fullName: "Nguyễn Khối A",
      email: "khoia@lms.edu.vn",
      password: hashedPassword,
      role: "Student",
      status: "Active"
    });
    console.log("✅ Tạo tài khoản thành công!");

    // ==========================================
    // BƯỚC 3: CẬP NHẬT SCHEMA & TẠO LỚP HỌC
    // ==========================================
    console.log("🏫 Đang tạo Khóa học & Lớp học THPT...");
    
    // Tạo Course trước vì Class yêu cầu courseId
    const course = await Course.create({
      courseName: "Toán học 12",
      subject: "Toán học",
      code: "THPT_TOAN_12",
      title: "Luyện thi THPT Quốc gia môn Toán",
      grade: 12,
      status: "Published",
      description: "Khóa học tổng ôn Toán học 12."
    });

    const thptClass = await Class.create({
      className: "Luyện thi Toán 12 - Khối A",
      classCode: "TOAN12_A_2026",
      courseId: course._id,
      teacherId: teacher._id,
      assignedBy: admin._id,
      assignedBy: admin._id,
      assignedAt: new Date(),
      activeCount: 1,
      learningMode: "Hybrid", // Cập nhật Enum Format
      status: "Ongoing"
    });
    console.log(`✅ Đã tạo lớp học: ${thptClass.className} (Mode: ${thptClass.learningMode})`);

    // Bổ sung ClassEnrollment
    const ClassEnrollment = mongoose.models.ClassEnrollment || mongoose.model(
      "ClassEnrollment",
      new mongoose.Schema({
        enrollmentId: mongoose.Schema.Types.ObjectId,
        studentId: mongoose.Schema.Types.ObjectId,
        classId: mongoose.Schema.Types.ObjectId,
        status: String,
        createdBy: mongoose.Schema.Types.ObjectId,
      }, { collection: "classenrollments" })
    );

    await ClassEnrollment.deleteMany({ classId: thptClass._id });
    await ClassEnrollment.create({
      enrollmentId: new mongoose.Types.ObjectId(),
      studentId: student._id,
      classId: thptClass._id,
      status: "ACTIVE",
      createdBy: admin._id
    });
    console.log(`✅ Đã tạo ClassEnrollment cho học sinh ${student.fullName}`);

    // Xóa các dữ liệu phụ thuộc của lớp này (nếu có do seed trước)
    await LessonProgress.deleteMany({ classId: thptClass._id });
    await Assignment.deleteMany({ classId: thptClass._id });
    await LiveSession.deleteMany({ classId: thptClass._id });

    // ==========================================
    // BƯỚC 4: TẠO DỮ LIỆU LỘ TRÌNH (LESSONS)
    // ==========================================
    console.log("📚 Đang tạo bài học và tiến độ học tập...");
    const lesson = await Lesson.create({
      classId: thptClass._id,
      teacherId: teacher._id,
      title: "Ứng dụng Đạo hàm & Khảo sát hàm số",
      description: "Chuyên đề quan trọng nhất trong đề thi THPT QG.",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      order: 1,
      isPublished: true,
      duration: 120
    });

    await LessonProgress.create({
      studentId: student._id,
      lessonId: lesson._id,
      classId: thptClass._id,
      completed: false,
      progress: 68,
      masteryPercentage: 68,             // Trường giả định theo yêu cầu
      weaknessPoint: "Tìm m để hàm số đồng biến" // Trường giả định theo yêu cầu
    });
    console.log(`✅ Đã tạo bài học: ${lesson.title}`);

    // ==========================================
    // BƯỚC 5: TẠO BÀI TẬP & ĐIỂM DANH (VIRTUAL SESSION)
    // ==========================================
    console.log("📝 Đang tạo bài tập và phiên học ảo (Virtual Session)...");
    
    const tomorrow = new Date();
    tomorrow.setHours(tomorrow.getHours() + 12);
    
    const past2Days = new Date();
    past2Days.setDate(past2Days.getDate() - 2);

    await Assignment.insertMany([
      {
        title: "BTVN: Cực trị hàm số (Còn 12 giờ)",
        description: "Làm 50 câu trắc nghiệm cực trị.",
        deadline: tomorrow,
        status: "published",
        classId: thptClass._id,
        lessonId: lesson._id,
        teacherId: teacher._id
      },
      {
        title: "BTVN: Sự đồng biến, nghịch biến (Đã quá hạn 2 ngày)",
        description: "Làm 50 câu trắc nghiệm cơ bản.",
        deadline: past2Days,
        status: "published",
        classId: thptClass._id,
        lessonId: lesson._id,
        teacherId: teacher._id
      }
    ]);

    // Tạo Virtual Session cho hôm nay
    const todayStart = new Date();
    todayStart.setMinutes(todayStart.getMinutes() - 15); // Bắt đầu cách đây 15p
    const todayEnd = new Date();
    todayEnd.setHours(todayEnd.getHours() + 2); // Kéo dài 2 tiếng

    await LiveSession.create({
      classId: thptClass._id,
      title: "Chữa đề thi thử lần 1",
      sessionNumber: 1,
      roomName: `room_thpt_toan_12_${Date.now()}`,
      createdBy: teacher._id,
      scheduledStart: todayStart,
      scheduledEnd: todayEnd,
      status: "Scheduled"
    });

    console.log("✅ Đã tạo 2 Bài tập và 1 Buổi học ảo (hôm nay)!");
    console.log("🎉 SEED DỮ LIỆU THPT THÀNH CÔNG!");

  } catch (error) {
    console.error("❌ Lỗi seed dữ liệu:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã đóng kết nối database.");
    process.exit(0);
  }
}

seedTHPT();
