import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";
import { AssignTeacher, UnassignTeacher } from "#modules/class/class.controller.js";
import * as classRepo from "#modules/class/class.repository.js";
import { User } from "#modules/auth";

// class.controller.js còn import Course/classEnrollment model/class.service/classProgress.service/
// storage.service, nhưng không mock — đã xác nhận cả module load sạch không cần kết nối DB
// (node --eval import(...) chạy qua được), nên hai mock dưới đây là đủ cho 2 endpoint đang test.
vi.mock("#modules/class/class.repository.js", () => ({
  findClassById: vi.fn(),
  updateClassByIdPopulated: vi.fn(),
}));
vi.mock("#modules/auth", () => ({
  User: { findOne: vi.fn() },
}));

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("class.controller — AssignTeacher/UnassignTeacher", () => {
  const CLASS_ID = new mongoose.Types.ObjectId().toString();
  const TEACHER_ID = new mongoose.Types.ObjectId().toString();
  const ADMIN_ID = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("AssignTeacher", () => {
    const buildReq = (overrides = {}) => ({
      params: { id: CLASS_ID },
      body: { teacherId: TEACHER_ID },
      user: { id: ADMIN_ID },
      ...overrides,
    });

    it("báo 400 khi classId không phải ObjectId hợp lệ", async () => {
      const req = buildReq({ params: { id: "not-an-id" } });
      const res = buildRes();

      await AssignTeacher(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("báo 400 khi teacherId không phải ObjectId hợp lệ", async () => {
      const req = buildReq({ body: { teacherId: "not-an-id" } });
      const res = buildRes();

      await AssignTeacher(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("báo 404 khi lớp học không tồn tại", async () => {
      classRepo.findClassById.mockResolvedValue(null);
      const res = buildRes();

      await AssignTeacher(buildReq(), res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it.each(["CLOSED", "ARCHIVED"])(
      "báo 400 khi lớp đang ở trạng thái %s (không cho phân công)",
      async (status) => {
        classRepo.findClassById.mockResolvedValue({ status });
        const res = buildRes();

        await AssignTeacher(buildReq(), res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(classRepo.updateClassByIdPopulated).not.toHaveBeenCalled();
      }
    );

    it("báo 400 khi id truyền vào không phải giáo viên (role khác Teacher)", async () => {
      classRepo.findClassById.mockResolvedValue({ status: "OPEN" });
      User.findOne.mockResolvedValue(null); // không tìm thấy Teacher hợp lệ
      const res = buildRes();

      await AssignTeacher(buildReq(), res, vi.fn());

      expect(User.findOne).toHaveBeenCalledWith({
        _id: TEACHER_ID,
        role: "Teacher",
        isDeleted: false,
      });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(classRepo.updateClassByIdPopulated).not.toHaveBeenCalled();
    });

    it.each(["DRAFT", "OPEN", "FULL"])(
      "gán thành công khi lớp ở trạng thái %s và teacherId hợp lệ",
      async (status) => {
        classRepo.findClassById.mockResolvedValue({ status });
        User.findOne.mockResolvedValue({ _id: TEACHER_ID, role: "Teacher" });
        const updatedClass = { _id: CLASS_ID, teacherId: TEACHER_ID };
        classRepo.updateClassByIdPopulated.mockResolvedValue(updatedClass);
        const res = buildRes();

        await AssignTeacher(buildReq(), res, vi.fn());

        expect(classRepo.updateClassByIdPopulated).toHaveBeenCalledWith(
          CLASS_ID,
          expect.objectContaining({ teacherId: TEACHER_ID, assignedBy: ADMIN_ID })
        );
        expect(res.status).toHaveBeenCalledWith(200);
      }
    );
  });

  describe("UnassignTeacher", () => {
    const buildReq = (overrides = {}) => ({
      params: { id: CLASS_ID },
      user: { id: ADMIN_ID },
      ...overrides,
    });

    it("báo 400 khi classId không phải ObjectId hợp lệ", async () => {
      const res = buildRes();

      await UnassignTeacher(buildReq({ params: { id: "not-an-id" } }), res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("báo 404 khi lớp học không tồn tại", async () => {
      classRepo.findClassById.mockResolvedValue(null);
      const res = buildRes();

      await UnassignTeacher(buildReq(), res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(404);
    });

    // Đây chính là bug đã sửa: bản cũ so allowedStatuses với ["Draft","Ready","Ongoing"] —
    // không khớp bất kỳ giá trị enum thật nào (DRAFT/OPEN/FULL/CLOSED/ARCHIVED), nên MỌI lớp
    // học, kể cả đang ở trạng thái hợp lệ, đều bị từ chối gỡ giáo viên. Test dưới khoá lại để
    // không ai vô tình đưa allowedStatuses lệch khỏi enum thật lần nữa.
    it.each(["DRAFT", "OPEN", "FULL"])(
      "gỡ giáo viên thành công khi lớp ở trạng thái hợp lệ %s (bug cũ: luôn báo lỗi ở đây)",
      async (status) => {
        classRepo.findClassById.mockResolvedValue({ status });
        const updatedClass = { _id: CLASS_ID, teacherId: null };
        classRepo.updateClassByIdPopulated.mockResolvedValue(updatedClass);
        const res = buildRes();

        await UnassignTeacher(buildReq(), res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(200);
        expect(classRepo.updateClassByIdPopulated).toHaveBeenCalledWith(
          CLASS_ID,
          expect.objectContaining({
            $set: { teacherId: null, assignedBy: null, assignedAt: null },
          })
        );
      }
    );

    it.each(["CLOSED", "ARCHIVED"])(
      "báo 400 khi lớp đang ở trạng thái %s (không cho gỡ giáo viên lớp đã đóng)",
      async (status) => {
        classRepo.findClassById.mockResolvedValue({ status });
        const res = buildRes();

        await UnassignTeacher(buildReq(), res, vi.fn());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(classRepo.updateClassByIdPopulated).not.toHaveBeenCalled();
      }
    );
  });
});
