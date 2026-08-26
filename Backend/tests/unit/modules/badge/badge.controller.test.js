// Test cho badge.controller.js#getStudentRanking — chốt lỗ hổng bảo mật thật đã tìm và sửa
// trong đợt review toàn dự án: trước đây endpoint này không kiểm quyền gì cả, bất kỳ ai đăng
// nhập cũng xem được thứ hạng (kèm họ tên/email/điểm XP) của học sinh bất kỳ trong lớp bất kỳ.
import { describe, it, expect, vi, beforeEach } from "vitest";

const classExists = vi.fn();
const enrollmentExists = vi.fn();
const getStudentRankingService = vi.fn();

vi.mock("#modules/class", () => ({
  Class: { exists: (...a) => classExists(...a) },
}));
vi.mock("#modules/classEnrollment", () => ({
  ClassEnrollment: { exists: (...a) => enrollmentExists(...a) },
}));
vi.mock("#modules/badge/learningRanking.service.js", () => ({
  default: { getStudentRanking: (...a) => getStudentRankingService(...a) },
}));
vi.mock("#modules/badge/gamification.service.js", () => ({ default: {} }));
vi.mock("#modules/badge/learningActivity.model.js", () => ({ default: {} }));

const { getStudentRanking } = await import("#modules/badge/badge.controller.js");

const CLASS_ID = "60f7a3b8c9d2e1f0a1b2c3d4";
const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
  getStudentRankingService.mockResolvedValue({ rank: 1 });
});

describe("getStudentRanking — kiểm quyền", () => {
  it("BUG ĐÃ SỬA: Học sinh cố xem thứ hạng của HỌC SINH KHÁC → 403, không gọi tới service", async () => {
    const req = {
      params: { studentId: "another-student" },
      query: { classId: CLASS_ID },
      user: { id: "me", role: "student" },
    };
    const res = buildRes();

    await getStudentRanking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(getStudentRankingService).not.toHaveBeenCalled();
  });

  it("Học sinh xem thứ hạng CHÍNH MÌNH nhưng KHÔNG thuộc lớp → 403", async () => {
    enrollmentExists.mockResolvedValue(null);
    const req = {
      params: { studentId: "me" },
      query: { classId: CLASS_ID },
      user: { id: "me", role: "student" },
    };
    const res = buildRes();

    await getStudentRanking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("Học sinh xem thứ hạng chính mình VÀ đang ACTIVE trong lớp → cho phép", async () => {
    enrollmentExists.mockResolvedValue(true);
    const req = {
      params: { studentId: "me" },
      query: { classId: CLASS_ID },
      user: { id: "me", role: "student" },
    };
    const res = buildRes();

    await getStudentRanking(req, res);

    expect(getStudentRankingService).toHaveBeenCalledWith(CLASS_ID, "me");
  });

  it("Giáo viên KHÔNG phụ trách lớp → 403", async () => {
    classExists.mockResolvedValue(null);
    const req = {
      params: { studentId: "some-student" },
      query: { classId: CLASS_ID },
      user: { id: "teacher-1", role: "teacher" },
    };
    const res = buildRes();

    await getStudentRanking(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("Giáo viên phụ trách lớp → xem được thứ hạng học sinh bất kỳ trong lớp đó", async () => {
    classExists.mockResolvedValue(true);
    const req = {
      params: { studentId: "some-student" },
      query: { classId: CLASS_ID },
      user: { id: "teacher-1", role: "teacher" },
    };
    const res = buildRes();

    await getStudentRanking(req, res);

    expect(getStudentRankingService).toHaveBeenCalledWith(CLASS_ID, "some-student");
  });

  it("Admin luôn được phép, không kiểm gì thêm", async () => {
    const req = {
      params: { studentId: "some-student" },
      query: { classId: CLASS_ID },
      user: { id: "admin-1", role: "admin" },
    };
    const res = buildRes();

    await getStudentRanking(req, res);

    expect(classExists).not.toHaveBeenCalled();
    expect(enrollmentExists).not.toHaveBeenCalled();
    expect(getStudentRankingService).toHaveBeenCalledWith(CLASS_ID, "some-student");
  });
});
