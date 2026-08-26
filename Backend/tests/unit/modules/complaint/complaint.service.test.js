// Test cho complaint.service.js — EduSpace mechanism design Phần C.6, BR-30/31.
import { describe, it, expect, vi, beforeEach } from "vitest";

const complaintCreate = vi.fn();
const complaintFindById = vi.fn();
const complaintFind = vi.fn();

vi.mock("#modules/complaint/complaint.model.js", () => ({
  default: {
    create: (...a) => complaintCreate(...a),
    findById: (...a) => complaintFindById(...a),
    find: (...a) => complaintFind(...a),
  },
  COMPLAINT_CATEGORIES: [
    "TEACHING_QUALITY",
    "NO_SHOW_UNREPORTED",
    "INAPPROPRIATE_BEHAVIOR",
    "CHILD_SAFETY",
    "OTHER",
  ],
}));

const {
  submitComplaint,
  respondToComplaint,
  resolveComplaint,
  findOverdueComplaints,
  getSlaHoursForCategory,
} = await import("#modules/complaint/complaint.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getSlaHoursForCategory", () => {
  it("CHILD_SAFETY có SLA ngắn hơn hẳn (BR-30)", () => {
    expect(getSlaHoursForCategory("CHILD_SAFETY")).toBeLessThan(
      getSlaHoursForCategory("TEACHING_QUALITY")
    );
  });
});

describe("submitComplaint", () => {
  it("Nộp thành công với category hợp lệ", async () => {
    complaintCreate.mockResolvedValue({ _id: "c1" });

    await submitComplaint({
      reportedBy: "student-1",
      aboutTeacherId: "teacher-1",
      category: "TEACHING_QUALITY",
      description: "Giáo viên dạy chưa rõ ràng",
    });

    expect(complaintCreate).toHaveBeenCalledWith(
      expect.objectContaining({ category: "TEACHING_QUALITY", reportedBy: "student-1" })
    );
  });

  it("category không hợp lệ → ValidationError", async () => {
    await expect(
      submitComplaint({ reportedBy: "student-1", category: "KHONG_TON_TAI", description: "x" })
    ).rejects.toMatchObject({ status: 400 });
    expect(complaintCreate).not.toHaveBeenCalled();
  });

  it("Thiếu description → ValidationError", async () => {
    await expect(
      submitComplaint({ reportedBy: "student-1", category: "OTHER", description: "   " })
    ).rejects.toMatchObject({ status: 400 });
  });
});

describe("respondToComplaint — idempotent", () => {
  it("Lần đầu phản hồi → set firstRespondedAt + chuyển UNDER_REVIEW", async () => {
    const complaint = {
      status: "SUBMITTED",
      firstRespondedAt: null,
      save: vi.fn().mockResolvedValue(true),
    };
    complaintFindById.mockResolvedValue(complaint);

    await respondToComplaint("c1");

    expect(complaint.firstRespondedAt).toBeInstanceOf(Date);
    expect(complaint.status).toBe("UNDER_REVIEW");
  });

  it("Đã có firstRespondedAt từ trước → KHÔNG ghi đè mốc thời gian cũ", async () => {
    const oldDate = new Date("2026-01-01T00:00:00Z");
    const complaint = {
      status: "UNDER_REVIEW",
      firstRespondedAt: oldDate,
      save: vi.fn().mockResolvedValue(true),
    };
    complaintFindById.mockResolvedValue(complaint);

    await respondToComplaint("c1");

    expect(complaint.firstRespondedAt).toBe(oldDate);
  });

  it("Khiếu nại không tồn tại → NotFoundError", async () => {
    complaintFindById.mockResolvedValue(null);
    await expect(respondToComplaint("c1")).rejects.toMatchObject({ status: 404 });
  });
});

describe("resolveComplaint", () => {
  it("Đóng khiếu nại thành công, tự set firstRespondedAt nếu chưa có", async () => {
    const complaint = {
      status: "SUBMITTED",
      firstRespondedAt: null,
      save: vi.fn().mockResolvedValue(true),
    };
    complaintFindById.mockResolvedValue(complaint);

    await resolveComplaint("c1", {
      resolvedBy: "admin-1",
      resolution: "Đã xác nhận và nhắc nhở giáo viên",
    });

    expect(complaint.status).toBe("RESOLVED");
    expect(complaint.resolvedBy).toBe("admin-1");
    expect(complaint.firstRespondedAt).toBeInstanceOf(Date);
  });

  it("Đã RESOLVED từ trước → BusinessRuleError, không cho đóng lại", async () => {
    complaintFindById.mockResolvedValue({ status: "RESOLVED" });
    await expect(
      resolveComplaint("c1", { resolvedBy: "admin-1", resolution: "x" })
    ).rejects.toMatchObject({ status: 422 });
  });

  it("Thiếu resolution → ValidationError", async () => {
    complaintFindById.mockResolvedValue({ status: "SUBMITTED" });
    await expect(resolveComplaint("c1", { resolvedBy: "admin-1" })).rejects.toMatchObject({
      status: 400,
    });
  });
});

describe("findOverdueComplaints — BR-30", () => {
  it("Lọc đúng khiếu nại chưa phản hồi VÀ đã quá SLA, ưu tiên CHILD_SAFETY lên đầu", async () => {
    const now = new Date("2026-08-10T00:00:00Z");
    complaintFind.mockReturnValue({
      lean: () =>
        Promise.resolve([
          {
            _id: "c-normal",
            category: "TEACHING_QUALITY",
            firstRespondedAt: null,
            createdAt: new Date("2026-08-08T00:00:00Z"), // quá 24h SLA
          },
          {
            _id: "c-child-safety",
            category: "CHILD_SAFETY",
            firstRespondedAt: null,
            createdAt: new Date("2026-08-09T18:00:00Z"), // 6h trước now, quá SLA 4h
          },
          {
            _id: "c-trong-sla",
            category: "TEACHING_QUALITY",
            firstRespondedAt: null,
            createdAt: new Date("2026-08-09T23:00:00Z"), // chưa quá 24h
          },
        ]),
    });

    const result = await findOverdueComplaints(now);

    expect(result.map((c) => c._id)).toEqual(["c-child-safety", "c-normal"]);
  });

  it("Chỉ lọc firstRespondedAt=null (đã phản hồi rồi thì không tính là quá hạn nữa)", async () => {
    complaintFind.mockReturnValue({ lean: () => Promise.resolve([]) });

    await findOverdueComplaints();

    expect(complaintFind).toHaveBeenCalledWith({ firstRespondedAt: null });
  });
});
