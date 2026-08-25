import { describe, it, expect, vi, beforeEach } from "vitest";
import { runStudentExpiryCheck } from "../../../src/jobs/userLifecycle.job.js";
import {
  shouldExpireStudent,
  EnrollmentEligibilityProvider,
} from "../../../src/modules/auth/studentLifecycle.service.js";
import User from "../../../src/modules/auth/user.model.js";

// Mock User Model
vi.mock("../../../src/modules/auth/user.model.js", () => {
  return {
    default: {
      find: vi.fn(),
      updateOne: vi.fn(),
    },
  };
});

describe("Student Account Lifecycle Boundary & Job", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Service Boundary: shouldExpireStudent", () => {
    it("Student < 15 days -> Không expire", async () => {
      const fakeNow = new Date("2026-08-23T00:00:00Z");
      const student = {
        _id: "st1",
        role: "Student",
        status: "Active",
        createdAt: new Date("2026-08-20T00:00:00Z"), // Chỉ mới 3 ngày
      };

      const result = await shouldExpireStudent(student, fakeNow);
      expect(result).toBe(false);
    });

    it("Teacher > 15 days -> Không expire (Sai Role)", async () => {
      const fakeNow = new Date("2026-08-23T00:00:00Z");
      const teacher = {
        _id: "tc1",
        role: "Teacher",
        status: "Active",
        createdAt: new Date("2026-01-01T00:00:00Z"), // Đã rất lâu
      };

      const result = await shouldExpireStudent(teacher, fakeNow);
      expect(result).toBe(false);
    });

    it("Student > 15 days và CÓ Enrollment -> Không expire", async () => {
      const fakeNow = new Date("2026-08-23T00:00:00Z");
      const student = {
        _id: "st1",
        role: "Student",
        status: "Active",
        createdAt: new Date("2026-08-01T00:00:00Z"), // 22 ngày
      };

      // Giả lập hệ thống báo CÓ enrollment
      vi.spyOn(EnrollmentEligibilityProvider, "hasValidEnrollment").mockResolvedValueOnce(true);

      const result = await shouldExpireStudent(student, fakeNow);
      expect(result).toBe(false); // Đủ điều kiện giữ tài khoản
    });

    it("Student > 15 days và KHÔNG Enrollment -> EXPIRED", async () => {
      const fakeNow = new Date("2026-08-23T00:00:00Z");
      const student = {
        _id: "st1",
        role: "Student",
        status: "Active",
        createdAt: new Date("2026-08-01T00:00:00Z"), // 22 ngày
      };

      // Giả lập hệ thống báo KHÔNG enrollment
      vi.spyOn(EnrollmentEligibilityProvider, "hasValidEnrollment").mockResolvedValueOnce(false);

      const result = await shouldExpireStudent(student, fakeNow);
      expect(result).toBe(true); // Bị expire
    });
  });

  describe("Cron Job: runStudentExpiryCheck", () => {
    it("Cập nhật trạng thái Expired chỉ cho những học sinh được service duyệt", async () => {
      const fakeNow = new Date("2026-08-23T00:00:00Z");

      const mockStudents = [
        { _id: "st1", role: "Student", status: "Active", createdAt: new Date("2026-08-01T00:00:00Z") },
        { _id: "st2", role: "Student", status: "Active", createdAt: new Date("2026-08-01T00:00:00Z") },
      ];

      // Mock chuỗi Mongoose User.find().select()
      const mockSelect = vi.fn().mockResolvedValue(mockStudents);
      User.find.mockReturnValue({ select: mockSelect });

      User.updateOne.mockResolvedValue({ modifiedCount: 1 });

      // Giả lập boundary:
      // st1 KHÔNG CÓ enrollment -> Expire (true)
      // st2 CÓ enrollment -> Không Expire (false)
      vi.spyOn(EnrollmentEligibilityProvider, "hasValidEnrollment")
        .mockResolvedValueOnce(false) // st1
        .mockResolvedValueOnce(true); // st2

      const result = await runStudentExpiryCheck(fakeNow);

      expect(result.expiredCount).toBe(1); // Chỉ update 1 student
      expect(User.updateOne).toHaveBeenCalledTimes(1);
      expect(User.updateOne).toHaveBeenCalledWith(
        { _id: "st1" },
        { $set: { status: "Expired" } }
      );
    });

    it("Idempotent - Chạy không lỗi nếu không có học sinh nào", async () => {
      const mockSelect = vi.fn().mockResolvedValue([]);
      User.find.mockReturnValue({ select: mockSelect });

      const result = await runStudentExpiryCheck();
      expect(result.expiredCount).toBe(0);
      expect(User.updateOne).not.toHaveBeenCalled();
    });
  });
});
