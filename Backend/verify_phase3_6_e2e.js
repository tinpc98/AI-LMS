import mongoose from "mongoose";

const BASE_URL = "http://localhost:5000/api";
let adminToken = "";
let studentToken = "";

async function login(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  console.log("Login data:", data);
  return data?.data?.token || "";
}

async function runTests() {
  console.log("=== BẮT ĐẦU E2E ERROR CONTRACT TEST ===");

  try {
    adminToken = await login("admin1@gmail.com", "123456");
    studentToken = await login("student1@gmail.com", "123456");

    console.log("✅ Đăng nhập thành công\n");

    // 1. Missing Token
    const res1 = await fetch(`${BASE_URL}/auth/me`);
    const data1 = await res1.json().catch(() => ({}));
    console.log(`[Test 1] Missing token: Status ${res1.status}`);

    // 2. Invalid Token
    const res2 = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: "Bearer INVALID_TOKEN" },
    });
    const data2 = await res2.json().catch(() => ({}));
    console.log(`[Test 2] Invalid token: Status ${res2.status}`);

    // 4. Student -> Admin endpoint (RBAC)
    const res4 = await fetch(`${BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const data4 = await res4.json().catch(() => ({}));
    console.log(`[Test 4] Student access Admin API: Status ${res4.status} - Code: ${data4?.code || data4?.errorCode}`);

    // 7. Invalid ObjectId
    const res7 = await fetch(`${BASE_URL}/classes/not-an-object-id`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data7 = await res7.json().catch(() => ({}));
    console.log(`[Test 7] Invalid ObjectId: Status ${res7.status} - Code: ${data7?.code || data7?.errorCode}`);

    // 9. Missing required field (Course Creation)
    const res9 = await fetch(`${BASE_URL}/courses`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ description: "No title" }),
    });
    const data9 = await res9.json().catch(() => ({}));
    console.log(`[Test 9] Missing required field: Status ${res9.status} - Code: ${data9?.code || data9?.errorCode}`);

    // 13. Missing resource
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res13 = await fetch(`${BASE_URL}/classes/${fakeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data13 = await res13.json().catch(() => ({}));
    console.log(`[Test 13] Missing resource: Status ${res13.status} - Code: ${data13?.code || data13?.errorCode}`);

    // 21. Invalid pagination
    const res21 = await fetch(`${BASE_URL}/classes?page=-1&limit=abc`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data21 = await res21.json().catch(() => ({}));
    console.log(`[Test 21] Invalid pagination (-1, abc): Status ${res21.status} - Code: ${data21?.code || data21?.errorCode}`);

    console.log("\n=== HOÀN TẤT TEST ===");
  } catch (error) {
    console.error("Test execution failed:", error.message);
  }
}

runTests();
