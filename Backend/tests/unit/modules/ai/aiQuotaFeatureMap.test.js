// Chốt tầng kiểm cờ tính năng và hạn mức AI (§6.x Wave 6).
//
// Test đáng giá nhất ở đây là "tên feature lạ phải NỔ". Bản cũ viết
// `FEATURE_FLAG_MAP[feature] || feature` rồi so `=== false`, nên một tên gõ nhầm cho ra
// undefined và hàm ĐI TIẾP như thể tính năng đang bật. Tầng bảo vệ vẫn chạy, vẫn trả "cho
// phép", chỉ là không còn bảo vệ gì — kiểu hỏng khó phát hiện nhất.
import { describe, it, expect, vi, beforeEach } from "vitest";

const findOne = vi.fn();
const create = vi.fn();
const quotaFindOne = vi.fn();

vi.mock("#modules/ai/models/aiConfig.model.js", () => ({
  default: {
    findOne: (...a) => findOne(...a),
    create: (...a) => create(...a),
  },
}));
vi.mock("#modules/ai/models/aiDailyQuota.model.js", () => ({
  default: { findOne: (...a) => quotaFindOne(...a) },
}));
vi.mock("#modules/ai/models/aiUsage.model.js", () => ({ default: {} }));

const aiUsageServiceModule = await import("#modules/ai/services/aiUsage.service.js");
const aiUsageService = aiUsageServiceModule.default;
const { FEATURE_FLAG_MAP } = aiUsageServiceModule;

const CAU_HINH_MAC_DINH = {
  isGloballyEnabled: true,
  featureFlags: {
    summary: true,
    questionGen: true,
    examGen: true,
    grading: true,
    chatbot: true,
    knowledgeIndex: true,
  },
  roleQuotas: { teacherDailyQuota: 100, studentDailyQuota: 30, adminDailyQuota: 500 },
};

const datCauHinh = (over = {}) =>
  findOne.mockResolvedValue({
    ...CAU_HINH_MAC_DINH,
    ...over,
    featureFlags: { ...CAU_HINH_MAC_DINH.featureFlags, ...(over.featureFlags || {}) },
  });

beforeEach(() => {
  findOne.mockReset();
  create.mockReset();
  quotaFindOne.mockReset().mockResolvedValue(null);
  datCauHinh();
});

describe("FEATURE_FLAG_MAP", () => {
  it("mọi tên feature dùng ở tầng route đều có trong bảng ánh xạ", () => {
    // Danh sách này khớp với các lời gọi checkAIQuota(...) trong src/modules/ai/routes/.
    for (const feature of [
      "summary",
      "question-gen",
      "exam-gen",
      "grading",
      "chatbot",
      "knowledge-index",
    ]) {
      expect(FEATURE_FLAG_MAP[feature], `thiếu ánh xạ cho "${feature}"`).toBeTruthy();
    }
  });

  it("mỗi feature ánh xạ tới một cờ riêng, không hai cái dùng chung", () => {
    // Dùng chung cờ nghĩa là tắt tính năng này sẽ tắt luôn tính năng kia.
    const flags = Object.values(FEATURE_FLAG_MAP);
    expect(new Set(flags).size).toBe(flags.length);
  });
});

describe("checkUserQuota — tên feature không hợp lệ", () => {
  it("tên lạ thì NỔ, không lặng lẽ cho qua", async () => {
    await expect(aiUsageService.checkUserQuota("u1", "teacher", "khong-ton-tai")).rejects.toThrow(
      /không hợp lệ/
    );
  });

  it("thông báo lỗi liệt kê các giá trị hợp lệ để sửa nhanh", async () => {
    await expect(aiUsageService.checkUserQuota("u1", "teacher", "sumary")).rejects.toThrow(
      /knowledge-index/
    );
  });

  it.each(Object.keys(FEATURE_FLAG_MAP))("feature hợp lệ %s đi qua được", async (feature) => {
    await expect(aiUsageService.checkUserQuota("u1", "teacher", feature)).resolves.toMatchObject({
      allowed: true,
    });
  });
});

describe("checkUserQuota — cờ tính năng", () => {
  it("tắt knowledgeIndex thì chặn đúng tính năng đó", async () => {
    datCauHinh({ featureFlags: { knowledgeIndex: false } });

    await expect(aiUsageService.checkUserQuota("u1", "teacher", "knowledge-index")).rejects.toThrow(
      /tạm khóa/
    );
  });

  it("tắt knowledgeIndex KHÔNG ảnh hưởng các tính năng khác", async () => {
    datCauHinh({ featureFlags: { knowledgeIndex: false } });

    await expect(aiUsageService.checkUserQuota("u1", "teacher", "summary")).resolves.toMatchObject({
      allowed: true,
    });
  });

  it("tắt AI toàn hệ thống thì chặn tất cả", async () => {
    datCauHinh({ isGloballyEnabled: false });

    await expect(aiUsageService.checkUserQuota("u1", "teacher", "knowledge-index")).rejects.toThrow(
      /toàn hệ thống/
    );
  });
});

describe("checkUserQuota — hạn mức theo ngày", () => {
  it("còn lượt thì cho qua và báo số lượt còn lại", async () => {
    quotaFindOne.mockResolvedValue({ usageCount: 10 });

    await expect(
      aiUsageService.checkUserQuota("u1", "teacher", "knowledge-index")
    ).resolves.toMatchObject({ allowed: true, remaining: 90, dailyLimit: 100 });
  });

  it("hết lượt thì chặn", async () => {
    quotaFindOne.mockResolvedValue({ usageCount: 100 });

    await expect(aiUsageService.checkUserQuota("u1", "teacher", "knowledge-index")).rejects.toThrow(
      /hết hạn mức/
    );
  });

  it("hạn mức khác nhau theo vai trò", async () => {
    quotaFindOne.mockResolvedValue({ usageCount: 40 });

    // Học sinh: 30 lượt/ngày -> 40 đã vượt
    await expect(aiUsageService.checkUserQuota("u1", "student", "chatbot")).rejects.toThrow(
      /hết hạn mức/
    );
    // Giáo viên: 100 lượt/ngày -> 40 vẫn còn
    await expect(aiUsageService.checkUserQuota("u1", "teacher", "chatbot")).resolves.toMatchObject({
      allowed: true,
    });
  });
});
