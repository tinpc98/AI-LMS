import assert from "assert";
import { revokeExamSetShareService } from "../services/examSet.services.js";
import ExamSet from "../models/examSet.model.js";
import ExamSetShare from "../models/examSetShare.model.js";

const runTest = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    return true;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err.message || err);
    return false;
  }
};

const createExamSet = (props = {}) => ({
  _id: props._id || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  isDeleted: props.isDeleted || false,
});

const createShare = (props = {}) => ({
  _id: props._id || "707f1f77bcf86cd799439999",
  examSetId: props.examSetId || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  sharedWithUserId: props.sharedWithUserId || "607f1f77bcf86cd799439222",
  permission: props.permission || "VIEW",
  status: props.status || "ACTIVE",
  revokedAt: props.revokedAt || null,
  revokedBy: props.revokedBy || null,
  save: async function() { return this; }
});

const runAll = async () => {
  let passed = 0;

  const tests = [
    {
      name: "Revoke success",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439011", _id: "607f1f77bcf86cd799439111" }));
        const sh = createShare({ status: "ACTIVE", examSetId: "607f1f77bcf86cd799439111", ownerId: "507f1f77bcf86cd799439011" });
        ExamSetShare.findOne = () => Promise.resolve(sh);
        sh.save = async function() { this.status = "REVOKED"; this.revokedBy = "507f1f77bcf86cd799439011"; this.revokedAt = new Date(); return this; };

        const res = await revokeExamSetShareService("607f1f77bcf86cd799439111", sh._id, "507f1f77bcf86cd799439011", "Teacher");
        assert.equal(res.statusCode, 200);
        assert.equal(res.data.status, "REVOKED");
        assert.equal(res.data.revokedBy, "507f1f77bcf86cd799439011");
        assert.ok(res.data.revokedAt);
      },
    },
    {
      name: "Share not exist",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        ExamSetShare.findOne = () => Promise.resolve(null);
        let caught = null;
        try {
          await revokeExamSetShareService("607f1f77bcf86cd799439111", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher");
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 404);
      },
    },
    {
      name: "Exam set not exist",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(null);
        let caught = null;
        try {
          await revokeExamSetShareService("607f1f77bcf86cd799439999", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher");
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 404);
      },
    },
    {
      name: "Teacher not owner cannot revoke",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439011", _id: "607f1f77bcf86cd799439111" }));
        const sh = createShare({ status: "ACTIVE", examSetId: "607f1f77bcf86cd799439111", ownerId: "507f1f77bcf86cd799439011" });
        ExamSetShare.findOne = () => Promise.resolve(sh);
        let caught = null;
        try {
          await revokeExamSetShareService("607f1f77bcf86cd799439111", sh._id, "507f1f77bcf86cd799439012", "Teacher");
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 403);
      },
    },
    {
      name: "Student cannot revoke",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439011", _id: "607f1f77bcf86cd799439111" }));
        const sh = createShare({ status: "ACTIVE", examSetId: "607f1f77bcf86cd799439111", ownerId: "507f1f77bcf86cd799439011" });
        ExamSetShare.findOne = () => Promise.resolve(sh);
        let caught = null;
        try {
          await revokeExamSetShareService("607f1f77bcf86cd799439111", sh._id, "507f1f77bcf86cd799439013", "Student");
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 403);
      },
    },
    {
      name: "Revoke twice returns 409",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        ExamSetShare.findOne = () => Promise.resolve(createShare({ status: "REVOKED" }));
        let caught = null;
        try {
          await revokeExamSetShareService("607f1f77bcf86cd799439111", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher");
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 409);
      },
    },
    {
      name: "Revoke expired returns 409",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        ExamSetShare.findOne = () => Promise.resolve(createShare({ status: "EXPIRED" }));
        let caught = null;
        try {
          await revokeExamSetShareService("607f1f77bcf86cd799439111", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher");
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 409);
      },
    },
    {
      name: "Invalid ObjectId",
      fn: async () => {
        let caught = null;
        try {
          await revokeExamSetShareService("not-objectid", "also-not-objectid", "507f1f77bcf86cd799439011", "Teacher");
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 400);
      },
    },
    {
      name: "Share not belong to exam set",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ _id: "607f1f77bcf86cd799439aaa", ownerId: "507f1f77bcf86cd799439011" }));
        ExamSetShare.findOne = () => Promise.resolve(createShare({ examSetId: "607f1f77bcf86cd799439bbb" }));
        let caught = null;
        try {
          await revokeExamSetShareService("607f1f77bcf86cd799439aaa", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher");
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 400);
      },
    },
  ];

  for (const t of tests) {
    const ok = await runTest(t.name, t.fn);
    if (ok) passed += 1;
  }

  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
