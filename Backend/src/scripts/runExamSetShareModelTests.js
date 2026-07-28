import assert from "assert";
import mongoose from "mongoose";
import ExamSetShare, { EXAM_SET_SHARE_PERMISSION, EXAM_SET_SHARE_STATUS } from "../models/examSetShare.model.js";

const runTest = async (name, callback) => {
  try {
    await callback();
    console.log(`PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.message || error);
    return false;
  }
};

const clearCollection = async () => {
  await ExamSetShare.deleteMany({});
};

const assertValidationError = (error, expectedMessage) => {
  assert.ok(error, "Expected validation error");
  assert.equal(error.name, "ValidationError");
  if (expectedMessage) {
    assert.ok(
      Object.values(error.errors).some((err) => err.message.includes(expectedMessage)),
      `Expected validation message containing: ${expectedMessage}`
    );
  }
};

const runAll = async () => {
  await mongoose.connect("mongodb://127.0.0.1:27017/ai_lms_test");

  await clearCollection();

  let passed = 0;
  const tests = [
    {
      name: "Create valid share with VIEW permission",
      fn: async () => {
        const share = new ExamSetShare({
          examSetId: new mongoose.Types.ObjectId(),
          ownerId: new mongoose.Types.ObjectId(),
          sharedWithUserId: new mongoose.Types.ObjectId(),
          permission: EXAM_SET_SHARE_PERMISSION.VIEW,
          sharedBy: new mongoose.Types.ObjectId(),
        });
        const saved = await share.save();
        assert.equal(saved.permission, EXAM_SET_SHARE_PERMISSION.VIEW);
        assert.equal(saved.status, EXAM_SET_SHARE_STATUS.ACTIVE);
      },
    },
    {
      name: "Create valid share with EDIT permission",
      fn: async () => {
        const share = new ExamSetShare({
          examSetId: new mongoose.Types.ObjectId(),
          ownerId: new mongoose.Types.ObjectId(),
          sharedWithUserId: new mongoose.Types.ObjectId(),
          permission: EXAM_SET_SHARE_PERMISSION.EDIT,
          sharedBy: new mongoose.Types.ObjectId(),
        });
        const saved = await share.save();
        assert.equal(saved.permission, EXAM_SET_SHARE_PERMISSION.EDIT);
      },
    },
    {
      name: "Default status is ACTIVE",
      fn: async () => {
        const share = new ExamSetShare({
          examSetId: new mongoose.Types.ObjectId(),
          ownerId: new mongoose.Types.ObjectId(),
          sharedWithUserId: new mongoose.Types.ObjectId(),
          permission: EXAM_SET_SHARE_PERMISSION.VIEW,
          sharedBy: new mongoose.Types.ObjectId(),
        });
        const saved = await share.save();
        assert.equal(saved.status, EXAM_SET_SHARE_STATUS.ACTIVE);
      },
    },
    {
      name: "expiresAt can be null",
      fn: async () => {
        const share = new ExamSetShare({
          examSetId: new mongoose.Types.ObjectId(),
          ownerId: new mongoose.Types.ObjectId(),
          sharedWithUserId: new mongoose.Types.ObjectId(),
          permission: EXAM_SET_SHARE_PERMISSION.VIEW,
          sharedBy: new mongoose.Types.ObjectId(),
          expiresAt: null,
        });
        const saved = await share.save();
        assert.equal(saved.expiresAt, null);
      },
    },
    {
      name: "Timestamps are created",
      fn: async () => {
        const share = new ExamSetShare({
          examSetId: new mongoose.Types.ObjectId(),
          ownerId: new mongoose.Types.ObjectId(),
          sharedWithUserId: new mongoose.Types.ObjectId(),
          permission: EXAM_SET_SHARE_PERMISSION.VIEW,
          sharedBy: new mongoose.Types.ObjectId(),
        });
        const saved = await share.save();
        assert.ok(saved.createdAt instanceof Date);
        assert.ok(saved.updatedAt instanceof Date);
      },
    },
    {
      name: "note is trimmed",
      fn: async () => {
        const share = new ExamSetShare({
          examSetId: new mongoose.Types.ObjectId(),
          ownerId: new mongoose.Types.ObjectId(),
          sharedWithUserId: new mongoose.Types.ObjectId(),
          permission: EXAM_SET_SHARE_PERMISSION.VIEW,
          sharedBy: new mongoose.Types.ObjectId(),
          note: "  hello  ",
        });
        const saved = await share.save();
        assert.equal(saved.note, "hello");
      },
    },
    {
      name: "Fails when examSetId is missing",
      fn: async () => {
        let error;
        try {
          const share = new ExamSetShare({
            ownerId: new mongoose.Types.ObjectId(),
            sharedWithUserId: new mongoose.Types.ObjectId(),
            permission: EXAM_SET_SHARE_PERMISSION.VIEW,
            sharedBy: new mongoose.Types.ObjectId(),
          });
          await share.save();
        } catch (err) {
          error = err;
        }
        assertValidationError(error, "examSetId là bắt buộc");
      },
    },
    {
      name: "Fails when ownerId is missing",
      fn: async () => {
        let error;
        try {
          const share = new ExamSetShare({
            examSetId: new mongoose.Types.ObjectId(),
            sharedWithUserId: new mongoose.Types.ObjectId(),
            permission: EXAM_SET_SHARE_PERMISSION.VIEW,
            sharedBy: new mongoose.Types.ObjectId(),
          });
          await share.save();
        } catch (err) {
          error = err;
        }
        assertValidationError(error, "ownerId là bắt buộc");
      },
    },
    {
      name: "Fails when sharedWithUserId is missing",
      fn: async () => {
        let error;
        try {
          const share = new ExamSetShare({
            examSetId: new mongoose.Types.ObjectId(),
            ownerId: new mongoose.Types.ObjectId(),
            permission: EXAM_SET_SHARE_PERMISSION.VIEW,
            sharedBy: new mongoose.Types.ObjectId(),
          });
          await share.save();
        } catch (err) {
          error = err;
        }
        assertValidationError(error, "sharedWithUserId là bắt buộc");
      },
    },
    {
      name: "Fails when sharedWithUserId equals ownerId",
      fn: async () => {
        let error;
        const ownerId = new mongoose.Types.ObjectId();
        try {
          const share = new ExamSetShare({
            examSetId: new mongoose.Types.ObjectId(),
            ownerId,
            sharedWithUserId: ownerId,
            permission: EXAM_SET_SHARE_PERMISSION.VIEW,
            sharedBy: new mongoose.Types.ObjectId(),
          });
          await share.save();
        } catch (err) {
          error = err;
        }
        assertValidationError(error, "sharedWithUserId không được trùng với ownerId");
      },
    },
    {
      name: "Fails when permission is invalid",
      fn: async () => {
        let error;
        try {
          const share = new ExamSetShare({
            examSetId: new mongoose.Types.ObjectId(),
            ownerId: new mongoose.Types.ObjectId(),
            sharedWithUserId: new mongoose.Types.ObjectId(),
            permission: "INVALID",
            sharedBy: new mongoose.Types.ObjectId(),
          });
          await share.save();
        } catch (err) {
          error = err;
        }
        assertValidationError(error, "`INVALID` is not a valid enum value");
      },
    },
    {
      name: "Fails when status is invalid",
      fn: async () => {
        let error;
        try {
          const share = new ExamSetShare({
            examSetId: new mongoose.Types.ObjectId(),
            ownerId: new mongoose.Types.ObjectId(),
            sharedWithUserId: new mongoose.Types.ObjectId(),
            permission: EXAM_SET_SHARE_PERMISSION.VIEW,
            status: "BAD",
            sharedBy: new mongoose.Types.ObjectId(),
          });
          await share.save();
        } catch (err) {
          error = err;
        }
        assertValidationError(error, "`BAD` is not a valid enum value");
      },
    },
    {
      name: "Fails when expiresAt is invalid",
      fn: async () => {
        let error;
        try {
          const share = new ExamSetShare({
            examSetId: new mongoose.Types.ObjectId(),
            ownerId: new mongoose.Types.ObjectId(),
            sharedWithUserId: new mongoose.Types.ObjectId(),
            permission: EXAM_SET_SHARE_PERMISSION.VIEW,
            sharedBy: new mongoose.Types.ObjectId(),
            expiresAt: "not-a-date",
          });
          await share.save();
        } catch (err) {
          error = err;
        }
        assert.ok(error, "Expected validation error");
        assert.equal(error.name, "ValidationError");
        assert.ok(
          Object.values(error.errors).some((err) => err.message.includes("Cast to date failed")),
          "Expected Cast to date failed error"
        );
      },
    },
    {
      name: "Fails when note is too long",
      fn: async () => {
        let error;
        try {
          const share = new ExamSetShare({
            examSetId: new mongoose.Types.ObjectId(),
            ownerId: new mongoose.Types.ObjectId(),
            sharedWithUserId: new mongoose.Types.ObjectId(),
            permission: EXAM_SET_SHARE_PERMISSION.VIEW,
            sharedBy: new mongoose.Types.ObjectId(),
            note: "a".repeat(501),
          });
          await share.save();
        } catch (err) {
          error = err;
        }
        assertValidationError(error, "note tối đa 500 ký tự");
      },
    },
    {
      name: "Unique constraint prevents duplicate share for same examSetId and sharedWithUserId",
      fn: async () => {
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
        assert.ok(error, "Expected duplicate key error");
        assert.ok(error.message.includes("duplicate key") || error.code === 11000);
      },
    },
    {
      name: "Can share same examSetId with different users",
      fn: async () => {
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
        assert.equal(String(second.examSetId), String(examSetId));
      },
    },
    {
      name: "Can share different examSetId with same user",
      fn: async () => {
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
        assert.equal(String(second.sharedWithUserId), String(sharedWithUserId));
      },
    },
    {
      name: "ACTIVE share has revokedAt null",
      fn: async () => {
        const share = await new ExamSetShare({
          examSetId: new mongoose.Types.ObjectId(),
          ownerId: new mongoose.Types.ObjectId(),
          sharedWithUserId: new mongoose.Types.ObjectId(),
          permission: EXAM_SET_SHARE_PERMISSION.VIEW,
          sharedBy: new mongoose.Types.ObjectId(),
        }).save();
        assert.equal(share.status, EXAM_SET_SHARE_STATUS.ACTIVE);
        assert.equal(share.revokedAt, null);
      },
    },
    {
      name: "REVOKED share can store revokedAt and revokedBy",
      fn: async () => {
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
        assert.equal(share.status, EXAM_SET_SHARE_STATUS.REVOKED);
        assert.ok(share.revokedAt instanceof Date);
        assert.ok(share.revokedBy);
      },
    },
    {
      name: "EXPIRED status is accepted",
      fn: async () => {
        const share = await new ExamSetShare({
          examSetId: new mongoose.Types.ObjectId(),
          ownerId: new mongoose.Types.ObjectId(),
          sharedWithUserId: new mongoose.Types.ObjectId(),
          permission: EXAM_SET_SHARE_PERMISSION.VIEW,
          status: EXAM_SET_SHARE_STATUS.EXPIRED,
          sharedBy: new mongoose.Types.ObjectId(),
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        }).save();
        assert.equal(share.status, EXAM_SET_SHARE_STATUS.EXPIRED);
      },
    },
  ];

  for (const test of tests) {
    await clearCollection();
    const ok = await runTest(test.name, test.fn);
    if (ok) passed += 1;
  }

  console.log(`\n${passed}/${tests.length} tests passed.`);
  await mongoose.disconnect();
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
