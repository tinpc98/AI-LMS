import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

// ── Mocks ────────────────────────────────────────────────────────────────────
// Mock Course model
vi.mock("#modules/course", () => ({
  Course: {
    findById: vi.fn(),
  },
}));

// Mock User model
vi.mock("#modules/auth", () => ({
  User: {
    findOne: vi.fn(),
  },
  verifyUser: vi.fn(),
}));

// Mock Enrollment model
vi.mock("#modules/enrollment/enrollment.model.js", () => {
  const mockModel = {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findOneAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
    exists: vi.fn(),
  };
  return {
    default: mockModel,
    // Khớp enrollment.model.js hiện tại: "PAID" đã bị bỏ (superseded bởi
    // PAYMENT_PENDING_CONFIRMATION khi module Payment/QR thật ra đời — xem enrollment.model.js).
    ACTIVE_STATUSES: [
      "PENDING_PAYMENT",
      "PAYMENT_PENDING_CONFIRMATION",
      "APPROVED",
      "CLASS_ASSIGNED",
    ],
    ALL_STATUSES: [
      "PENDING_PAYMENT",
      "PAYMENT_PENDING_CONFIRMATION",
      "APPROVED",
      "CLASS_ASSIGNED",
      "REJECTED",
      "COMPLETED",
      "CANCELLED",
    ],
  };
});

import enrollmentService from "../../../../src/modules/enrollment/enrollment.service.js";
import Enrollment from "../../../../src/modules/enrollment/enrollment.model.js";
import { Course } from "#modules/course";
import { User } from "#modules/auth";

// ── Helpers ──────────────────────────────────────────────────────────────────
const STUDENT_ID = "aaa000000000000000000001";
const OTHER_STUDENT_ID = "aaa000000000000000000099";
const COURSE_ID = "bbb000000000000000000001";
const ENROLLMENT_ID = "ccc000000000000000000001";

const publishedCourse = {
  _id: COURSE_ID,
  status: "PUBLISHED",
  name: "Toán Foundation",
};

const draftCourse = { _id: COURSE_ID, status: "DRAFT", name: "Toán Draft" };
const archivedCourse = { _id: COURSE_ID, status: "ARCHIVED", name: "Toán Archived" };

const mockEnrollment = (overrides = {}) => ({
  _id: ENROLLMENT_ID,
  studentId: STUDENT_ID,
  courseId: COURSE_ID,
  status: "PENDING_PAYMENT",
  save: vi.fn().mockResolvedValue(true),
  ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────
describe("EnrollmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // createEnrollment/createEnrollmentByAdmin dùng transaction thật (mongoose.startSession) —
    // không mock thì mỗi test gọi tới đây sẽ cố kết nối MongoDB thật và treo tới khi hết
    // testTimeout (đã xác nhận qua git stash: đây là flakiness có sẵn, phụ thuộc file test nào
    // chạy trước đó trong cùng worker có mở sẵn kết nối thật hay không).
    vi.spyOn(mongoose, "startSession").mockResolvedValue({
      startTransaction: vi.fn(),
      commitTransaction: vi.fn().mockResolvedValue(true),
      abortTransaction: vi.fn().mockResolvedValue(true),
      endSession: vi.fn(),
    });
  });

  // ── CREATE ───────────────────────────────────────────────────────────────

  describe("createEnrollment", () => {
    it("1. Student tạo Enrollment với Published Course → PASS", async () => {
      Course.findById.mockResolvedValue(publishedCourse);
      Enrollment.create.mockResolvedValue(mockEnrollment());

      const result = await enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID);
      expect(result.status).toBe("PENDING_PAYMENT");
      expect(Enrollment.create).toHaveBeenCalledWith({
        studentId: STUDENT_ID,
        courseId: COURSE_ID,
        status: "PENDING_PAYMENT",
      });
    });

    it("2. Student tạo Enrollment với Draft Course → FAIL", async () => {
      Course.findById.mockResolvedValue(draftCourse);

      await expect(enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID)).rejects.toThrow(
        /DRAFT/
      );
    });

    it("3. Student tạo Enrollment với Archived Course → FAIL", async () => {
      Course.findById.mockResolvedValue(archivedCourse);

      await expect(enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID)).rejects.toThrow(
        /ARCHIVED/
      );
    });

    it("4. Student tạo Enrollment với Course không tồn tại → FAIL 404", async () => {
      Course.findById.mockResolvedValue(null);

      await expect(enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID)).rejects.toThrow(
        /không tồn tại/
      );
    });

    it("7. Duplicate active enrollment → CONFLICT (11000)", async () => {
      Course.findById.mockResolvedValue(publishedCourse);
      const duplicateError = new Error("dup key");
      duplicateError.code = 11000;
      Enrollment.create.mockRejectedValue(duplicateError);

      await expect(enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID)).rejects.toThrow(
        /đang được xử lý/
      );
    });

    it("11. Student có COMPLETED → đăng ký lại → PASS", async () => {
      // Partial unique index cho phép — create sẽ thành công
      Course.findById.mockResolvedValue(publishedCourse);
      Enrollment.create.mockResolvedValue(mockEnrollment({ _id: "new-enrollment-id" }));

      const result = await enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID);
      expect(result._id).toBe("new-enrollment-id");
    });

    it("12. Student có CANCELLED → đăng ký lại → PASS", async () => {
      Course.findById.mockResolvedValue(publishedCourse);
      Enrollment.create.mockResolvedValue(mockEnrollment({ _id: "new-enrollment-id-2" }));

      const result = await enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID);
      expect(result._id).toBe("new-enrollment-id-2");
    });
  });

  // ── ADMIN CREATE ─────────────────────────────────────────────────────────

  describe("createEnrollmentByAdmin", () => {
    it("Admin tạo enrollment cho Student hợp lệ", async () => {
      User.findOne.mockResolvedValue({
        _id: STUDENT_ID,
        role: "Student",
      });
      Course.findById.mockResolvedValue(publishedCourse);
      Enrollment.create.mockResolvedValue(mockEnrollment());

      const result = await enrollmentService.createEnrollmentByAdmin(STUDENT_ID, COURSE_ID);
      expect(result.status).toBe("PENDING_PAYMENT");
    });

    it("Admin tạo enrollment cho User không phải Student → FAIL", async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        enrollmentService.createEnrollmentByAdmin(STUDENT_ID, COURSE_ID)
      ).rejects.toThrow(/không tồn tại/);
    });
  });

  // ── STATUS TRANSITIONS ───────────────────────────────────────────────────
  // transitionStatus() dùng update atomic findOneAndUpdate({_id, status:currentStatus}, ...)
  // để chống race condition (không mutate + .save() document đã fetch) — xem
  // enrollment.service.js. "PAID" đã bị bỏ khỏi lifecycle thật, thay bằng
  // PAYMENT_PENDING_CONFIRMATION (module Payment/QR). CLASS_ASSIGNED chỉ được set trực tiếp bởi
  // classEnrollment.service.js#assignClass (bypass transitionStatus hoàn toàn, vì xếp lớp còn
  // phải kiểm capacity/tạo ClassEnrollment) — nên APPROVED→CLASS_ASSIGNED qua transitionStatus
  // PHẢI bị từ chối, không phải cho phép.
  describe("transitionStatus", () => {
    it("13. PENDING_PAYMENT → PAYMENT_PENDING_CONFIRMATION → PASS", async () => {
      const enrollment = mockEnrollment({ status: "PENDING_PAYMENT" });
      Enrollment.findById.mockResolvedValue(enrollment);
      Enrollment.findOneAndUpdate.mockResolvedValue({
        ...enrollment,
        status: "PAYMENT_PENDING_CONFIRMATION",
      });

      const result = await enrollmentService.transitionStatus(
        ENROLLMENT_ID,
        "PAYMENT_PENDING_CONFIRMATION"
      );
      expect(result.status).toBe("PAYMENT_PENDING_CONFIRMATION");
      expect(Enrollment.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: ENROLLMENT_ID, status: "PENDING_PAYMENT" },
        { status: "PAYMENT_PENDING_CONFIRMATION" },
        { new: true }
      );
    });

    it("14. PAYMENT_PENDING_CONFIRMATION → APPROVED → PASS", async () => {
      const enrollment = mockEnrollment({ status: "PAYMENT_PENDING_CONFIRMATION" });
      Enrollment.findById.mockResolvedValue(enrollment);
      Enrollment.findOneAndUpdate.mockResolvedValue({ ...enrollment, status: "APPROVED" });

      const result = await enrollmentService.transitionStatus(ENROLLMENT_ID, "APPROVED");
      expect(result.status).toBe("APPROVED");
    });

    it("15. APPROVED → CLASS_ASSIGNED qua transitionStatus → FAIL (phải qua assignClass())", async () => {
      const enrollment = mockEnrollment({ status: "APPROVED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await expect(
        enrollmentService.transitionStatus(ENROLLMENT_ID, "CLASS_ASSIGNED")
      ).rejects.toThrow(/Không thể chuyển/);
      expect(Enrollment.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("16. CLASS_ASSIGNED → COMPLETED → PASS", async () => {
      const enrollment = mockEnrollment({ status: "CLASS_ASSIGNED" });
      Enrollment.findById.mockResolvedValue(enrollment);
      Enrollment.findOneAndUpdate.mockResolvedValue({ ...enrollment, status: "COMPLETED" });

      const result = await enrollmentService.transitionStatus(ENROLLMENT_ID, "COMPLETED");
      expect(result.status).toBe("COMPLETED");
    });

    it("17. PENDING_PAYMENT → CANCELLED → PASS", async () => {
      const enrollment = mockEnrollment({ status: "PENDING_PAYMENT" });
      Enrollment.findById.mockResolvedValue(enrollment);
      Enrollment.findOneAndUpdate.mockResolvedValue({ ...enrollment, status: "CANCELLED" });

      const result = await enrollmentService.transitionStatus(ENROLLMENT_ID, "CANCELLED");
      expect(result.status).toBe("CANCELLED");
    });

    it("18. COMPLETED → PENDING_PAYMENT → FAIL", async () => {
      const enrollment = mockEnrollment({ status: "COMPLETED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await expect(
        enrollmentService.transitionStatus(ENROLLMENT_ID, "PENDING_PAYMENT")
      ).rejects.toThrow(/Không thể chuyển/);
    });

    it("19. CANCELLED → APPROVED → FAIL (trạng thái kết thúc, không quay lại được)", async () => {
      const enrollment = mockEnrollment({ status: "CANCELLED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await expect(enrollmentService.transitionStatus(ENROLLMENT_ID, "APPROVED")).rejects.toThrow(
        /Không thể chuyển/
      );
    });

    it("20. COMPLETED → APPROVED → FAIL", async () => {
      const enrollment = mockEnrollment({ status: "COMPLETED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await expect(enrollmentService.transitionStatus(ENROLLMENT_ID, "APPROVED")).rejects.toThrow(
        /Không thể chuyển/
      );
    });

    it("Enrollment không tồn tại → FAIL 404", async () => {
      Enrollment.findById.mockResolvedValue(null);

      await expect(enrollmentService.transitionStatus("nonexistent", "CANCELLED")).rejects.toThrow(
        /không tồn tại/
      );
    });

    it("Race condition: trạng thái đã đổi trước khi update atomic chạy → FAIL", async () => {
      const enrollment = mockEnrollment({ status: "PENDING_PAYMENT" });
      Enrollment.findById.mockResolvedValue(enrollment);
      // findOneAndUpdate trả null khi filter {_id, status:currentStatus} không còn khớp nữa
      // (tiến trình khác đã đổi status trước đó) — đúng hành vi chống race condition.
      Enrollment.findOneAndUpdate.mockResolvedValue(null);

      await expect(enrollmentService.transitionStatus(ENROLLMENT_ID, "CANCELLED")).rejects.toThrow(
        /thay đổi bởi một tiến trình khác/
      );
    });
  });

  // ── QUERIES ──────────────────────────────────────────────────────────────

  describe("getMyEnrollments", () => {
    it("Trả về danh sách enrollment của student", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        sort: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockEnrollment()]),
      };
      Enrollment.find.mockReturnValue(mockQuery);
      Enrollment.countDocuments.mockResolvedValue(1);

      const result = await enrollmentService.getMyEnrollments(STUDENT_ID);
      expect(result.items).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  // ── hasActiveEnrollment ──────────────────────────────────────────────────

  describe("hasActiveEnrollment", () => {
    it("Student có enrollment active → true", async () => {
      Enrollment.exists.mockResolvedValue({ _id: ENROLLMENT_ID });

      const result = await enrollmentService.hasActiveEnrollment(STUDENT_ID);
      expect(result).toBe(true);
    });

    it("Student không có enrollment active → false", async () => {
      Enrollment.exists.mockResolvedValue(null);

      const result = await enrollmentService.hasActiveEnrollment(STUDENT_ID);
      expect(result).toBe(false);
    });
  });
});
