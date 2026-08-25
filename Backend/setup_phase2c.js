import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import PaymentConfig from './src/modules/payment/paymentConfig.model.js';
import Course from './src/modules/course/course.model.js';
import Class from './src/modules/class/class.model.js';
import User from './src/modules/auth/user.model.js';

async function setup() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", mongoose.connection.name);
  
  // 1. Payment Config
  let config = await PaymentConfig.findOne();
  if (!config) {
    config = await PaymentConfig.create({
      bankName: "Vietcombank",
      accountNumber: "1234567890",
      accountName: "EDUSPACE THPT",
      transferPrefix: "EDUPAY",
      isActive: true
    });
    console.log("Created PaymentConfig:", config._id);
  } else {
    console.log("PaymentConfig exists:", config._id);
  }

  let existingStudent = await User.findOne({ role: 'student' });
  if (!existingStudent) {
     existingStudent = await User.findOne({ email: 'student1@example.com' });
  }
  console.log("Student for testing:", existingStudent?.email, existingStudent?._id);

  // 3. Course
  let course = await Course.findOne();
  if (!course) {
    course = await Course.create({
      name: "Khóa học Toán 10 Phase 2C",
      code: "MATH10-P2C",
      subject: "Toán",
      grade: 10,
      pricing: { tuitionFee: 1500000 },
      status: "Active"
    });
    console.log("Created Course:", course._id);
  } else {
    console.log("Course exists:", course.name, course._id);
  }

  // 4. Class (OPEN)
  let cls = await Class.findOne({ courseId: course._id, status: 'OPEN' });
  if (!cls) {
    cls = await Class.create({
      name: "Lớp Toán 10 - T1",
      code: "MATH10-T1-" + Date.now().toString().slice(-4),
      courseId: course._id,
      level: "FOUNDATION",
      capacity: 30,
      activeCount: 0,
      status: "OPEN",
      isEnrollmentOpen: true,
      teacherId: null,
    });
    console.log("Created Class:", cls.code, cls._id);
  } else {
    console.log("Class exists:", cls.code, cls._id);
  }

  await mongoose.disconnect();
}

setup().catch(console.error);
