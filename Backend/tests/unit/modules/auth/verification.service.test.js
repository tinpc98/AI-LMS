// Test cho verification.service.js — EduSpace mechanism design Phần C.1/C.2 (BR-20, BR-22..24).
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const userFindById = vi.fn();
const userUpdateMany = vi.fn();
const classCountDocuments = vi.fn();
const classExists = vi.fn();

vi.mock("#modules/auth/user.model.js", () => ({
  default: {
    findById: (...a) => userFindById(...a),
    updateMany: (...a) => userUpdateMany(...a),
  },
}));
vi.mock("#modules/class", () => ({
  Class: {
    countDocuments: (...a) => classCountDocuments(...a),
    exists: (...a) => classExists(...a),
  },
}));

const {
  checkL3Eligibility,
  tryPromoteToL3,
  voucherForTeacher,
  suspendVouchersOf,
  L3_MIN_COMPLETED_COMMUNITY_COHORTS,
} = await import("#modules/auth/verification.service.js");

const TEACHER_ID = new mongoose.Types.ObjectId().toString();
const VOUCHER_ID = new mongoose.Types.ObjectId().toString();
const VOUCHEE_ID = new mongoose.Types.ObjectId().toString();

const mongooseLean = (result) => ({ lean: () => Promise.resolve(result) });

// Thenable hỗ trợ CẢ HAI cách gọi trong cùng 1 luồng test: `await User.findById(x)` trực tiếp
// (tryPromoteToL3 dùng bản ghi động có .save()) VÀ `await User.findById(x).lean()`
// (checkL3Eligibility gọi lại bên trong tryPromoteToL3/voucherForTeacher).
const mongooseFindResult = (result) => ({
  lean: () => Promise.resolve(result),
  then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("checkL3Eligibility", () => {
  it("Đủ cả 3 điều kiện → eligible=true", async () => {
    userFindById.mockReturnValue(
      mongooseLean({ _id: TEACHER_ID, poolStatus: "ACTIVE", vouchedBy: [VOUCHER_ID] })
    );
    classCountDocuments.mockResolvedValue(L3_MIN_COMPLETED_COMMUNITY_COHORTS);

    const result = await checkL3Eligibility(TEACHER_ID);

    expect(result.eligible).toBe(true);
  });

  it("Chưa đủ số cohort COMMUNITY hoàn thành → eligible=false", async () => {
    userFindById.mockReturnValue(
      mongooseLean({ _id: TEACHER_ID, poolStatus: "ACTIVE", vouchedBy: [VOUCHER_ID] })
    );
    classCountDocuments.mockResolvedValue(L3_MIN_COMPLETED_COMMUNITY_COHORTS - 1);

    const result = await checkL3Eligibility(TEACHER_ID);

    expect(result.eligible).toBe(false);
    expect(result.completedCommunityCohorts).toBe(L3_MIN_COMPLETED_COMMUNITY_COHORTS - 1);
  });

  it("poolStatus=REMOVED → eligible=false dù đủ cohort và có người bảo lãnh", async () => {
    userFindById.mockReturnValue(
      mongooseLean({ _id: TEACHER_ID, poolStatus: "REMOVED", vouchedBy: [VOUCHER_ID] })
    );
    classCountDocuments.mockResolvedValue(L3_MIN_COMPLETED_COMMUNITY_COHORTS);

    const result = await checkL3Eligibility(TEACHER_ID);

    expect(result.eligible).toBe(false);
    expect(result.notRemovedFromPool).toBe(false);
  });

  it("Chưa có ai bảo lãnh → eligible=false", async () => {
    userFindById.mockReturnValue(
      mongooseLean({ _id: TEACHER_ID, poolStatus: "ACTIVE", vouchedBy: [] })
    );
    classCountDocuments.mockResolvedValue(L3_MIN_COMPLETED_COMMUNITY_COHORTS);

    const result = await checkL3Eligibility(TEACHER_ID);

    expect(result.eligible).toBe(false);
    expect(result.hasAtLeastOneVoucher).toBe(false);
  });

  it("Giáo viên không tồn tại → NotFoundError", async () => {
    userFindById.mockReturnValue(mongooseLean(null));
    await expect(checkL3Eligibility(TEACHER_ID)).rejects.toMatchObject({ status: 404 });
  });
});

describe("tryPromoteToL3", () => {
  it("Đã là L3 → promoted=false, reason=ALREADY_L3, không gọi countDocuments", async () => {
    userFindById.mockResolvedValue({ _id: TEACHER_ID, verificationTier: "L3" });

    const result = await tryPromoteToL3(TEACHER_ID);

    expect(result).toEqual({ promoted: false, reason: "ALREADY_L3" });
    expect(classCountDocuments).not.toHaveBeenCalled();
  });

  it("Đủ điều kiện → nâng tầng L2 → L3 và lưu lại", async () => {
    const teacher = {
      _id: TEACHER_ID,
      verificationTier: "L2",
      poolStatus: "ACTIVE",
      vouchedBy: [VOUCHER_ID],
      save: vi.fn().mockResolvedValue(true),
    };
    // tryPromoteToL3 gọi findById 1 lần (bản ghi động, có .save), checkL3Eligibility gọi lại
    // findById lần 2 (dùng .lean()) — phải trả đúng shape cho cả 2 lượt gọi.
    userFindById.mockImplementation(() => {
      const call = userFindById.mock.calls.length;
      if (call === 1) return Promise.resolve(teacher);
      return mongooseLean(teacher);
    });
    classCountDocuments.mockResolvedValue(L3_MIN_COMPLETED_COMMUNITY_COHORTS);

    const result = await tryPromoteToL3(TEACHER_ID);

    expect(result.promoted).toBe(true);
    expect(teacher.verificationTier).toBe("L3");
    expect(teacher.save).toHaveBeenCalled();
  });

  it("Chưa đủ điều kiện → promoted=false, KHÔNG đổi verificationTier", async () => {
    const teacher = {
      _id: TEACHER_ID,
      verificationTier: "L2",
      poolStatus: "ACTIVE",
      vouchedBy: [],
      save: vi.fn(),
    };
    userFindById.mockImplementation(() => {
      const call = userFindById.mock.calls.length;
      if (call === 1) return Promise.resolve(teacher);
      return mongooseLean(teacher);
    });
    classCountDocuments.mockResolvedValue(L3_MIN_COMPLETED_COMMUNITY_COHORTS);

    const result = await tryPromoteToL3(TEACHER_ID);

    expect(result.promoted).toBe(false);
    expect(teacher.verificationTier).toBe("L2");
    expect(teacher.save).not.toHaveBeenCalled();
  });
});

describe("voucherForTeacher — BR-22/BR-23", () => {
  const makeVoucher = (over = {}) => ({
    _id: VOUCHER_ID,
    verificationTier: "L3",
    vouchSuspendedUntil: null,
    vouchLimit: 2,
    save: vi.fn().mockResolvedValue(true),
    ...over,
  });
  const makeVouchee = (over = {}) => ({
    _id: VOUCHEE_ID,
    verificationTier: "L1",
    poolStatus: "ACTIVE",
    vouchedBy: [],
    save: vi.fn().mockResolvedValue(true),
    ...over,
  });

  it("Bảo lãnh thành công khi đủ điều kiện + đã đồng dạy chung", async () => {
    const voucher = makeVoucher();
    const vouchee = makeVouchee();
    // dùng mongooseFindResult vì sau khi bảo lãnh, service tự gọi tryPromoteToL3(vouchee) ->
    // checkL3Eligibility gọi lại User.findById(vouchee).lean() trên CÙNG object này.
    userFindById.mockImplementation((id) => {
      if (id === VOUCHER_ID) return mongooseFindResult(voucher);
      if (id === VOUCHEE_ID) return mongooseFindResult(vouchee);
      return mongooseFindResult(null);
    });
    classExists.mockResolvedValue(true);
    classCountDocuments.mockResolvedValue(0); // vouchee chưa đủ cohort -> chưa lên L3 ngay

    const result = await voucherForTeacher(VOUCHER_ID, VOUCHEE_ID);

    expect(vouchee.vouchedBy).toContain(VOUCHER_ID);
    expect(voucher.vouchLimit).toBe(1);
    expect(result.promotion.promoted).toBe(false); // chưa đủ cohort
  });

  it("BR-22: chưa từng đồng dạy/dự bị chung → BusinessRuleError", async () => {
    userFindById.mockImplementation((id) => {
      if (id === VOUCHER_ID) return Promise.resolve(makeVoucher());
      if (id === VOUCHEE_ID) return Promise.resolve(makeVouchee());
      return Promise.resolve(null);
    });
    classExists.mockResolvedValue(false);

    await expect(voucherForTeacher(VOUCHER_ID, VOUCHEE_ID)).rejects.toMatchObject({ status: 422 });
  });

  it("Voucher không phải L3 → BusinessRuleError", async () => {
    userFindById.mockImplementation((id) => {
      if (id === VOUCHER_ID) return Promise.resolve(makeVoucher({ verificationTier: "L2" }));
      if (id === VOUCHEE_ID) return Promise.resolve(makeVouchee());
      return Promise.resolve(null);
    });

    await expect(voucherForTeacher(VOUCHER_ID, VOUCHEE_ID)).rejects.toMatchObject({ status: 422 });
  });

  it("BR-23: hết hạn mức bảo lãnh (vouchLimit=0) → BusinessRuleError", async () => {
    userFindById.mockImplementation((id) => {
      if (id === VOUCHER_ID) return Promise.resolve(makeVoucher({ vouchLimit: 0 }));
      if (id === VOUCHEE_ID) return Promise.resolve(makeVouchee());
      return Promise.resolve(null);
    });

    await expect(voucherForTeacher(VOUCHER_ID, VOUCHEE_ID)).rejects.toMatchObject({ status: 422 });
  });

  it("BR-24: đang bị tạm khóa quyền bảo lãnh → BusinessRuleError", async () => {
    userFindById.mockImplementation((id) => {
      if (id === VOUCHER_ID)
        return Promise.resolve(makeVoucher({ vouchSuspendedUntil: new Date(Date.now() + 999999) }));
      if (id === VOUCHEE_ID) return Promise.resolve(makeVouchee());
      return Promise.resolve(null);
    });

    await expect(voucherForTeacher(VOUCHER_ID, VOUCHEE_ID)).rejects.toMatchObject({ status: 422 });
  });

  it("Không cho tự bảo lãnh cho chính mình", async () => {
    await expect(voucherForTeacher(VOUCHER_ID, VOUCHER_ID)).rejects.toMatchObject({ status: 400 });
    expect(userFindById).not.toHaveBeenCalled();
  });

  it("Đã bảo lãnh cho người này rồi → BusinessRuleError, không bảo lãnh trùng", async () => {
    userFindById.mockImplementation((id) => {
      if (id === VOUCHER_ID) return Promise.resolve(makeVoucher());
      if (id === VOUCHEE_ID) return Promise.resolve(makeVouchee({ vouchedBy: [VOUCHER_ID] }));
      return Promise.resolve(null);
    });

    await expect(voucherForTeacher(VOUCHER_ID, VOUCHEE_ID)).rejects.toMatchObject({ status: 422 });
  });
});

describe("suspendVouchersOf — BR-24", () => {
  it("Đặt vouchSuspendedUntil cho tất cả người từng bảo lãnh, không đụng reliabilityScore/vouchLimit", async () => {
    userFindById.mockReturnValue(mongooseLean({ vouchedBy: [VOUCHER_ID, "voucher-2"] }));
    userUpdateMany.mockResolvedValue({ modifiedCount: 2 });

    const result = await suspendVouchersOf(TEACHER_ID);

    expect(result.suspendedVoucherIds).toEqual([VOUCHER_ID, "voucher-2"]);
    expect(userUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: [VOUCHER_ID, "voucher-2"] } },
      { $set: { vouchSuspendedUntil: expect.any(Date) } }
    );
  });

  it("Không có ai từng bảo lãnh → không gọi updateMany", async () => {
    userFindById.mockReturnValue(mongooseLean({ vouchedBy: [] }));

    const result = await suspendVouchersOf(TEACHER_ID);

    expect(result.suspendedVoucherIds).toEqual([]);
    expect(userUpdateMany).not.toHaveBeenCalled();
  });
});
