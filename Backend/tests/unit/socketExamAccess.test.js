// Unit test cho socketExamAccess.service.js (PR-14 — Socket.io hardening).
// Trước PR-14, exam.socket.js tin tưởng hoàn toàn userId/role do client tự khai, không có
// service kiểm tra quyền nào tồn tại để test.
import { describe, it, expect, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import { checkSocketExamAccess } from "../../src/services/socketExamAccess.service.js";
import Exam from "../../src/models/exam.model.js";
import ExamAttempt from "../../src/models/examAttempt.model.js";
import { Class as classModel } from "#modules/class";

const EXAM_ID = new mongoose.Types.ObjectId().toString();
const CLASS_ID = new mongoose.Types.ObjectId().toString();
const ATTEMPT_ID = new mongoose.Types.ObjectId().toString();
const OWNER_TEACHER_ID = "507f1f77bcf86cd799439011";
const OTHER_TEACHER_ID = "507f1f77bcf86cd799439099";
const STUDENT_ID = "607f1f77bcf86cd799439222";
const OTHER_STUDENT_ID = "607f1f77bcf86cd799439233";

const mongooseQuery = (resolvedValue) => {
  const query = {
    select: () => query,
    lean: () => Promise.resolve(resolvedValue),
  };
  return query;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkSocketExamAccess — validation cơ bản", () => {
  it("thiếu user (chưa xác thực) → SOCKET_AUTH_MISSING_TOKEN", async () => {
    const result = await checkSocketExamAccess(null, { examId: EXAM_ID });
    expect(result).toMatchObject({ allowed: false, code: "SOCKET_AUTH_MISSING_TOKEN" });
  });

  it("examId sai định dạng → SOCKET_INVALID_EXAM_ID", async () => {
    const result = await checkSocketExamAccess(
      { id: STUDENT_ID, role: "student" },
      { examId: "not-an-id" }
    );
    expect(result).toMatchObject({ allowed: false, code: "SOCKET_INVALID_EXAM_ID" });
  });

  it("exam không tồn tại/đã xóa → SOCKET_EXAM_NOT_FOUND", async () => {
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery(null));
    const result = await checkSocketExamAccess(
      { id: STUDENT_ID, role: "student" },
      { examId: EXAM_ID, attemptId: ATTEMPT_ID }
    );
    expect(result).toMatchObject({ allowed: false, code: "SOCKET_EXAM_NOT_FOUND" });
  });
});

describe("checkSocketExamAccess — admin", () => {
  it("admin luôn được phép truy cập bất kỳ đề thi nào", async () => {
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery({ _id: EXAM_ID, classId: CLASS_ID }));
    const result = await checkSocketExamAccess(
      { id: "admin-1", role: "admin" },
      { examId: EXAM_ID }
    );
    expect(result).toMatchObject({ allowed: true, accessType: "admin" });
  });
});

describe("checkSocketExamAccess — teacher", () => {
  it("giáo viên không phụ trách lớp của đề thi → SOCKET_EXAM_ACCESS_DENIED", async () => {
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery({ _id: EXAM_ID, classId: CLASS_ID }));
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OWNER_TEACHER_ID,
    });

    const result = await checkSocketExamAccess(
      { id: OTHER_TEACHER_ID, role: "teacher" },
      { examId: EXAM_ID }
    );
    expect(result).toMatchObject({ allowed: false, code: "SOCKET_EXAM_ACCESS_DENIED" });
  });

  it("giáo viên phụ trách lớp của đề thi → allowed", async () => {
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery({ _id: EXAM_ID, classId: CLASS_ID }));
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OWNER_TEACHER_ID,
    });

    const result = await checkSocketExamAccess(
      { id: OWNER_TEACHER_ID, role: "teacher" },
      { examId: EXAM_ID }
    );
    expect(result).toMatchObject({ allowed: true, accessType: "teacher-owner" });
  });
});

describe("checkSocketExamAccess — student", () => {
  it("thiếu attemptId → SOCKET_INVALID_ATTEMPT_ID", async () => {
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery({ _id: EXAM_ID, classId: CLASS_ID }));
    const result = await checkSocketExamAccess(
      { id: STUDENT_ID, role: "student" },
      { examId: EXAM_ID }
    );
    expect(result).toMatchObject({ allowed: false, code: "SOCKET_INVALID_ATTEMPT_ID" });
  });

  it("attemptId thuộc về học sinh KHÁC → SOCKET_EXAM_ACCESS_DENIED (chặn giả mạo attemptId)", async () => {
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery({ _id: EXAM_ID, classId: CLASS_ID }));
    vi.spyOn(ExamAttempt, "findOne").mockReturnValue(
      mongooseQuery({ _id: ATTEMPT_ID, examId: EXAM_ID, studentId: OTHER_STUDENT_ID })
    );

    const result = await checkSocketExamAccess(
      { id: STUDENT_ID, role: "student" },
      { examId: EXAM_ID, attemptId: ATTEMPT_ID }
    );
    expect(result).toMatchObject({ allowed: false, code: "SOCKET_EXAM_ACCESS_DENIED" });
  });

  it("attemptId thuộc đề thi KHÁC (examId không khớp) → SOCKET_EXAM_ACCESS_DENIED", async () => {
    const OTHER_EXAM_ID = new mongoose.Types.ObjectId().toString();
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery({ _id: EXAM_ID, classId: CLASS_ID }));
    vi.spyOn(ExamAttempt, "findOne").mockReturnValue(
      mongooseQuery({ _id: ATTEMPT_ID, examId: OTHER_EXAM_ID, studentId: STUDENT_ID })
    );

    const result = await checkSocketExamAccess(
      { id: STUDENT_ID, role: "student" },
      { examId: EXAM_ID, attemptId: ATTEMPT_ID }
    );
    expect(result).toMatchObject({ allowed: false, code: "SOCKET_EXAM_ACCESS_DENIED" });
  });

  it("attemptId hợp lệ, đúng chủ sở hữu → allowed", async () => {
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery({ _id: EXAM_ID, classId: CLASS_ID }));
    vi.spyOn(ExamAttempt, "findOne").mockReturnValue(
      mongooseQuery({ _id: ATTEMPT_ID, examId: EXAM_ID, studentId: STUDENT_ID })
    );

    const result = await checkSocketExamAccess(
      { id: STUDENT_ID, role: "student" },
      { examId: EXAM_ID, attemptId: ATTEMPT_ID }
    );
    expect(result).toMatchObject({ allowed: true, accessType: "student-owner" });
    expect(result.attempt._id).toBe(ATTEMPT_ID);
  });
});

describe("checkSocketExamAccess — vai trò không hợp lệ", () => {
  it("role lạ (không phải admin/teacher/student) → SOCKET_EXAM_ACCESS_DENIED", async () => {
    vi.spyOn(Exam, "findOne").mockReturnValue(mongooseQuery({ _id: EXAM_ID, classId: CLASS_ID }));
    const result = await checkSocketExamAccess({ id: "x", role: "guest" }, { examId: EXAM_ID });
    expect(result).toMatchObject({ allowed: false, code: "SOCKET_EXAM_ACCESS_DENIED" });
  });
});
