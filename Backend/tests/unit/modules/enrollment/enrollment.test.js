import { describe, it, expect, vi, beforeEach } from "vitest";

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
    countDocuments: vi.fn(),
    exists: vi.fn(),
  };
  return {
    default: mockModel,
    ACTIVE_STATUSES: ["PENDING_PAYMENT", "PAID", "APPROVED", "CLASS_ASSIGNED"],
    ALL_STATUSES: [
      "PENDING_PAYMENT",
      "PAID",
      "APPROVED",
      "CLASS_ASSIGNED",
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

      await expect(
        enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID)
      ).rejects.toThrow(/DRAFT/);
    });

    it("3. Student tạo Enrollment với Archived Course → FAIL", async () => {
      Course.findById.mockResolvedValue(archivedCourse);

      await expect(
        enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID)
      ).rejects.toThrow(/ARCHIVED/);
    });

    it("4. Student tạo Enrollment với Course không tồn tại → FAIL 404", async () => {
      Course.findById.mockResolvedValue(null);

      await expect(
        enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID)
      ).rejects.toThrow(/không tồn tại/);
    });

    it("7. Duplicate active enrollment → CONFLICT (11000)", async () => {
      Course.findById.mockResolvedValue(publishedCourse);
      const duplicateError = new Error("dup key");
      duplicateError.code = 11000;
      Enrollment.create.mockRejectedValue(duplicateError);

      await expect(
        enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID)
      ).rejects.toThrow(/đang được xử lý/);
    });

    it("11. Student có COMPLETED → đăng ký lại → PASS", async () => {
      // Partial unique index cho phép — create sẽ thành công
      Course.findById.mockResolvedValue(publishedCourse);
      Enrollment.create.mockResolvedValue(
        mockEnrollment({ _id: "new-enrollment-id" })
      );

      const result = await enrollmentService.createEnrollment(STUDENT_ID, COURSE_ID);
      expect(result._id).toBe("new-enrollment-id");
    });

    it("12. Student có CANCELLED → đăng ký lại → PASS", async () => {
      Course.findById.mockResolvedValue(publishedCourse);
      Enrollment.create.mockResolvedValue(
        mockEnrollment({ _id: "new-enrollment-id-2" })
      );

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

  describe("transitionStatus", () => {
    it("13. PENDING_PAYMENT → PAID → PASS", async () => {
      const enrollment = mockEnrollment({ status: "PENDING_PAYMENT" });
      Enrollment.findById.mockResolvedValue(enrollment);

      const result = await enrollmentService.transitionStatus(ENROLLMENT_ID, "PAID");
      expect(enrollment.status).toBe("PAID");
      expect(enrollment.save).toHaveBeenCalled();
    });

    it("14. PAID → APPROVED → PASS", async () => {
      const enrollment = mockEnrollment({ status: "PAID" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await enrollmentService.transitionStatus(ENROLLMENT_ID, "APPROVED");
      expect(enrollment.status).toBe("APPROVED");
    });

    it("15. APPROVED → CLASS_ASSIGNED → PASS", async () => {
      const enrollment = mockEnrollment({ status: "APPROVED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await enrollmentService.transitionStatus(ENROLLMENT_ID, "CLASS_ASSIGNED");
      expect(enrollment.status).toBe("CLASS_ASSIGNED");
    });

    it("16. CLASS_ASSIGNED → COMPLETED → PASS", async () => {
      const enrollment = mockEnrollment({ status: "CLASS_ASSIGNED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await enrollmentService.transitionStatus(ENROLLMENT_ID, "COMPLETED");
      expect(enrollment.status).toBe("COMPLETED");
    });

    it("17. PENDING_PAYMENT → CANCELLED → PASS", async () => {
      const enrollment = mockEnrollment({ status: "PENDING_PAYMENT" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await enrollmentService.transitionStatus(ENROLLMENT_ID, "CANCELLED");
      expect(enrollment.status).toBe("CANCELLED");
    });

    it("18. COMPLETED → PENDING_PAYMENT → FAIL", async () => {
      const enrollment = mockEnrollment({ status: "COMPLETED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await expect(
        enrollmentService.transitionStatus(ENROLLMENT_ID, "PENDING_PAYMENT")
      ).rejects.toThrow(/Không thể chuyển/);
    });

    it("19. CANCELLED → PAID → FAIL", async () => {
      const enrollment = mockEnrollment({ status: "CANCELLED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await expect(
        enrollmentService.transitionStatus(ENROLLMENT_ID, "PAID")
      ).rejects.toThrow(/Không thể chuyển/);
    });

    it("20. COMPLETED → APPROVED → FAIL", async () => {
      const enrollment = mockEnrollment({ status: "COMPLETED" });
      Enrollment.findById.mockResolvedValue(enrollment);

      await expect(
        enrollmentService.transitionStatus(ENROLLMENT_ID, "APPROVED")
      ).rejects.toThrow(/Không thể chuyển/);
    });

    it("Enrollment không tồn tại → FAIL 404", async () => {
      Enrollment.findById.mockResolvedValue(null);

      await expect(
        enrollmentService.transitionStatus("nonexistent", "PAID")
      ).rejects.toThrow(/không tồn tại/);
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
