import mongoose from "mongoose";
import * as teacherAttendanceController from "./src/modules/teacherAttendance/teacherAttendance.controller.js";
import TeacherAttendance from "./src/modules/teacherAttendance/teacherAttendance.model.js";
import ClassSession from "./src/modules/classSession/classSession.model.js";
import { Class } from "./src/modules/class/index.js";
import { User } from "./src/modules/auth/index.js";
import * as classSessionService from "./src/modules/classSession/classSession.service.js";

async function runTests() {
  console.log("==================================================");
  console.log("TEST 1 — DATA GENERATION");
  console.log("==================================================");
  
  await mongoose.connect('mongodb://127.0.0.1:27017/eduspace_thpt');
  console.log("Connected to MongoDB.");

  // Find a class with teacherId
  let testClass = await Class.findOne({ teacherId: { $ne: null }, status: { $ne: 'DRAFT' } }).populate('teacherId');
  if (!testClass) {
      console.log("No valid class found. Creating one...");
      const teacher = await User.findOne({ role: 'Teacher' });
      const course = await mongoose.connection.db.collection('courses').findOne();
      testClass = await Class.create({
          name: "Test Class Phase 2A",
          code: "TCP2A",
          courseId: course._id,
          teacherId: teacher._id,
          level: "FOUNDATION",
          capacity: 20,
          status: "OPEN",
          schedule: { days: ["Monday"], startTime: "18:00", endTime: "20:00" },
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
  }

  // Generate sessions if not generated
  let sessions = await ClassSession.find({ classId: testClass._id });
  if (sessions.length === 0) {
      console.log("Generating sessions for class...");
      await classSessionService.default.generateSessions(testClass._id.toString());
      sessions = await ClassSession.find({ classId: testClass._id });
  }

  let attendances = await TeacherAttendance.find({ sessionId: { $in: sessions.map(s => s._id) } });
  
  console.log(`ClassSession count: ${sessions.length}`);
  console.log(`TeacherAttendance count: ${attendances.length}`);
  const test1Status = sessions.length > 0 && attendances.length > 0 ? "PASS" : "FAIL (DATA GAP)";
  console.log(`Test 1 Status: ${test1Status}`);


  console.log("\n==================================================");
  console.log("TEST 2 — TEACHER OWNERSHIP & TEST 3 — POPULATED SESSION CONTRACT");
  console.log("==================================================");
  
  const teacherId = testClass.teacherId._id || testClass.teacherId;
  const reqGet = {
      user: { id: teacherId, _id: teacherId, role: "teacher" },
      query: { page: 1, limit: 10 }
  };
  let getResponse = null;
  const resGet = {
      status: function(c) { this.statusCode = c; return this; },
      json: function(d) { getResponse = { status: this.statusCode, data: d }; return this; }
  };
  
  await teacherAttendanceController.getMyAttendance(reqGet, resGet);
  
  console.log(`HTTP Status: ${getResponse.status}`);
  console.log(`Data length: ${getResponse.data.data.length}`);
  console.log(`Total items: ${getResponse.data.pagination.totalItems}`);
  
  let test2Status = "FAIL", test3Status = "FAIL";
  if (getResponse.status === 200 && getResponse.data.data.length > 0) {
      test2Status = "PASS";
      const sample = getResponse.data.data[0];
      const session = sample.sessionId;
      console.log("Sample session:", session);
      if (typeof session === 'object' && session._id && session.title && session.scheduledStartAt) {
          test3Status = "PASS";
      } else {
          test3Status = "FAIL (BACKEND GAP - sessionId not populated)";
      }
  }
  console.log(`Test 2 Status: ${test2Status}`);
  console.log(`Test 3 Status: ${test3Status}`);

  console.log("\n==================================================");
  console.log("TEST 5 — CONFIRM SUCCESS");
  console.log("==================================================");
  
  // Prepare a valid attendance: PENDING, session COMPLETED, < 24h
  let validAtt = await TeacherAttendance.findOne({ status: "PENDING", teacherId });
  if (validAtt) {
      await ClassSession.updateOne({ _id: validAtt.sessionId }, { status: "COMPLETED", actualEndAt: new Date(Date.now() - 1000 * 60 * 60) }); // 1 hour ago
      
      const reqConfirm = {
          user: { id: teacherId, _id: teacherId, role: "teacher" },
          params: { id: validAtt._id.toString() }
      };
      let confirmResp = null;
      const resConfirm = {
          status: function(c) { this.statusCode = c; return this; },
          json: function(d) { confirmResp = { status: this.statusCode, data: d }; return this; }
      };
      
      await teacherAttendanceController.confirmAttendance(reqConfirm, resConfirm);
      console.log(`Confirm HTTP Status: ${confirmResp.status}`);
      let test5Status = "FAIL";
      if (confirmResp.status === 200 && confirmResp.data.data.status === "CONFIRMED" && confirmResp.data.data.confirmedAt) {
          test5Status = "PASS";
      }
      console.log(`Test 5 Status: ${test5Status}`);

      console.log("\n==================================================");
      console.log("TEST 6 — DOUBLE CONFIRM");
      console.log("==================================================");
      let doubleConfirmResp = null;
      const resDoubleConfirm = {
          status: function(c) { this.statusCode = c; return this; },
          json: function(d) { doubleConfirmResp = { status: this.statusCode, data: d }; return this; }
      };
      await teacherAttendanceController.confirmAttendance(reqConfirm, resDoubleConfirm);
      console.log(`Double Confirm HTTP Status: ${doubleConfirmResp.status}`);
      console.log(`Test 6 Status: ${doubleConfirmResp.status === 400 ? "PASS" : "FAIL (BACKEND GAP)"}`);
  } else {
      console.log("Test 5 & 6 Skipped - No pending attendance found");
  }

  console.log("\n==================================================");
  console.log("TEST 7 — 24H LOCK");
  console.log("==================================================");
  let lockAtt = await TeacherAttendance.findOne({ status: "PENDING", teacherId });
  if (lockAtt) {
      await ClassSession.updateOne({ _id: lockAtt.sessionId }, { status: "COMPLETED", actualEndAt: new Date(Date.now() - 25 * 60 * 60 * 1000) }); // 25 hours ago
      
      const reqLock = {
          user: { id: teacherId, _id: teacherId, role: "teacher" },
          params: { id: lockAtt._id.toString() }
      };
      let lockResp = null;
      const resLock = {
          status: function(c) { this.statusCode = c; return this; },
          json: function(d) { lockResp = { status: this.statusCode, data: d }; return this; }
      };
      await teacherAttendanceController.confirmAttendance(reqLock, resLock);
      console.log(`24h Lock Confirm HTTP Status: ${lockResp.status}`);
      console.log(`Test 7 Status: ${lockResp.status === 400 ? "PASS" : "FAIL (BUSINESS RULE GAP)"}`);
  }

  console.log("\n==================================================");
  console.log("TEST 8 — PENDING SESSION");
  console.log("==================================================");
  let pendingSessAtt = await TeacherAttendance.findOne({ status: "PENDING", teacherId });
  if (pendingSessAtt) {
      await ClassSession.updateOne({ _id: pendingSessAtt.sessionId }, { status: "SCHEDULED" });
      
      const reqPending = {
          user: { id: teacherId, _id: teacherId, role: "teacher" },
          params: { id: pendingSessAtt._id.toString() }
      };
      let pendingResp = null;
      const resPending = {
          status: function(c) { this.statusCode = c; return this; },
          json: function(d) { pendingResp = { status: this.statusCode, data: d }; return this; }
      };
      await teacherAttendanceController.confirmAttendance(reqPending, resPending);
      console.log(`Pending Session Confirm HTTP Status: ${pendingResp.status}`);
      console.log(`Test 8 Status: ${pendingResp.status === 400 ? "PASS" : "FAIL (BUSINESS RULE GAP)"}`);
  }

  console.log("\n==================================================");
  console.log("TEST 9 — RBAC");
  console.log("==================================================");
  // RBAC for GET and POST are handled by middlewares in route, not controller.
  // We'll simulate middleware rejection if the controller relies on req.user.role.
  // Actually, express middlewares handle this. We'll mark as PASS if the router config is correct.
  console.log("Skipping direct controller RBAC test as middlewares handle it.");
  console.log("Will verify routes file instead.");

  console.log("\n==================================================");
  console.log("TEST 10 — FILTER");
  console.log("==================================================");
  const reqFilter = {
      user: { id: teacherId, _id: teacherId, role: "teacher" },
      query: { status: "CONFIRMED" }
  };
  let filterResp = null;
  const resFilter = {
      status: function(c) { this.statusCode = c; return this; },
      json: function(d) { filterResp = { status: this.statusCode, data: d }; return this; }
  };
  await teacherAttendanceController.getMyAttendance(reqFilter, resFilter);
  const allConfirmed = filterResp.data.data.every(a => a.status === "CONFIRMED");
  console.log(`Filter CONFIRMED count: ${filterResp.data.data.length}`);
  console.log(`Test 10 Status: ${allConfirmed ? "PASS" : "FAIL (BACKEND GAP)"}`);

  console.log("\n==================================================");
  console.log("TEST 11 — PAGINATION");
  console.log("==================================================");
  const reqPag = {
      user: { id: teacherId, _id: teacherId, role: "teacher" },
      query: { page: 1, limit: 1 }
  };
  let pagResp = null;
  const resPag = {
      status: function(c) { this.statusCode = c; return this; },
      json: function(d) { pagResp = { status: this.statusCode, data: d }; return this; }
  };
  await teacherAttendanceController.getMyAttendance(reqPag, resPag);
  const pag = pagResp.data.pagination;
  console.log(`Pagination: page=${pag.page}, limit=${pag.limit}, totalItems=${pag.totalItems}`);
  console.log(`Test 11 Status: ${pag.limit === 1 && pagResp.data.data.length <= 1 ? "PASS" : "FAIL (BACKEND GAP)"}`);

  process.exit(0);
}

runTests().catch(console.error);
