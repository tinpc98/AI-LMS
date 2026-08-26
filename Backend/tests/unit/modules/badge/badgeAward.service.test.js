// Test cho badgeAward.service.js — TÍNH NĂNG MỚI (mục 4): điều kiện trao 6 badge, đếm mốc qua
// sổ cái XP (LearningActivity) đã có sẵn từ mục 5 thay vì đếm lại từ nguồn gốc.
import { describe, it, expect, vi, beforeEach } from "vitest";

const countDocuments = vi.fn();
const awardBadge = vi.fn();

vi.mock("#modules/badge/learningActivity.model.js", () => ({
  default: { countDocuments: (...a) => countDocuments(...a) },
}));
vi.mock("#modules/badge/gamification.service.js", () => ({
  default: { awardBadge: (...a) => awardBadge(...a) },
}));

const {
  checkAndAwardGettingStartedBadge,
  checkAndAwardPerfectScoreBadge,
  checkAndAwardConquerorBadge,
  checkAndAwardPersistentBadge,
  checkAndAwardDiligentBadge,
  checkAndAwardOnTimeBadge,
} = await import("#modules/badge/badgeAward.service.js");

const STUDENT_ID = "student-1";

beforeEach(() => {
  vi.clearAllMocks();
  awardBadge.mockResolvedValue({ _id: "badge-1" });
});

describe("Badge không cần đếm mốc — gọi award trực tiếp, dedup ở tầng DB", () => {
  it("Khởi đầu", async () => {
    await checkAndAwardGettingStartedBadge(STUDENT_ID);
    expect(awardBadge).toHaveBeenCalledWith(
      STUDENT_ID,
      "GETTING_STARTED",
      "Milestone",
      "Khởi đầu",
      expect.any(String),
      expect.any(String)
    );
  });

  it("Điểm tuyệt đối", async () => {
    await checkAndAwardPerfectScoreBadge(STUDENT_ID);
    expect(awardBadge).toHaveBeenCalledWith(
      STUDENT_ID,
      "PERFECT_SCORE",
      "Achievement",
      "Điểm tuyệt đối",
      expect.any(String),
      expect.any(String)
    );
  });

  it("Chinh phục", async () => {
    await checkAndAwardConquerorBadge(STUDENT_ID);
    expect(awardBadge).toHaveBeenCalledWith(
      STUDENT_ID,
      "CONQUEROR",
      "Milestone",
      "Chinh phục",
      expect.any(String),
      expect.any(String)
    );
  });

  it("Bền bỉ", async () => {
    await checkAndAwardPersistentBadge(STUDENT_ID);
    expect(awardBadge).toHaveBeenCalledWith(
      STUDENT_ID,
      "PERSISTENT",
      "Achievement",
      "Bền bỉ",
      expect.any(String),
      expect.any(String)
    );
  });
});

describe("checkAndAwardDiligentBadge — đủ 10 lần điểm danh PRESENT", () => {
  it("Chưa đủ 10 lần → không trao", async () => {
    countDocuments.mockResolvedValue(9);
    await checkAndAwardDiligentBadge(STUDENT_ID);
    expect(awardBadge).not.toHaveBeenCalled();
    expect(countDocuments).toHaveBeenCalledWith({
      studentId: STUDENT_ID,
      activityType: "Attendance Present",
    });
  });

  it("Vừa đủ 10 lần → trao badge", async () => {
    countDocuments.mockResolvedValue(10);
    await checkAndAwardDiligentBadge(STUDENT_ID);
    expect(awardBadge).toHaveBeenCalledWith(
      STUDENT_ID,
      "DILIGENT",
      "Achievement",
      "Chuyên cần",
      expect.any(String),
      expect.any(String)
    );
  });
});

describe("checkAndAwardOnTimeBadge — đủ 5 lần nộp bài đúng hạn", () => {
  it("Chưa đủ 5 lần → không trao", async () => {
    countDocuments.mockResolvedValue(4);
    await checkAndAwardOnTimeBadge(STUDENT_ID);
    expect(awardBadge).not.toHaveBeenCalled();
    expect(countDocuments).toHaveBeenCalledWith({
      studentId: STUDENT_ID,
      sourceRef: { $regex: /^assignment-ontime:/ },
    });
  });

  it("Đủ 5 lần trở lên → trao badge", async () => {
    countDocuments.mockResolvedValue(5);
    await checkAndAwardOnTimeBadge(STUDENT_ID);
    expect(awardBadge).toHaveBeenCalledWith(
      STUDENT_ID,
      "ON_TIME",
      "Achievement",
      "Đúng hạn",
      expect.any(String),
      expect.any(String)
    );
  });
});
