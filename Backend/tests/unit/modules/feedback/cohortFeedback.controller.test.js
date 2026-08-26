// Test "nối dây" cho cohortFeedback.controller.js.
import { describe, it, expect, vi, beforeEach } from "vitest";

const submitFeedback = vi.fn();
const getTeacherAverageRatings = vi.fn();
const getFeedbackDetailsForAdmin = vi.fn();

vi.mock("#modules/feedback/cohortFeedback.service.js", () => ({
  submitFeedback: (...a) => submitFeedback(...a),
  getTeacherAverageRatings: (...a) => getTeacherAverageRatings(...a),
  getFeedbackDetailsForAdmin: (...a) => getFeedbackDetailsForAdmin(...a),
}));

const { submitClassFeedback, getMyAverageRatings, getTeacherFeedbackDetails } =
  await import("#modules/feedback/cohortFeedback.controller.js");

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("submitClassFeedback", () => {
  it("studentId LUÔN lấy từ req.user, không nhận từ body", async () => {
    submitFeedback.mockResolvedValue({ _id: "fb1" });
    const req = {
      params: { classId: "class-1" },
      user: { id: "real-student" },
      body: { studentId: "ke-gia-danh", ratingClarity: 5, ratingHelpfulness: 4 },
    };

    await submitClassFeedback(req, buildRes(), vi.fn());

    expect(submitFeedback).toHaveBeenCalledWith("class-1", "real-student", {
      ratingClarity: 5,
      ratingHelpfulness: 4,
      comment: undefined,
    });
  });

  it("Thiếu rating → ValidationError qua next()", async () => {
    const req = { params: { classId: "class-1" }, user: { id: "s1" }, body: {} };
    const next = vi.fn();

    await submitClassFeedback(req, buildRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(submitFeedback).not.toHaveBeenCalled();
  });
});

describe("getMyAverageRatings", () => {
  it("teacherId lấy từ req.user", async () => {
    getTeacherAverageRatings.mockResolvedValue({ count: 3 });
    const req = { user: { id: "teacher-1" } };

    await getMyAverageRatings(req, buildRes(), vi.fn());

    expect(getTeacherAverageRatings).toHaveBeenCalledWith("teacher-1");
  });
});

describe("getTeacherFeedbackDetails", () => {
  it("Admin xem theo teacherId trong params", async () => {
    getFeedbackDetailsForAdmin.mockResolvedValue([]);
    const req = { params: { teacherId: "teacher-1" } };

    await getTeacherFeedbackDetails(req, buildRes(), vi.fn());

    expect(getFeedbackDetailsForAdmin).toHaveBeenCalledWith("teacher-1");
  });
});
