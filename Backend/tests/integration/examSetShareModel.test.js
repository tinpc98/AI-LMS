// Port từ src/scripts/runExamSetShareModelTests.js (characterization test).
// Integration test — cần MongoDB thật đang chạy tại MONGO_TEST_URI (mặc định localhost:27017/ai_lms_test).
// Khác với tests/unit/*, các test trong tests/integration/* không chạy được nếu thiếu MongoDB.
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import mongoose from "mongoose";
import ExamSetShare, {
  EXAM_SET_SHARE_PERMISSION,
  EXAM_SET_SHARE_STATUS,
} from "../../src/models/examSetShare.model.js";

const TEST_URI = process.env.MONGO_TEST_URI || "mongodb://127.0.0.1:27017/ai_lms_test";

const expectValidationError = (error, expectedMessage) => {
  expect(error).toBeTruthy();
  expect(error.name).toBe("ValidationError");
  if (expectedMessage) {
    expect(Object.values(error.errors).some((e) => e.message.includes(expectedMessage))).toBe(true);
  }
};

beforeAll(async () => {
  await mongoose.connect(TEST_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

beforeEach(async () => {
  await ExamSetShare.deleteMany({});
});

describe("ExamSetShare model", () => {
  it("Create valid share with VIEW permission", async () => {
    const share = new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy: new mongoose.Types.ObjectId(),
    });
    const saved = await share.save();
    expect(saved.permission).toBe(EXAM_SET_SHARE_PERMISSION.VIEW);
    expect(saved.status).toBe(EXAM_SET_SHARE_STATUS.ACTIVE);
  });

  it("Create valid share with EDIT permission", async () => {
    const share = new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.EDIT,
      sharedBy: new mongoose.Types.ObjectId(),
    });
    const saved = await share.save();
    expect(saved.permission).toBe(EXAM_SET_SHARE_PERMISSION.EDIT);
  });

  it("Default status is ACTIVE", async () => {
    const share = new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy: new mongoose.Types.ObjectId(),
    });
    const saved = await share.save();
    expect(saved.status).toBe(EXAM_SET_SHARE_STATUS.ACTIVE);
  });

  it("expiresAt can be null", async () => {
    const share = new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy: new mongoose.Types.ObjectId(),
      expiresAt: null,
    });
    const saved = await share.save();
    expect(saved.expiresAt).toBe(null);
  });

  it("Timestamps are created", async () => {
    const share = new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy: new mongoose.Types.ObjectId(),
    });
    const saved = await share.save();
    expect(saved.createdAt).toBeInstanceOf(Date);
    expect(saved.updatedAt).toBeInstanceOf(Date);
  });

  it("note is trimmed", async () => {
    const share = new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy: new mongoose.Types.ObjectId(),
      note: "  hello  ",
    });
    const saved = await share.save();
    expect(saved.note).toBe("hello");
  });

  it("Fails when examSetId is missing", async () => {
    let error;
    try {
      await new ExamSetShare({
        ownerId: new mongoose.Types.ObjectId(),
        sharedWithUserId: new mongoose.Types.ObjectId(),
        permission: EXAM_SET_SHARE_PERMISSION.VIEW,
        sharedBy: new mongoose.Types.ObjectId(),
      }).save();
    } catch (err) {
      error = err;
    }
    expectValidationError(error, "examSetId là bắt buộc");
  });

  it("Fails when ownerId is missing", async () => {
    let error;
    try {
      await new ExamSetShare({
        examSetId: new mongoose.Types.ObjectId(),
        sharedWithUserId: new mongoose.Types.ObjectId(),
        permission: EXAM_SET_SHARE_PERMISSION.VIEW,
        sharedBy: new mongoose.Types.ObjectId(),
      }).save();
    } catch (err) {
      error = err;
    }
    expectValidationError(error, "ownerId là bắt buộc");
  });

  it("Fails when sharedWithUserId is missing", async () => {
    let error;
    try {
      await new ExamSetShare({
        examSetId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        permission: EXAM_SET_SHARE_PERMISSION.VIEW,
        sharedBy: new mongoose.Types.ObjectId(),
      }).save();
    } catch (err) {
      error = err;
    }
    expectValidationError(error, "sharedWithUserId là bắt buộc");
  });

  it("Fails when sharedWithUserId equals ownerId", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    let error;
    try {
      await new ExamSetShare({
        examSetId: new mongoose.Types.ObjectId(),
        ownerId,
        sharedWithUserId: ownerId,
        permission: EXAM_SET_SHARE_PERMISSION.VIEW,
        sharedBy: new mongoose.Types.ObjectId(),
      }).save();
    } catch (err) {
      error = err;
    }
    expectValidationError(error, "sharedWithUserId không được trùng với ownerId");
  });

  it("Fails when permission is invalid", async () => {
    let error;
    try {
      await new ExamSetShare({
        examSetId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        sharedWithUserId: new mongoose.Types.ObjectId(),
        permission: "INVALID",
        sharedBy: new mongoose.Types.ObjectId(),
      }).save();
    } catch (err) {
      error = err;
    }
    expectValidationError(error, "`INVALID` is not a valid enum value");
  });

  it("Fails when status is invalid", async () => {
    let error;
    try {
      await new ExamSetShare({
        examSetId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        sharedWithUserId: new mongoose.Types.ObjectId(),
        permission: EXAM_SET_SHARE_PERMISSION.VIEW,
        status: "BAD",
        sharedBy: new mongoose.Types.ObjectId(),
      }).save();
    } catch (err) {
      error = err;
    }
    expectValidationError(error, "`BAD` is not a valid enum value");
  });

  it("Fails when expiresAt is invalid", async () => {
    let error;
    try {
      await new ExamSetShare({
        examSetId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        sharedWithUserId: new mongoose.Types.ObjectId(),
        permission: EXAM_SET_SHARE_PERMISSION.VIEW,
        sharedBy: new mongoose.Types.ObjectId(),
        expiresAt: "not-a-date",
      }).save();
    } catch (err) {
      error = err;
    }
    expect(error).toBeTruthy();
    expect(error.name).toBe("ValidationError");
    expect(Object.values(error.errors).some((e) => e.message.includes("Cast to date failed"))).toBe(
      true
    );
  });

  it("Fails when note is too long", async () => {
    let error;
    try {
      await new ExamSetShare({
        examSetId: new mongoose.Types.ObjectId(),
        ownerId: new mongoose.Types.ObjectId(),
        sharedWithUserId: new mongoose.Types.ObjectId(),
        permission: EXAM_SET_SHARE_PERMISSION.VIEW,
        sharedBy: new mongoose.Types.ObjectId(),
        note: "a".repeat(501),
      }).save();
    } catch (err) {
      error = err;
    }
    expectValidationError(error, "note tối đa 500 ký tự");
  });

  it("Unique constraint prevents duplicate share for same examSetId and sharedWithUserId", async () => {
    const examSetId = new mongoose.Types.ObjectId();
    const sharedWithUserId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId();
    const sharedBy = new mongoose.Types.ObjectId();

    await new ExamSetShare({
      examSetId,
      ownerId,
      sharedWithUserId,
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy,
    }).save();

    let error;
    try {
      await new ExamSetShare({
        examSetId,
        ownerId,
        sharedWithUserId,
        permission: EXAM_SET_SHARE_PERMISSION.EDIT,
        sharedBy,
      }).save();
    } catch (err) {
      error = err;
    }
    expect(error).toBeTruthy();
    expect(error.message.includes("duplicate key") || error.code === 11000).toBe(true);
  });

  it("Can share same examSetId with different users", async () => {
    const examSetId = new mongoose.Types.ObjectId();
    const ownerId = new mongoose.Types.ObjectId();
    const sharedBy = new mongoose.Types.ObjectId();

    await new ExamSetShare({
      examSetId,
      ownerId,
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy,
    }).save();
    const second = await new ExamSetShare({
      examSetId,
      ownerId,
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.EDIT,
      sharedBy,
    }).save();
    expect(String(second.examSetId)).toBe(String(examSetId));
  });

  it("Can share different examSetId with same user", async () => {
    const ownerId = new mongoose.Types.ObjectId();
    const sharedWithUserId = new mongoose.Types.ObjectId();
    const sharedBy = new mongoose.Types.ObjectId();

    await new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId,
      sharedWithUserId,
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy,
    }).save();
    const second = await new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId,
      sharedWithUserId,
      permission: EXAM_SET_SHARE_PERMISSION.EDIT,
      sharedBy,
    }).save();
    expect(String(second.sharedWithUserId)).toBe(String(sharedWithUserId));
  });

  it("ACTIVE share has revokedAt null", async () => {
    const share = await new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      sharedBy: new mongoose.Types.ObjectId(),
    }).save();
    expect(share.status).toBe(EXAM_SET_SHARE_STATUS.ACTIVE);
    expect(share.revokedAt).toBe(null);
  });

  it("REVOKED share can store revokedAt and revokedBy", async () => {
    const share = await new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      status: EXAM_SET_SHARE_STATUS.REVOKED,
      sharedBy: new mongoose.Types.ObjectId(),
      revokedAt: new Date(),
      revokedBy: new mongoose.Types.ObjectId(),
    }).save();
    expect(share.status).toBe(EXAM_SET_SHARE_STATUS.REVOKED);
    expect(share.revokedAt).toBeInstanceOf(Date);
    expect(share.revokedBy).toBeTruthy();
  });

  it("EXPIRED status is accepted", async () => {
    const share = await new ExamSetShare({
      examSetId: new mongoose.Types.ObjectId(),
      ownerId: new mongoose.Types.ObjectId(),
      sharedWithUserId: new mongoose.Types.ObjectId(),
      permission: EXAM_SET_SHARE_PERMISSION.VIEW,
      status: EXAM_SET_SHARE_STATUS.EXPIRED,
      sharedBy: new mongoose.Types.ObjectId(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    }).save();
    expect(share.status).toBe(EXAM_SET_SHARE_STATUS.EXPIRED);
  });
});
