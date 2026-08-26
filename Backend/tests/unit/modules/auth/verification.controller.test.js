// Test "nối dây" cho verification.controller.js — business logic đã test đầy đủ ở
// verification.service.test.js.
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkL3Eligibility = vi.fn();
const tryPromoteToL3 = vi.fn();
const voucherForTeacher = vi.fn();
const suspendVouchersOf = vi.fn();

vi.mock("#modules/auth/verification.service.js", () => ({
  checkL3Eligibility: (...a) => checkL3Eligibility(...a),
  tryPromoteToL3: (...a) => tryPromoteToL3(...a),
  voucherForTeacher: (...a) => voucherForTeacher(...a),
  suspendVouchersOf: (...a) => suspendVouchersOf(...a),
}));

const { getL3Eligibility, promoteToL3, vouchForTeacher, suspendTeacherVouchers } =
  await import("#modules/auth/verification.controller.js");

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("vouchForTeacher", () => {
  it("voucherId LUÔN lấy từ req.user, KHÔNG lấy từ body — chặn giả danh", async () => {
    voucherForTeacher.mockResolvedValue({ promotion: { promoted: false } });
    const req = {
      user: { id: "real-teacher-l3" },
      // Cố ý gửi voucherId giả trong body để chứng minh controller bỏ qua nó hoàn toàn.
      body: { voucherId: "ke-gia-danh", voucheeId: "vouchee-1" },
    };

    await vouchForTeacher(req, buildRes(), vi.fn());

    expect(voucherForTeacher).toHaveBeenCalledWith("real-teacher-l3", "vouchee-1");
  });

  it("Thiếu voucheeId → ValidationError qua next()", async () => {
    const req = { user: { id: "teacher-1" }, body: {} };
    const next = vi.fn();

    await vouchForTeacher(req, buildRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(voucherForTeacher).not.toHaveBeenCalled();
  });
});

describe("getL3Eligibility / promoteToL3", () => {
  it("getL3Eligibility: trích id, gọi service, trả data", async () => {
    checkL3Eligibility.mockResolvedValue({ eligible: true });
    const req = { params: { id: "teacher-1" } };
    const res = buildRes();

    await getL3Eligibility(req, res, vi.fn());

    expect(checkL3Eligibility).toHaveBeenCalledWith("teacher-1");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { eligible: true } }));
  });

  it("promoteToL3: message khác nhau tùy promoted true/false", async () => {
    tryPromoteToL3.mockResolvedValue({ promoted: true });
    const req = { params: { id: "teacher-1" } };
    const res = buildRes();

    await promoteToL3(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Đã nâng tầng") })
    );
  });
});

describe("suspendTeacherVouchers", () => {
  it("Trích id, gọi service", async () => {
    suspendVouchersOf.mockResolvedValue({ suspendedVoucherIds: ["v1"] });
    const req = { params: { id: "teacher-1" } };

    await suspendTeacherVouchers(req, buildRes(), vi.fn());

    expect(suspendVouchersOf).toHaveBeenCalledWith("teacher-1");
  });
});
