import mongoose from "mongoose";
import { generateLiveSessionRoomName } from "./liveSessionHelper.js";

function runLiveSessionHelperTests() {
  console.log("🧪 Bắt đầu chạy Unit Tests cho LiveSession Helper (Sprint J1)...");
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  };

  // Test 1: ClassId & SessionId ObjectId hợp lệ -> Output format lms_<classId>_<sessionId>
  try {
    const classId = new mongoose.Types.ObjectId("6794d21e87d15a9907f10001");
    const sessionId = new mongoose.Types.ObjectId("6794e80f98e26b1108a20045");
    const roomName = generateLiveSessionRoomName(classId, sessionId);
    assert(
      roomName === "lms_6794d21e87d15a9907f10001_6794e80f98e26b1108a20045",
      "Sinh roomName đúng định dạng lms_<classId>_<sessionId>"
    );
  } catch (e) {
    assert(false, `Test 1 ném lỗi không mong muốn: ${e.message}`);
  }

  // Test 2: Input là string ObjectId -> Output đúng format
  try {
    const classIdStr = "6794d21e87d15a9907f10002";
    const sessionIdStr = "6794e80f98e26b1108a20046";
    const roomName = generateLiveSessionRoomName(classIdStr, sessionIdStr);
    assert(
      roomName === "lms_6794d21e87d15a9907f10002_6794e80f98e26b1108a20046",
      "Sinh roomName từ String ObjectId hợp lệ"
    );
  } catch (e) {
    assert(false, `Test 2 ném lỗi không mong muốn: ${e.message}`);
  }

  // Test 3: Cùng Input cho ra Cùng Output (Determinism & Stability)
  try {
    const classId = "6794d21e87d15a9907f10003";
    const sessionId = "6794e80f98e26b1108a20047";
    const room1 = generateLiveSessionRoomName(classId, sessionId);
    const room2 = generateLiveSessionRoomName(classId, sessionId);
    assert(room1 === room2, "Cùng Input sinh ra cùng roomName");
  } catch (e) {
    assert(false, `Test 3 ném lỗi: ${e.message}`);
  }

  // Test 4: roomName không chứa khoảng trắng hay ký tự đặc biệt
  try {
    const classId = "6794d21e87d15a9907f10004";
    const sessionId = "6794e80f98e26b1108a20048";
    const roomName = generateLiveSessionRoomName(classId, sessionId);
    const isValidASCII = /^[a-zA-Z0-9_]+$/.test(roomName);
    assert(isValidASCII, "roomName chỉ chứa ký tự ASCII hợp lệ (chữ, số, gạch dưới)");
  } catch (e) {
    assert(false, `Test 4 ném lỗi: ${e.message}`);
  }

  // Test 5: ObjectId không hợp lệ -> Ném lỗi rõ ràng
  try {
    let threwError = false;
    try {
      generateLiveSessionRoomName("invalid_id", "6794e80f98e26b1108a20048");
    } catch (err) {
      threwError = true;
    }
    assert(threwError, "Ném lỗi khi classId không phải ObjectId hợp lệ");
  } catch (e) {
    assert(false, `Test 5 ném lỗi: ${e.message}`);
  }

  console.log(`\n📊 LiveSession Helper Test Summary: ${passed} PASSED, ${failed} FAILED\n`);
  if (failed > 0) process.exit(1);
}

runLiveSessionHelperTests();
