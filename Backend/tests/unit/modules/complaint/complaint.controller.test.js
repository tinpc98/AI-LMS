// Test "nối dây" cho complaint.controller.js.
import { describe, it, expect, vi, beforeEach } from "vitest";

const submitComplaint = vi.fn();
const respondToComplaint = vi.fn();
const resolveComplaint = vi.fn();
const findOverdueComplaints = vi.fn();

vi.mock("#modules/complaint/complaint.service.js", () => ({
  submitComplaint: (...a) => submitComplaint(...a),
  respondToComplaint: (...a) => respondToComplaint(...a),
  resolveComplaint: (...a) => resolveComplaint(...a),
  findOverdueComplaints: (...a) => findOverdueComplaints(...a),
}));

const { createComplaint, markComplaintResponded, closeComplaint, listOverdueComplaints } =
  await import("#modules/complaint/complaint.controller.js");

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createComplaint", () => {
  it("reportedBy LUÔN lấy từ req.user, không nhận từ body — chặn giả danh", async () => {
    submitComplaint.mockResolvedValue({ _id: "c1" });
    const req = {
      user: { id: "real-user" },
      body: {
        reportedBy: "ke-gia-danh",
        category: "TEACHING_QUALITY",
        description: "mô tả",
        aboutTeacherId: "teacher-1",
      },
    };

    await createComplaint(req, buildRes(), vi.fn());

    expect(submitComplaint).toHaveBeenCalledWith(
      expect.objectContaining({ reportedBy: "real-user", category: "TEACHING_QUALITY" })
    );
  });
});

describe("closeComplaint", () => {
  it("resolvedBy lấy từ req.user, resolution từ body", async () => {
    resolveComplaint.mockResolvedValue({ _id: "c1", status: "RESOLVED" });
    const req = { params: { id: "c1" }, user: { id: "admin-1" }, body: { resolution: "Đã xử lý" } };

    await closeComplaint(req, buildRes(), vi.fn());

    expect(resolveComplaint).toHaveBeenCalledWith("c1", {
      resolvedBy: "admin-1",
      resolution: "Đã xử lý",
    });
  });
});

describe("markComplaintResponded / listOverdueComplaints", () => {
  it("markComplaintResponded: trích id, gọi service", async () => {
    respondToComplaint.mockResolvedValue({ _id: "c1" });
    await markComplaintResponded({ params: { id: "c1" } }, buildRes(), vi.fn());
    expect(respondToComplaint).toHaveBeenCalledWith("c1");
  });

  it("listOverdueComplaints: gọi service không tham số, trả data", async () => {
    findOverdueComplaints.mockResolvedValue([{ _id: "c1" }]);
    const res = buildRes();

    await listOverdueComplaints({}, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ _id: "c1" }] }));
  });
});
