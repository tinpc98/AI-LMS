import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import {
  createLearnerNeed,
  getMyLearnerNeeds,
  listLearnerNeeds,
  cancelMyLearnerNeed,
  updateLearnerNeedStatus,
} from "#modules/learnerNeed/learnerNeed.service.js";
import LearnerNeed from "#modules/learnerNeed/learnerNeed.model.js";
import { NotFoundError, AuthorizationError } from "#shared/utils/appError.js";

vi.mock("#modules/learnerNeed/learnerNeed.model.js", () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
  },
}));

describe("learnerNeed.service", () => {
  const STUDENT_ID = new mongoose.Types.ObjectId().toString();
  const OTHER_STUDENT_ID = new mongoose.Types.ObjectId().toString();
  const NEED_ID = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createLearnerNeed", () => {
    it("gán studentId từ tham số, không lấy từ payload", async () => {
      LearnerNeed.create.mockResolvedValue({ _id: NEED_ID });

      await createLearnerNeed(STUDENT_ID, {
        subject: "Toán",
        goal: "Yếu hình học",
        currentLevel: "Lớp 9",
        preferredFormat: "ONLINE",
        preferredTimes: {},
        note: "",
      });

      expect(LearnerNeed.create).toHaveBeenCalledWith(
        expect.objectContaining({ studentId: STUDENT_ID, subject: "Toán", goal: "Yếu hình học" })
      );
    });
  });

  describe("getMyLearnerNeeds", () => {
    it("chỉ lọc theo studentId, sắp xếp mới nhất trước", async () => {
      const sort = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) });
      LearnerNeed.find.mockReturnValue({ sort });

      await getMyLearnerNeeds(STUDENT_ID);

      expect(LearnerNeed.find).toHaveBeenCalledWith({ studentId: STUDENT_ID });
      expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  describe("listLearnerNeeds", () => {
    it("mặc định chỉ lấy status OPEN khi không truyền filter", async () => {
      const populate = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      LearnerNeed.find.mockReturnValue({ populate });

      await listLearnerNeeds({});

      expect(LearnerNeed.find).toHaveBeenCalledWith({ status: "OPEN" });
    });

    it("cho phép lọc theo subject (không phân biệt hoa/thường)", async () => {
      const populate = vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }),
      });
      LearnerNeed.find.mockReturnValue({ populate });

      await listLearnerNeeds({ subject: "toán", status: "MATCHED" });

      expect(LearnerNeed.find).toHaveBeenCalledWith({
        subject: { $regex: "toán", $options: "i" },
        status: "MATCHED",
      });
    });
  });

  describe("cancelMyLearnerNeed", () => {
    it("báo NotFoundError khi nhu cầu không tồn tại", async () => {
      LearnerNeed.findById.mockResolvedValue(null);

      await expect(cancelMyLearnerNeed(STUDENT_ID, NEED_ID)).rejects.toBeInstanceOf(NotFoundError);
    });

    it("báo AuthorizationError khi học viên khác cố huỷ nhu cầu không phải của mình", async () => {
      LearnerNeed.findById.mockResolvedValue({
        _id: NEED_ID,
        studentId: STUDENT_ID,
        status: "OPEN",
        save: vi.fn(),
      });

      await expect(cancelMyLearnerNeed(OTHER_STUDENT_ID, NEED_ID)).rejects.toBeInstanceOf(
        AuthorizationError
      );
    });

    it("chuyển status sang CLOSED và lưu lại khi chủ sở hữu huỷ đúng nhu cầu của mình", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const need = { _id: NEED_ID, studentId: STUDENT_ID, status: "OPEN", save };
      LearnerNeed.findById.mockResolvedValue(need);

      const result = await cancelMyLearnerNeed(STUDENT_ID, NEED_ID);

      expect(need.status).toBe("CLOSED");
      expect(save).toHaveBeenCalledTimes(1);
      expect(result).toBe(need);
    });
  });

  describe("updateLearnerNeedStatus", () => {
    it("báo NotFoundError khi nhu cầu không tồn tại", async () => {
      LearnerNeed.findById.mockResolvedValue(null);

      await expect(updateLearnerNeedStatus(NEED_ID, "MATCHED")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });

    it("cập nhật đúng status truyền vào và lưu lại", async () => {
      const save = vi.fn().mockResolvedValue(undefined);
      const need = { _id: NEED_ID, status: "OPEN", save };
      LearnerNeed.findById.mockResolvedValue(need);

      await updateLearnerNeedStatus(NEED_ID, "MATCHED");

      expect(need.status).toBe("MATCHED");
      expect(save).toHaveBeenCalledTimes(1);
    });
  });
});
