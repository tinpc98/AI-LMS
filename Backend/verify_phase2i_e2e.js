import fetch from "node-fetch";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const BASE_URL = "http://localhost:5000/api";
let adminToken = "";
let teacherToken = "";
let teacher2Token = "";
let testClassId = "";

async function setupData() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/eduspace_thpt";
  await mongoose.connect(uri);
  const db = mongoose.connection;
  const passwordHash = await bcrypt.hash("password123", 10);
  
    const adminRes = await db.collection("users").findOneAndUpdate(
      { email: "admin_2i@test.com" },
      { $set: {
          fullName: "Admin 2I",
          email: "admin_2i@test.com",
          password: passwordHash,
          role: "Admin",
          status: "Active",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        } 
      },
      { upsert: true, returnDocument: "after" }
    );
    let admin = adminRes;
  
    // Create Teacher 1
    const t1Res = await db.collection("users").findOneAndUpdate(
      { email: "teacher1_2i@test.com" },
      { $set: {
          fullName: "Teacher 1 2I",
          email: "teacher1_2i@test.com",
          password: passwordHash,
          role: "Teacher",
          status: "Active",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true, returnDocument: "after" }
    );
    let teacher1 = t1Res;
  
    // Create Teacher 2
    const t2Res = await db.collection("users").findOneAndUpdate(
      { email: "teacher2_2i@test.com" },
      { $set: {
          fullName: "Teacher 2 2I",
          email: "teacher2_2i@test.com",
          password: passwordHash,
          role: "Teacher",
          status: "Active",
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true, returnDocument: "after" }
    );
    let teacher2 = t2Res;
  
    // Create Class for Teacher 1
    const classRes = await db.collection("classes").findOneAndUpdate(
      { classCode: "CLASS_2I_TEST" },
      { $set: {
          className: "Class 2I Test",
          classCode: "CLASS_2I_TEST",
          teacherId: teacher1._id,
          capacity: 30,
          status: "OPEN",
          isDeleted: false,
          startDate: new Date(),
          endDate: new Date(Date.now() + 86400000 * 30),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      { upsert: true, returnDocument: "after" }
    );
    let testClass = classRes;
    testClassId = testClass._id.toString();
}

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (res.status !== 200) throw new Error(`Login failed for ${email}`);
  return { token: data.accessToken, id: data.data.id };
}

async function run() {
  console.log("=== BẮT ĐẦU TEST PHASE 2I: DASHBOARD & ANALYTICS ===");
  try {
    console.log("Đang setup dữ liệu...");
    await setupData();
    console.log("✅ Setup dữ liệu thành công.");
    console.log(`✅ Class ID: ${testClassId}`);

    // Đăng nhập
    const adminData = await login("admin_2i@test.com", "password123");
    adminToken = adminData.token;
    
    const teacherData = await login("teacher1_2i@test.com", "password123");
    teacherToken = teacherData.token;
    
    const teacher2Data = await login("teacher2_2i@test.com", "password123");
    teacher2Token = teacher2Data.token;

    // TEST 1: Admin Dashboard returns real metrics & Financials
    console.log("--- TEST 1: ADMIN DASHBOARD METRICS & FINANCIALS ---");
    const adminDash = await fetch(`${BASE_URL}/dashboard/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminDashData = await adminDash.json();
    if (adminDashData.success && adminDashData.data.revenue !== undefined && adminDashData.data.payroll !== undefined) {
      console.log(`✅ [PASS] Admin Dashboard lấy thành công doanh thu (${adminDashData.data.revenue} VND) và lương (${adminDashData.data.payroll} VND).`);
    } else {
      console.error(adminDashData);
      throw new Error("Admin Dashboard thiếu Financial data.");
    }

    // TEST 2: Teacher Analytics - Own Class (200 OK)
    console.log("--- TEST 2: TEACHER ANALYTICS (OWN CLASS) ---");
    const teacherDash = await fetch(`${BASE_URL}/analytics/teacher/dashboard/${testClassId}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    if (teacherDash.status === 200) {
      const data = await teacherDash.json();
      console.log(`✅ [PASS] Teacher 1 xem thống kê lớp của mình thành công. Điểm TB thi: ${data.data?.overview?.examAvgScore}`);
    } else {
      const errorData = await teacherDash.json();
      console.error(errorData);
      throw new Error(`Teacher không thể xem thống kê lớp của mình. HTTP Status: ${teacherDash.status}`);
    }

    // TEST 3: Teacher Analytics - IDOR Prevention (403 Forbidden)
    console.log("--- TEST 3: TEACHER ANALYTICS (IDOR PREVENTION) ---");
    const teacher2Dash = await fetch(`${BASE_URL}/analytics/teacher/dashboard/${testClassId}`, {
      headers: { Authorization: `Bearer ${teacher2Token}` }
    });
    if (teacher2Dash.status === 403 || teacher2Dash.status === 404) {
      console.log(`✅ [PASS] Teacher 2 bị cấm xem thống kê lớp của Teacher 1 (HTTP ${teacher2Dash.status}).`);
    } else {
      throw new Error(`Bảo mật IDOR thất bại. HTTP Status: ${teacher2Dash.status}`);
    }

    // TEST 4: Date Boundary Check (Kiểm tra format biểu đồ đăng ký)
    console.log("--- TEST 4: ADMIN DASHBOARD CHART BOUNDARIES ---");
    if (adminDashData.data.studentRegistrationChart.length === 12) {
      console.log("✅ [PASS] Biểu đồ đăng ký trả về đúng 12 tháng (Boundary timezone UTC hoạt động).");
    } else {
      throw new Error("Biểu đồ đăng ký sai số lượng tháng.");
    }

    console.log("=== TẤT CẢ E2E TESTS CHO PHASE 2I PASSED! ===");
  } catch (err) {
    console.error("❌ E2E TEST FAILED:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
