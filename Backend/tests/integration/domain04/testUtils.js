import mongoose from "mongoose";
import { User } from "#modules/auth";
import { Class } from "#modules/class";
import ClassSession from "../../../src/modules/classSession/classSession.model.js";
import ClassEnrollment from "../../../src/modules/classEnrollment/classEnrollment.model.js";
import { Attendance } from "#modules/attendance";
import { Course } from "#modules/course";
import { Enrollment } from "../../../src/modules/enrollment/index.js";

const workerId = process.env.VITEST_WORKER_ID || Math.random().toString(36).substring(7);
const TEST_URI = process.env.MONGO_TEST_URI || `mongodb://127.0.0.1:27017/ai_lms_test_domain04_${workerId}`;

// Mock Mongoose transactions for standalone test DB
const originalStartSession = mongoose.startSession.bind(mongoose);
mongoose.startSession = async function (options) {
  const session = await originalStartSession(options);
  session.startTransaction = () => {};
  session.commitTransaction = async () => {};
  session.abortTransaction = async () => {};
  return session;
};

export async function connectDB() {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(TEST_URI);
  }
}

export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
}

export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
}

export async function syncAllIndexes() {
  await User.syncIndexes();
  await Course.syncIndexes();
  await Class.syncIndexes();
  await Enrollment.syncIndexes();
  await ClassSession.syncIndexes();
  await ClassEnrollment.syncIndexes();
  await Attendance.syncIndexes();
}

export async function seedBaseData() {
  // Create Users
  const [ADMIN, TEACHER_A, TEACHER_B, STUDENT_A, STUDENT_B, STUDENT_C] = await User.insertMany([
    { email: "admin@test.com", role: "Admin", fullName: "Admin", password: "pwd" },
    { email: "teacherA@test.com", role: "Teacher", fullName: "Teacher A", password: "pwd" },
    { email: "teacherB@test.com", role: "Teacher", fullName: "Teacher B", password: "pwd" },
    { email: "studentA@test.com", role: "Student", fullName: "Student A", password: "pwd" },
    { email: "studentB@test.com", role: "Student", fullName: "Student B", password: "pwd" },
    { email: "studentC@test.com", role: "Student", fullName: "Student C", password: "pwd" },
  ]);

  // Create Course
  const [COURSE_MAIN] = await Course.insertMany([
    {
      title: "Main Course",
      name: "Main Course",
      description: "Test Course",
      price: 1000,
      status: "PUBLISHED",
      teacherId: TEACHER_A._id,
      createdBy: ADMIN._id,
      duration: { value: 10, unit: "WEEK" },
      level: "FOUNDATION",
      subjectId: new mongoose.Types.ObjectId(),
      code: "C101",
      isDeleted: false
    }
  ]);

  // Create Classes
  const [CLASS_ONLINE, CLASS_OFFLINE, CLASS_B] = await Class.insertMany([
    {
      name: "Online Class",
      code: "C_ON_" + workerId,
      courseId: COURSE_MAIN._id,
      teacherId: TEACHER_A._id,
      mode: "ONLINE",
      capacity: 30,
      activeCount: 0,
      status: "OPEN",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 30),
      isDeleted: false,
    },
    {
      name: "Offline Class",
      code: "C_OFF_" + workerId,
      courseId: COURSE_MAIN._id,
      teacherId: TEACHER_A._id,
      mode: "OFFLINE",
      capacity: 30,
      activeCount: 0,
      status: "OPEN",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 30),
      isDeleted: false,
    },
    {
      name: "Class B",
      code: "C_B_" + workerId,
      courseId: COURSE_MAIN._id,
      teacherId: TEACHER_B._id,
      mode: "ONLINE",
      capacity: 30,
      activeCount: 0,
      status: "OPEN",
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 30),
      isDeleted: false,
    }
  ]);

  // Create Enrollments (Approved)
  const [ENROLLMENT_A, ENROLLMENT_B, ENROLLMENT_C] = await Enrollment.insertMany([
    { studentId: STUDENT_A._id, courseId: COURSE_MAIN._id, status: "APPROVED", amount: 1000 },
    { studentId: STUDENT_B._id, courseId: COURSE_MAIN._id, status: "APPROVED", amount: 1000 },
    { studentId: STUDENT_C._id, courseId: COURSE_MAIN._id, status: "APPROVED", amount: 1000 },
  ]);

  return {
    users: { ADMIN, TEACHER_A, TEACHER_B, STUDENT_A, STUDENT_B, STUDENT_C },
    courses: { COURSE_MAIN },
    classes: { CLASS_ONLINE, CLASS_OFFLINE, CLASS_B },
    enrollments: { ENROLLMENT_A, ENROLLMENT_B, ENROLLMENT_C },
  };
}
