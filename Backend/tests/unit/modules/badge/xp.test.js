// Test cho xp.js — TÍNH NĂNG MỚI (mục 5): trần XP/ngày, công thức level.
import { describe, it, expect } from "vitest";
import {
  clampToDailyCap,
  computeXpForNextLevel,
  computeLevelFromXp,
  DAILY_XP_CAP,
} from "#modules/badge/xp.js";

describe("clampToDailyCap", () => {
  it("Chưa cộng gì hôm nay → cộng đủ mức danh nghĩa", () => {
    expect(clampToDailyCap(20, 0)).toBe(20);
  });

  it("Còn đủ chỗ trống dưới trần → cộng đủ", () => {
    expect(clampToDailyCap(20, 200)).toBe(20);
  });

  it("Cộng thêm sẽ vượt trần → chỉ cộng phần còn lại", () => {
    expect(clampToDailyCap(20, 290)).toBe(10);
  });

  it("Đã chạm hoặc vượt trần → cộng thêm 0, không âm", () => {
    expect(clampToDailyCap(20, DAILY_XP_CAP)).toBe(0);
    expect(clampToDailyCap(20, DAILY_XP_CAP + 50)).toBe(0);
  });
});

describe("computeXpForNextLevel", () => {
  it("Level 1 cần 100 XP để lên Level 2 (100 * 1^1.5)", () => {
    expect(computeXpForNextLevel(1)).toBe(100);
  });

  it("Level 4 cần 800 XP (100 * 4^1.5 = 800)", () => {
    expect(computeXpForNextLevel(4)).toBe(800);
  });
});

describe("computeLevelFromXp", () => {
  it("0 XP → Level 1, chưa có XP nào vào level", () => {
    expect(computeLevelFromXp(0)).toEqual({ level: 1, xpIntoLevel: 0, xpForNextLevel: 100 });
  });

  it("99 XP → vẫn Level 1 (chưa đủ 100 để lên Level 2)", () => {
    const result = computeLevelFromXp(99);
    expect(result.level).toBe(1);
    expect(result.xpIntoLevel).toBe(99);
  });

  it("Đúng 100 XP → lên Level 2, dư 0", () => {
    expect(computeLevelFromXp(100)).toEqual({ level: 2, xpIntoLevel: 0, xpForNextLevel: 283 });
  });

  it("XP âm/undefined → coi như 0, không throw", () => {
    expect(computeLevelFromXp(-10).level).toBe(1);
    expect(computeLevelFromXp(undefined).level).toBe(1);
  });
});
