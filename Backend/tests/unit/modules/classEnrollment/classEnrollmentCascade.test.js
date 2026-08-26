// Test cho cancelClassEnrollmentByEnrollmentId/completeClassEnrollmentByEnrollmentId — hai
// helper mới thêm để enrollment.service.js#transitionStatus cascade đúng khi Enrollment chuyển
// sang CANCELLED/COMPLETED (BUG ĐÃ SỬA: trước đây ClassEnrollment ACTIVE bị bỏ quên mãi mãi).
import { describe, it, expect, vi, beforeEach } from "vitest";

const classEnrollmentFindOne = vi.fn();

vi.mock("#modules/classEnrollment/classEnrollment.model.js", () => ({
  default: { findOne: (...a) => classEnrollmentFindOne(...a) },
}));
vi.mock("../../../../src/modules/class/class.model.js", () => ({ default: {} }));
vi.mock("#modules/enrollment/index.js", () => ({ Enrollment: {} }));
vi.mock("../../../../src/modules/classSession/classSession.model.js", () => ({ default: {} }));
vi.mock("../../../../src/modules/attendance/attendance.model.js", () => ({ default: {} }));

const { default: classEnrollmentService } =
  await import("#modules/classEnrollment/classEnrollment.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("cancelClassEnrollmentByEnrollmentId", () => {
  it("Có ClassEnrollment ACTIVE → gọi cancelClassEnrollment với đúng _id", async () => {
    classEnrollmentFindOne.mockResolvedValue({ _id: "ce1" });
    const spy = vi
      .spyOn(classEnrollmentService, "cancelClassEnrollment")
      .mockResolvedValue({ _id: "ce1", status: "CANCELLED" });

    const result = await classEnrollmentService.cancelClassEnrollmentByEnrollmentId(
      "enr1",
      "admin1"
    );

    expect(classEnrollmentFindOne).toHaveBeenCalledWith({ enrollmentId: "enr1", status: "ACTIVE" });
    expect(spy).toHaveBeenCalledWith({ classEnrollmentId: "ce1", adminId: "admin1" });
    expect(result.status).toBe("CANCELLED");
  });

  it("Không có ClassEnrollment ACTIVE nào (vd Enrollment bị hủy trước khi xếp lớp) → no-op, trả null", async () => {
    classEnrollmentFindOne.mockResolvedValue(null);
    const spy = vi.spyOn(classEnrollmentService, "cancelClassEnrollment");

    const result = await classEnrollmentService.cancelClassEnrollmentByEnrollmentId(
      "enr1",
      "admin1"
    );

    expect(spy).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});

describe("completeClassEnrollmentByEnrollmentId", () => {
  it("Có ClassEnrollment ACTIVE → gọi completeClassEnrollment với đúng _id", async () => {
    classEnrollmentFindOne.mockResolvedValue({ _id: "ce2" });
    const spy = vi
      .spyOn(classEnrollmentService, "completeClassEnrollment")
      .mockResolvedValue({ _id: "ce2", status: "COMPLETED" });

    const result = await classEnrollmentService.completeClassEnrollmentByEnrollmentId(
      "enr2",
      "admin1"
    );

    expect(spy).toHaveBeenCalledWith({ classEnrollmentId: "ce2", adminId: "admin1" });
    expect(result.status).toBe("COMPLETED");
  });
});
