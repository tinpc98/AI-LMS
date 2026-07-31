import mongoose from "mongoose";
import { fakerVI as faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Import các Models
import { User } from "#modules/auth";
import { Class } from "#modules/class";
import { Lesson } from "#modules/lesson";
import { Assignment } from "#modules/assignment";
import { Submission } from "#modules/assignment";
import { Question } from "#modules/question";
import { Exam } from "#modules/exam";
import { ExamAttempt } from "#modules/exam-attempt";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ FATAL: Thiếu biến môi trường MONGO_URI, không thể chạy seed script.");
  process.exit(1);
}

// Tạo Model Course tạm thời (do class.model.js dùng ref: "Course")
const courseSchema = new mongoose.Schema({ title: String, code: String });
const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomItems = (arr, count) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("⚡ Đã kết nối cơ sở dữ liệu MongoDB...");

    // 1. Dọn dẹp dữ liệu cũ
    console.log("🧹 Đang dọn dẹp dữ liệu cũ...");
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Class.deleteMany({}),
      Lesson.deleteMany({}),
      Assignment.deleteMany({}),
      Submission.deleteMany({}),
      Question.deleteMany({}),
      Exam.deleteMany({}),
      ExamAttempt.deleteMany({}),
    ]);

    // Hash mật khẩu chuẩn dùng chung (123456)
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 2. Tạo 65 Users (1 Admin, 5 Teachers, 59 Students)
    console.log("👤 Đang tạo 65 Users...");
    const usersData = [];
    const adminUser = {
      fullName: "Quản trị viên (Admin)",
      email: "admin@system.com",
      password: hashedPassword,
      role: "Admin",
    };
    usersData.push(adminUser);

    for (let i = 1; i <= 5; i++) {
      usersData.push({
        fullName: `GV. ${faker.person.fullName()}`,
        email: `teacher${i}@school.edu.vn`,
        password: hashedPassword,
        role: "Teacher",
      });
    }

    for (let i = 1; i <= 59; i++) {
      usersData.push({
        fullName: faker.person.fullName(),
        email: `student${i}@student.edu.vn`,
        password: hashedPassword,
        role: "Student",
      });
    }

    const createdUsers = await User.insertMany(usersData);
    const admin = createdUsers.find((u) => u.role === "Admin");
    const teachers = createdUsers.filter((u) => u.role === "Teacher");
    const students = createdUsers.filter((u) => u.role === "Student");

    // 3. Tạo 6 Courses (Khóa học)
    console.log("📚 Đang tạo 6 Courses...");
    const coursesData = [
      { title: "Lập trình Web nâng cao", code: "WEB202" },
      { title: "Cơ sở dữ liệu NoSQL", code: "DB301" },
      { title: "Tiếng Anh chuyên ngành", code: "ENG102" },
      { title: "Trí tuệ nhân tạo", code: "AI401" },
      { title: "Phát triển ứng dụng Di động", code: "MOB201" },
      { title: "Kiểm thử phần mềm", code: "TEST302" },
    ];
    const createdCourses = await Course.insertMany(coursesData);

    // 4. Tạo 8 Classes
    console.log("🏫 Đang dọn dẹp dữ liệu và Index cũ của Classes...");

    // 🔴 Tiêu diệt tận gốc Collection cũ để xóa sạch các Index rác (như joinCode)
    try {
      await Class.collection.drop();
      console.log("✅ Đã xóa sạch bảng classes và các index cũ!");
    } catch (err) {
      if (err.code !== 26) {
        // Code 26 là collection không tồn tại, có thể bỏ qua
        console.log("Bỏ qua lỗi drop collection:", err.message);
      }
    }

    const classesData = [];
    for (let i = 1; i <= 8; i++) {
      const randomCourse = getRandomItem(createdCourses);
      let classTeacher;
      let rawStudents;

      if (i === 1) {
        classTeacher = teachers[0];
        rawStudents = students.slice(0, 15);
      } else {
        classTeacher = getRandomItem(teachers);
        rawStudents = getRandomItems(students, faker.number.int({ min: 15, max: 25 }));
      }

      const studentObjects = rawStudents.map((s) => ({
        studentId: s._id,
        status: "Enrolled",
        notes: "",
        joinedAt: new Date(),
      }));

      classesData.push({
        className: `Lớp ${randomCourse.code} - K19.${i}`,
        classCode: `CLASS_${randomCourse.code}_${1000 + i}`,
        courseId: randomCourse._id,
        teacherId: classTeacher._id,
        assignedBy: admin._id,
        assignedAt: new Date(),
        students: studentObjects,
        meetingRoomId: `ROOM_JITSI_${1000 + i}`,
        googleMeetLink: `https://meet.google.com/abc-defg-${1000 + i}`,
        googleCalendarEventId: `cal_event_${1000 + i}`,
        classRoom: `Phòng A${faker.number.int({ min: 100, max: 500 })}`,
        learningMode: getRandomItem(["Offline", "Online", "Hybrid"]),
        schedule: {
          days: ["Monday", "Wednesday", "Friday"],
          startTime: "08:00",
          endTime: "11:30",
        },
        gradingWeight: {
          attendance: 10,
          assignment: 20,
          midterm: 30,
          final: 40,
        },
        resources: [
          {
            title: "Giáo trình chính môn học",
            description: "Tài liệu học tập chính thức",
            type: "Document",
            url: "https://res.cloudinary.com/demo/image/upload/v123456/giao_trinh.pdf",
            uploadedBy: classTeacher._id,
          },
        ],
        startDate: faker.date.past(),
        endDate: faker.date.future(),
        maxStudents: 30,
        description: `Lớp học chuyên sâu môn ${randomCourse.title}`,
        isEnrollmentOpen: true,
        status: "Active",
      });
    }
    const createdClasses = await Class.insertMany(classesData);
    // 5. Tạo 40 Lessons
    console.log("📖 Đang tạo 40 Lessons...");
    const lessonsData = [];
    for (let i = 1; i <= 40; i++) {
      const cls = getRandomItem(createdClasses);
      lessonsData.push({
        title: `Bài ${((i - 1) % 5) + 1}: ${faker.company.catchPhrase()}`,
        description: faker.lorem.paragraph(),
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        attachments: [
          {
            name: `Tai_lieu_Bai_${i}.pdf`,
            url: "https://res.cloudinary.com/demo/image/upload/v123456/sample.pdf",
            publicId: `sample_${i}`,
          },
        ],
        order: ((i - 1) % 5) + 1,
        isPublished: true,
        duration: faker.number.int({ min: 30, max: 90 }),
        classId: cls._id,
        teacherId: cls.teacherId,
      });
    }
    const createdLessons = await Lesson.insertMany(lessonsData);

    // 6. Tạo 24 Assignments
    console.log("📝 Đang tạo 24 Assignments...");
    const assignmentsData = [];
    for (let i = 1; i <= 24; i++) {
      const cls = getRandomItem(createdClasses);
      const relatedLesson = createdLessons.find((l) => l.classId.equals(cls._id));

      assignmentsData.push({
        title: `Bài tập ${i}: ${faker.hacker.phrase()}`,
        description: faker.lorem.sentences(2),
        attachments: [
          {
            name: `De_bai_tap_${i}.docx`,
            url: "https://res.cloudinary.com/demo/image/upload/v123456/assignment.docx",
            publicId: `assign_${i}`,
          },
        ],
        deadline: faker.date.recent({ days: 30 }),
        classId: cls._id,
        lessonId: relatedLesson ? relatedLesson._id : null,
        teacherId: cls.teacherId,
      });
    }
    const createdAssignments = await Assignment.insertMany(assignmentsData);

    // 7. Tạo 180 Submissions
    console.log("📤 Đang tạo 180 Submissions...");
    const submissionsData = [];
    const submissionPairs = new Set();

    while (submissionsData.length < 180) {
      const assignment = getRandomItem(createdAssignments);
      const cls = createdClasses.find((c) => c._id.equals(assignment.classId));
      if (!cls || cls.students.length === 0) continue;

      // Lấy studentId từ subdocument students của lớp
      const studentItem = getRandomItem(cls.students);
      const studentId = studentItem.studentId || studentItem;
      const pairKey = `${assignment._id}_${studentId}`;

      if (!submissionPairs.has(pairKey)) {
        submissionPairs.add(pairKey);

        const isGraded = faker.datatype.boolean(0.7);
        const isLate = faker.datatype.boolean(0.2);

        submissionsData.push({
          assignmentId: assignment._id,
          studentId: studentId,
          classId: cls._id,
          content: faker.lorem.paragraph(),
          attachments: [
            {
              name: `Bai_lam_${submissionsData.length + 1}.pdf`,
              url: "https://res.cloudinary.com/demo/image/upload/v123456/student_sub.pdf",
              publicId: `sub_${submissionsData.length + 1}`,
            },
          ],
          status: isGraded ? "graded" : isLate ? "late" : "submitted",
          grade: isGraded ? faker.number.int({ min: 50, max: 100 }) : null,
          feedback: isGraded ? faker.lorem.sentence() : "",
        });
      }
    }
    await Submission.insertMany(submissionsData);

    // 8. Tạo 300 Questions
    console.log("❓ Đang tạo 300 Questions...");
    const questionsData = [];
    const topics = [
      "Grammar & Vocabulary",
      "OOP Concepts",
      "MongoDB Indexing",
      "React State Management",
      "Algorithm Complexity",
    ];

    for (let i = 1; i <= 300; i++) {
      const isMCQ = faker.datatype.boolean(0.8);
      const teacher = getRandomItem(teachers);

      questionsData.push({
        content: `Câu hỏi ${i}: ${faker.lorem.sentence()}?`,
        type: isMCQ ? "MCQ" : "ESSAY",
        options: isMCQ ? ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"] : [],
        correctAnswer: isMCQ
          ? getRandomItem(["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"])
          : "",
        difficulty: getRandomItem(["EASY", "MEDIUM", "HARD"]),
        createdBy: teacher._id,
        topic: getRandomItem(topics),
        tags: [faker.word.sample(), faker.word.sample()],
      });
    }
    const createdQuestions = await Question.insertMany(questionsData);

    // 9. Tạo 20 Exams (Mỗi đề 5 câu x 2 điểm = 10.0 điểm)
    console.log("📝 Đang tạo 20 Exams...");
    const examsData = [];
    for (let i = 1; i <= 20; i++) {
      const cls = getRandomItem(createdClasses);
      const selectedQuestions = getRandomItems(createdQuestions, 5).map((q) => ({
        questionId: q._id,
        points: 2,
      }));

      examsData.push({
        title: `Đề thi ${i}: ${cls.className}`,
        duration: getRandomItem([45, 60, 90]),
        questions: selectedQuestions,
        startTime: faker.date.recent({ days: 15 }),
        classId: cls._id,
        maxScore: 10,
        status: "PUBLISHED",
      });
    }

    const createdExams = [];
    for (const examData of examsData) {
      const examDoc = await Exam.create(examData);
      createdExams.push(examDoc);
    }

    // 10. Tạo 320 ExamAttempts (Chống gian lận)
    console.log("🚨 Đang tạo 320 ExamAttempts...");
    const attemptsData = [];
    for (let i = 1; i <= 320; i++) {
      const exam = getRandomItem(createdExams);
      const cls = createdClasses.find((c) => c._id.equals(exam.classId));
      if (!cls || cls.students.length === 0) continue;

      const studentItem = getRandomItem(cls.students);
      const studentId = studentItem.studentId || studentItem;
      const hasCheated = faker.datatype.boolean(0.15);

      const cheatLogs = [];
      let cheatCount = 0;

      if (hasCheated) {
        cheatCount = faker.number.int({ min: 1, max: 4 });
        const cheatTypes = ["TAB_SWITCH", "FULLSCREEN_EXIT", "COPY_PASTE", "MULTIPLE_FACES"];
        for (let c = 0; c < cheatCount; c++) {
          cheatLogs.push({
            cheatType: getRandomItem(cheatTypes),
            timestamp: faker.date.recent({ days: 1 }),
          });
        }
      }

      const studentAnswers = exam.questions.map((q) => ({
        questionId: q.questionId,
        selectedOption: getRandomItem(["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"]),
        essayText: faker.lorem.sentence(),
        pointsEarned: faker.number.float({ min: 0, max: 2, fractionDigits: 1 }),
      }));

      const totalScore = studentAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);

      attemptsData.push({
        examId: exam._id,
        studentId: studentId,
        status: getRandomItem(["SUBMITTED", "GRADED"]),
        answers: studentAnswers,
        totalScore: parseFloat(totalScore.toFixed(2)),
        startTime: faker.date.recent({ days: 2 }),
        endTime: faker.date.recent({ days: 1 }),
        cheatCount: cheatCount,
        cheatLogs: cheatLogs,
        cheatWarnings: cheatCount,
      });
    }
    await ExamAttempt.insertMany(attemptsData);

    console.log("\n🎉 KHỞI TẠO DỮ LIỆU THÀNH CÔNG!");
    console.log("-----------------------------------------");
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Courses: ${createdCourses.length}`);
    console.log(`- Classes: ${createdClasses.length}`);
    console.log(`- Lessons: ${createdLessons.length}`);
    console.log(`- Assignments: ${createdAssignments.length}`);
    console.log(`- Submissions: ${submissionsData.length}`);
    console.log(`- Questions: ${createdQuestions.length}`);
    console.log(`- Exams: ${createdExams.length}`);
    console.log(`- ExamAttempts: ${attemptsData.length}`);
    console.log("-----------------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Lỗi khi khởi tạo dữ liệu:", error);
    process.exit(1);
  }
}

seedDatabase();
