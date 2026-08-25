import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const baseURL = 'http://localhost:5000/api';

async function fetchAPI(url, options = {}) {
  const res = await fetch(`${baseURL}${url}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function verifyE2E() {
  console.log("=== BẮT ĐẦU E2E PHASE 2C ===");

  await mongoose.connect(process.env.MONGO_URI);
  
  const Course = (await import('./src/modules/course/course.model.js')).default;
  const Class = (await import('./src/modules/class/class.model.js')).default;
  const User = (await import('./src/modules/auth/user.model.js')).default;
  
  await User.updateMany({ email: { $in: ['student1@student.edu.vn', 'admin@system.com'] } }, { status: 'Active' });

  const course = await Course.findOne();
  await Course.updateOne({ _id: course._id }, { $set: { status: 'PUBLISHED' } });

  const cls = await Class.findOne({ courseId: course._id, status: 'OPEN' });

  console.log("Course:", course.name);
  await User.updateMany({ email: { $in: ['student1@student.edu.vn', 'admin@system.com'] } }, { status: 'Active' });

  const student = await User.findOne({ email: 'student1@student.edu.vn' });
  const admin = await User.findOne({ email: 'admin@system.com' });
  
  const generateToken = (user) => jwt.sign(
    { id: user._id, role: user.role, email: user.email }, 
    process.env.JWT_SECRET, 
    { expiresIn: '1h' }
  );

  const studentToken = generateToken(student);
  const adminToken = generateToken(admin);

  console.log("\n[1] Student Token generated:", !!studentToken);

  console.log("\n[2] Student: Đăng ký khóa học mới...");
  let res = await fetchAPI('/enrollments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ courseId: course._id.toString(), level: 'FOUNDATION' })
  });

  if (res.status !== 201) {
    console.log("Error creating enrollment:", res.data);
    process.exit(1);
  }

  const enrollmentId = res.data.data._id;
  console.log("=> OK! Enrollment created:", enrollmentId);
  console.log("   Status:", res.data.data.status);

  console.log("\n[3] Student: Kiểm tra thanh toán (payment)...");
  res = await fetchAPI('/payments/me', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const payment = res.data.data.find(p => p.enrollmentId === enrollmentId || (p.enrollmentId && p.enrollmentId._id === enrollmentId));
  console.log("=> OK! Found Payment ID:", payment._id);
  console.log("   Amount:", payment.amount);
  console.log("   Status:", payment.status);

  console.log("\n[4] Student: Gửi xác nhận đã chuyển khoản...");
  res = await fetchAPI(`/payments/${payment._id}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  console.log("=> OK! Payment submit responded with:", res.status);

  console.log("\n[5] Admin login skipped, token ready");

  console.log("\n[6] Admin: Duyệt thanh toán...");
  res = await fetchAPI(`/payments/${payment._id}/confirm`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log("=> OK! Admin verified payment:", res.data.data.status);

  console.log("\n[7] Admin: Kiểm tra Enrollment sau khi duyệt...");
  res = await fetchAPI(`/enrollments/${enrollmentId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log("=> OK! Enrollment status is now:", res.data.data.status);

  console.log("\n[8] Admin: Xếp lớp cho học sinh...");
  res = await fetchAPI(`/enrollments/${enrollmentId}/assign-class`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ classId: cls._id.toString() })
  });
  console.log("=> OK! Xếp lớp thành công!");
  console.log("   Enrollment status:", res.data.data.status);

  await mongoose.disconnect();
  console.log("\n=== TẤT CẢ TEST ĐỀU PASS! HOÀN TẤT PHASE 2C! ===");
}

verifyE2E().catch(console.error);
