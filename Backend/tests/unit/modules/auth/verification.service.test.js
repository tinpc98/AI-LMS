// Test cho verification.service.js — EduSpace mechanism design Phần C.1/C.2 (BR-20, BR-22..24).
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const userFindById = vi.fn();
const userUpdateMany = vi.fn();
const userUpdateOne = vi.fn();
const userFindOneAndUpdate = vi.fn();
const classCountDocuments = vi.fn();
const classExists = vi.fn();
const classFind = vi.fn();

vi.mock("#modules/auth/user.model.js", () => ({
  default: {
    findById: (...a) => userFindById(...a),
    updateMany: (...a) => userUpdateMany(...a),
    updateOne: (...a) => userUpdateOne(...a),
    findOneAndUpdate: (...a) => userFindOneAndUpdate(...a),
  },
}));
vi.mock("#modules/class", () => ({
  Class: {
    countDocuments: (...a) => classCountDocuments(...a),
    exists: (...a) => classExists(...a),
    find: (...a) => classFind(...a),
  },
}));

const {
  checkL3Eligibility,
  tryPromoteToL3,
  voucherForTeacher,
  suspendVouchersOf,
  getOwnVerificationStatus,
  getCoTaughtColleagues,
  L3_MIN_COMPLETED_COMMUNITY_COHORTS,
} = await import("#modules/auth/verification.service.js");

// find().select().populate().populate().lean() — chainable giả cho getCoTaughtColleagues.
const mongooseFindChain = (result) => {
  const chain = {
    select: () => chain,
    populate: () => chain,
    lean: () => Promise.resolve(result),
  };
  return chain;
};

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

  it("Đủ điều kiện → nâng tầng L2 → L3, lưu lại, VÀ hoàn vouchLimit cho người đã bảo lãnh (BR-23)", async () => {
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
    expect(userUpdateMany).toHaveBeenCalledWith(
      { _id: { $in: [VOUCHER_ID] } },
      { $inc: { vouchLimit: 1 } }
    );
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

  it("Bảo lãnh thành công khi đủ điều kiện + đã đồng dạy chung — dùng findOneAndUpdate nguyên tử, không phải đọc-rồi-ghi", async () => {
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
    userFindOneAndUpdate.mockImplementation((filter) => {
      if (String(filter._id) === VOUCHER_ID) return Promise.resolve({ ...voucher, vouchLimit: 1 });
      return Promise.resolve({ ...vouchee, vouchedBy: [VOUCHER_ID] });
    });

    const result = await voucherForTeacher(VOUCHER_ID, VOUCHEE_ID);

    // Trừ vouchLimit PHẢI đi qua findOneAndUpdate với điều kiện lọc {vouchLimit:{$gt:0}} trong
    // CÙNG câu lệnh ghi — không phải đọc trước rồi ghi sau (đó là TOCTOU vừa sửa).
    expect(userFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: VOUCHER_ID, vouchLimit: { $gt: 0 } },
      { $inc: { vouchLimit: -1 } },
      { new: true }
    );
    expect(userFindOneAndUpdate).toHaveBeenCalledWith(
      { _id: VOUCHEE_ID, vouchedBy: { $ne: VOUCHER_ID } },
      { $push: { vouchedBy: VOUCHER_ID } },
      { new: true }
    );
    expect(result.vouchee.vouchedBy).toContain(VOUCHER_ID);
    expect(result.voucher.vouchLimit).toBe(1);
    expect(result.promotion.promoted).toBe(false); // chưa đủ cohort
  });

  it("BUG ĐÃ SỬA — race: findOneAndUpdate trừ vouchLimit trả về null (request khác đã dùng hết suất cuối) → BusinessRuleError, KHÔNG đọc voucher.vouchLimit trong bộ nhớ để tự quyết", async () => {
    const voucher = makeVoucher({ vouchLimit: 1 }); // trong bộ nhớ TƯỞNG còn 1 suất...
    const vouchee = makeVouchee();
    userFindById.mockImplementation((id) => {
      if (id === VOUCHER_ID) return Promise.resolve(voucher);
      if (id === VOUCHEE_ID) return Promise.resolve(vouchee);
      return Promise.resolve(null);
    });
    classExists.mockResolvedValue(true);
    // ...nhưng MongoDB thật (mô phỏng qua findOneAndUpdate) nói suất đã bị request khác dùng mất.
    userFindOneAndUpdate.mockResolvedValue(null);

    await expect(voucherForTeacher(VOUCHER_ID, VOUCHEE_ID)).rejects.toMatchObject({ status: 422 });
  });

  it("BUG ĐÃ SỬA — race trên bước gán vouchedBy (đã bị bảo lãnh trùng bởi request khác) → hoàn lại vouchLimit vừa trừ, ném lỗi", async () => {
    const voucher = makeVoucher();
    const vouchee = makeVouchee();
    userFindById.mockImplementation((id) => {
      if (id === VOUCHER_ID) return Promise.resolve(voucher);
      if (id === VOUCHEE_ID) return Promise.resolve(vouchee);
      return Promise.resolve(null);
    });
    classExists.mockResolvedValue(true);
    userFindOneAndUpdate.mockImplementation((filter) => {
      if (String(filter._id) === VOUCHER_ID) return Promise.resolve({ ...voucher, vouchLimit: 1 });
      return Promise.resolve(null); // vouchedBy đã có voucherId do race -> $ne không khớp
    });

    await expect(voucherForTeacher(VOUCHER_ID, VOUCHEE_ID)).rejects.toMatchObject({ status: 422 });
    expect(userUpdateOne).toHaveBeenCalledWith({ _id: VOUCHER_ID }, { $inc: { vouchLimit: 1 } });
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

describe("getOwnVerificationStatus", () => {
  it("Tài khoản đầy đủ field → trả đúng nguyên trạng, L3 thì không kiểm eligibility nữa", async () => {
    userFindById.mockReturnValue(
      mongooseLean({
        verificationTier: "L3",
        reliabilityScore: 87,
        poolStatus: "LOCKED",
        poolLockedUntil: new Date("2026-01-01"),
        vouchLimit: 1,
        vouchedBy: ["a", "b"],
        vouchSuspendedUntil: null,
      })
    );

    const result = await getOwnVerificationStatus(TEACHER_ID);

    expect(result).toMatchObject({
      verificationTier: "L3",
      reliabilityScore: 87,
      poolStatus: "LOCKED",
      vouchLimit: 1,
      vouchedByCount: 2,
      l3Eligibility: null,
    });
    expect(classCountDocuments).not.toHaveBeenCalled();
  });

  it("Tài khoản CŨ thiếu hết field mới (Mongoose không backfill) → fallback đúng default của schema", async () => {
    userFindById.mockReturnValue(mongooseLean({ _id: TEACHER_ID }));
    classCountDocuments.mockResolvedValue(0);

    const result = await getOwnVerificationStatus(TEACHER_ID);

    expect(result.verificationTier).toBe("L1");
    expect(result.reliabilityScore).toBe(100);
    expect(result.poolStatus).toBe("ACTIVE");
    expect(result.vouchLimit).toBe(2);
    expect(result.vouchedByCount).toBe(0);
    expect(result.l3Eligibility).not.toBeNull();
  });

  it("Không tồn tại → NotFoundError", async () => {
    userFindById.mockReturnValue(mongooseLean(null));
    await expect(getOwnVerificationStatus(TEACHER_ID)).rejects.toMatchObject({ status: 404 });
  });
});

describe("getCoTaughtColleagues — BR-22", () => {
  it("Gộp đồng nghiệp từ cả 2 chiều (mình là chính hoặc mình là dự bị), loại trùng", async () => {
    const colleagueA = { _id: "colleague-a", fullName: "Cô A" };
    const colleagueB = { _id: "colleague-b", fullName: "Thầy B" };
    classFind.mockReturnValue(
      mongooseFindChain([
        { teacherId: { _id: TEACHER_ID }, backupTeacherId: colleagueA },
        { teacherId: colleagueB, backupTeacherId: { _id: TEACHER_ID } },
        { teacherId: { _id: TEACHER_ID }, backupTeacherId: colleagueA }, // lớp khác, cùng 1 đồng nghiệp
      ])
    );

    const result = await getCoTaughtColleagues(TEACHER_ID);

    expect(result).toEqual([
      { id: "colleague-a", fullName: "Cô A" },
      { id: "colleague-b", fullName: "Thầy B" },
    ]);
  });

  it("Không có lớp nào đồng dạy chung → mảng rỗng", async () => {
    classFind.mockReturnValue(mongooseFindChain([]));
    const result = await getCoTaughtColleagues(TEACHER_ID);
    expect(result).toEqual([]);
  });

  it("Lớp chưa có dự bị (backupTeacherId null) → không lỗi, không thêm đồng nghiệp", async () => {
    classFind.mockReturnValue(
      mongooseFindChain([{ teacherId: { _id: TEACHER_ID }, backupTeacherId: null }])
    );
    const result = await getCoTaughtColleagues(TEACHER_ID);
    expect(result).toEqual([]);
  });
});
