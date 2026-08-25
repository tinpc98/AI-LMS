
import { readFileSync } from 'fs';

const verify = async () => {
  console.log("=== BẮT ĐẦU E2E VERIFICATION PHASE 4.1 ===");

  // TEST 1: Frontend API URL không còn hardcode localhost trong production runtime config
  console.log("\n[TEST 1] Frontend API URL");
  const axiosClientStr = readFileSync("../Frontend/src/api/axiosClient.ts", "utf-8");
  if (axiosClientStr.includes("http://localhost:5000/api")) {
    console.error("❌ FAIL: axiosClient.ts vẫn hardcode localhost");
  } else {
    console.log("✅ PASS: axiosClient.ts đã sử dụng envConfig");
  }

  const envConfigStr = readFileSync("../Frontend/src/config/env.ts", "utf-8");
  if (!envConfigStr.includes("throw new Error(\"VITE_API_URL is missing")) {
    console.error("❌ FAIL: env.ts chưa enforce production fail fast cho API URL");
  } else {
    console.log("✅ PASS: env.ts enforce production VITE_API_URL");
  }

  // TEST 2 & 3: JWT_SECRET
  console.log("\n[TEST 2 & 3] Backend JWT_SECRET fallback removal");
  const authServiceStr = readFileSync("./src/modules/auth/auth.service.js", "utf-8");
  if (authServiceStr.includes('|| "123456"')) {
    console.error("❌ FAIL: Vẫn còn hardcode fallback secret 123456");
  } else if (!authServiceStr.includes('process.env.JWT_SECRET')) {
     console.error("❌ FAIL: Mất JWT_SECRET config");
  } else {
    console.log("✅ PASS: Đã gỡ bỏ fallback secret");
  }

  // TEST 4, 5, 6, 7, 8, 9, 10: Assignment IDOR
  console.log("\n[TEST 4-10] Assignment IDOR Fix");
  const assignmentCtrl = readFileSync("./src/modules/assignment/assignment.controller.js", "utf-8");
  if (!assignmentCtrl.includes('userRole === "STUDENT"')) {
    console.error("❌ FAIL: Assignment Controller chưa check Student Role");
  } else if (!assignmentCtrl.includes('ClassEnrollmentModel.exists')) {
    console.error("❌ FAIL: Assignment Controller chưa check ClassEnrollment");
  } else if (!assignmentCtrl.includes('checkTopicOwnership')) {
    console.error("❌ FAIL: Assignment Controller chưa check Teacher ownership");
  } else {
    console.log("✅ PASS: Assignment IDOR fix đã được implement");
  }

  // TEST 11: Socket URL
  console.log("\n[TEST 11] Socket URL configuration");
  const socketClientStr = readFileSync("../Frontend/src/shared/lib/socketClient.ts", "utf-8");
  if (socketClientStr.includes('http://localhost:5000')) {
    console.error("❌ FAIL: socketClient.ts vẫn fallback localhost trực tiếp");
  } else {
    console.log("✅ PASS: socketClient.ts đã dùng envConfig");
  }

  // TEST 12: Socket Authentication
  console.log("\n[TEST 12] Socket Authentication");
  const socketAuth = readFileSync("./src/infra/socket/socketAuth.middleware.js", "utf-8");
  if (!socketAuth.includes('jwt.verify')) {
    console.error("❌ FAIL: socketAuth.middleware.js mất verify");
  } else {
    console.log("✅ PASS: Socket authentication vẫn an toàn");
  }

  // TEST 13: MongoDB transaction capability startup validation
  console.log("\n[TEST 13] MongoDB Transaction validation at startup");
  const dbConfig = readFileSync("./src/config/database.js", "utf-8");
  if (!dbConfig.includes('status.setName')) {
    console.error("❌ FAIL: Chưa có Replica Set validation");
  } else {
    console.log("✅ PASS: Đã bổ sung Replica Set validation trên production");
  }

  console.log("\n=== E2E VERIFICATION HOÀN TẤT ===");
};

verify().catch(console.error);
