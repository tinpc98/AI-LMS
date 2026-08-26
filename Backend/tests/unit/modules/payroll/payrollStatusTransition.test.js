// Test cho confirmPayroll/payPayroll — chốt lỗi TOCTOU thật đã tìm và sửa trong đợt review toàn
// dự án: trước đây đọc-kiểm tra-ghi qua findById()+save() thường, không atomic, nên 2 request
// đồng thời có thể cùng "thắng" điều kiện status và ghi đè nhau. Sửa bằng findOneAndUpdate với
// status nằm ngay trong filter (chỉ 1 request khớp filter tại một thời điểm).
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const payrollFindById = vi.fn();
const payrollFindOneAndUpdate = vi.fn();
const payrollPeriodFindOne = vi.fn();
const payrollPeriodCreate = vi.fn();

vi.mock("#modules/payroll/payroll.model.js", () => ({
  default: {
    findById: (...a) => payrollFindById(...a),
    findOneAndUpdate: (...a) => payrollFindOneAndUpdate(...a),
  },
}));
vi.mock("#modules/payroll/payrollPeriod.model.js", () => ({
  default: {
    findOne: (...a) => payrollPeriodFindOne(...a),
    create: (...a) => payrollPeriodCreate(...a),
  },
}));
vi.mock("#modules/payroll/payrollConfig.model.js", () => ({ default: {} }));
vi.mock("#modules/teacherAttendance/teacherAttendance.model.js", () => ({ default: {} }));
vi.mock("#modules/classSession/classSession.model.js", () => ({ default: {} }));
vi.mock("#modules/class/class.model.js", () => ({ default: {} }));

const { default: payrollService } = await import("#modules/payroll/payroll.service.js");

const PAYROLL_ID = new mongoose.Types.ObjectId().toString();
const ADMIN_ID = new mongoose.Types.ObjectId().toString();

beforeEach(() => {
  vi.clearAllMocks();
});

describe("confirmPayroll — atomic status transition (TOCTOU)", () => {
  it("BUG ĐÃ SỬA — điều kiện status nằm trong filter của findOneAndUpdate, không phải if() rồi save() riêng", async () => {
    payrollFindById.mockResolvedValue({ _id: PAYROLL_ID, isDeleted: false, status: "CALCULATED" });
    payrollFindOneAndUpdate.mockResolvedValue({ _id: PAYROLL_ID, status: "CONFIRMED" });

    await payrollService.confirmPayroll(PAYROLL_ID, ADMIN_ID);

    expect(payrollFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: PAYROLL_ID, status: "CALCULATED", isDeleted: false },
      expect.objectContaining({ status: "CONFIRMED", confirmedBy: ADMIN_ID }),
      { new: true }
    );
  });

  it("2 request confirm đồng thời — request thứ 2 (status đã đổi) bị chặn thay vì ghi đè", async () => {
    payrollFindById.mockResolvedValue({ _id: PAYROLL_ID, isDeleted: false, status: "CALCULATED" });
    // Mô phỏng đúng hành vi Mongo thật: request đầu đã đổi status, filter của request 2 không còn khớp → null.
    payrollFindOneAndUpdate.mockResolvedValue(null);

    await expect(payrollService.confirmPayroll(PAYROLL_ID, ADMIN_ID)).rejects.toThrow(
      /phải ở trạng thái CALCULATED/
    );
  });
});

describe("payPayroll — atomic status transition (TOCTOU)", () => {
  it("Điều kiện status=CONFIRMED nằm trong filter", async () => {
    payrollFindById.mockResolvedValue({ _id: PAYROLL_ID, isDeleted: false, status: "CONFIRMED" });
    payrollFindOneAndUpdate.mockResolvedValue({ _id: PAYROLL_ID, status: "PAID" });

    await payrollService.payPayroll(PAYROLL_ID, ADMIN_ID);

    expect(payrollFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: PAYROLL_ID, status: "CONFIRMED", isDeleted: false },
      expect.objectContaining({ status: "PAID", paidBy: ADMIN_ID }),
      { new: true }
    );
  });

  it("Race: status đã đổi trước khi update atomic chạy → bị chặn", async () => {
    payrollFindById.mockResolvedValue({ _id: PAYROLL_ID, isDeleted: false, status: "CONFIRMED" });
    payrollFindOneAndUpdate.mockResolvedValue(null);

    await expect(payrollService.payPayroll(PAYROLL_ID, ADMIN_ID)).rejects.toThrow(
      /phải ở trạng thái CONFIRMED/
    );
  });
});

describe("createPayrollPeriod — BUG ĐÃ SỬA: chặn tạo kỳ lương chồng ngày (double-payment risk)", () => {
  const mongooseLean = (result) => ({ lean: () => Promise.resolve(result) });

  it("Chồng lấn với kỳ lương đã có → bị chặn, KHÔNG gọi create()", async () => {
    payrollPeriodFindOne.mockReturnValue(
      mongooseLean({
        name: "Tháng 09/2026",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-30"),
      })
    );

    await expect(
      payrollService.createPayrollPeriod({
        name: "Tháng 09/2026 (bản 2)",
        startDate: new Date("2026-09-15"),
        endDate: new Date("2026-10-15"),
      })
    ).rejects.toThrow(/chồng lấn/);
    expect(payrollPeriodCreate).not.toHaveBeenCalled();
  });

  it("Không chồng lấn → tạo bình thường", async () => {
    payrollPeriodFindOne.mockReturnValue(mongooseLean(null));
    payrollPeriodCreate.mockResolvedValue({ _id: "p1", name: "Tháng 10/2026" });

    const result = await payrollService.createPayrollPeriod({
      name: "Tháng 10/2026",
      startDate: new Date("2026-10-01"),
      endDate: new Date("2026-10-31"),
    });

    expect(payrollPeriodCreate).toHaveBeenCalled();
    expect(result._id).toBe("p1");
  });
});
