import assert from "assert";
import { createExamSetShareService } from "../services/examSet.services.js";
import ExamSet from "../models/examSet.model.js";
import User from "../models/user.models.js";
import ExamSetShare from "../models/examSetShare.model.js";

const restore = (orig) => {
  for (const [k, v] of Object.entries(orig)) {
    if (v === undefined) continue;
    global[k] = v;
  }
};

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

const originals = {
  ExamSetFindOne: ExamSet.findOne,
  UserFindOne: User.findOne,
  ExamSetShareFindOne: ExamSetShare.findOne,
  ExamSetShareSave: ExamSetShare.prototype.save,
};

const createExamSet = (props = {}) => ({
  _id: props._id || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  isDeleted: props.isDeleted || false,
  toObject() { return { ...this }; },
});

const createUser = (props = {}) => ({
  _id: props._id || "507f1f77bcf86cd799439011",
  role: props.role || "Teacher",
  status: props.status || "Active",
});

const createShare = (props = {}) => ({
  _id: props._id || "707f1f77bcf86cd799439999",
  examSetId: props.examSetId || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  sharedWithUserId: props.sharedWithUserId || "607f1f77bcf86cd799439222",
  permission: props.permission || "VIEW",
  status: props.status || "ACTIVE",
  save: async function() { return this; }
});

const runAll = async () => {
  let passed = 0;

  const tests = [
    {
      name: "Share VIEW created",
      fn: async () => {
        ExamSet.findOne = (q) => ({ lean: () => null, exec: async () => null, then: async () => null, ...q, }).bind ? ExamSet.findOne : () => createExamSet();
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.findOne = () => Promise.resolve(createUser({ role: "Teacher" }));
        ExamSetShare.findOne = () => Promise.resolve(null);
        ExamSetShare.prototype.save = async function() { return this; };

        const res = await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "VIEW", expiresAt: null, note: " hi " });
        assert.equal(res.statusCode, 201);
        assert.equal(res.data.permission, "VIEW");
        assert.equal(res.data.ownerId, "507f1f77bcf86cd799439011");
      },
    },
    {
      name: "Share EDIT created",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.findOne = () => Promise.resolve(createUser({ role: "Teacher" }));
        ExamSetShare.findOne = () => Promise.resolve(null);
        ExamSetShare.prototype.save = async function() { return this; };

        const res = await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "EDIT", expiresAt: null, note: "" });
        assert.equal(res.statusCode, 201);
        assert.equal(res.data.permission, "EDIT");
      },
    },
    {
      name: "Duplicate ACTIVE returns 409",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.findOne = () => Promise.resolve(createUser());
        ExamSetShare.findOne = () => Promise.resolve(createShare({ status: "ACTIVE" }));

        let caught = null;
        try {
          await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "VIEW" });
        } catch (err) {
          caught = err;
        }
        assert.ok(caught && caught.status === 409);
      },
    },
    {
      name: "Reactivate REVOKED",
      fn: async () => {
        const ex = createShare({ status: "REVOKED" });
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.findOne = () => Promise.resolve(createUser());
        ExamSetShare.findOne = () => Promise.resolve(ex);
        ex.save = async function() { return this; };

        const res = await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "EDIT", expiresAt: null, note: "reactivated" });
        assert.equal(res.statusCode, 200);
        assert.equal(res.data.status, "ACTIVE");
        assert.equal(res.data.permission, "EDIT");
      },
    },
    {
      name: "Cannot share to self",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439011" }));
        User.findOne = () => Promise.resolve(createUser({ _id: "507f1f77bcf86cd799439011" }));

        let caught = null;
        try {
          await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "507f1f77bcf86cd799439011", permission: "VIEW" });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 400);
      },
    },
    {
      name: "Exam Set not exist",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(null);
        let caught = null;
        try {
          await createExamSetShareService("607f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "VIEW" });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 404);
      },
    },
    {
      name: "User not exist",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.findOne = () => Promise.resolve(null);
        let caught = null;
        try {
          await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "VIEW" });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 404);
      },
    },
    {
      name: "Cannot share to Student",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.findOne = () => Promise.resolve(createUser({ role: "Student" }));
        let caught = null;
        try {
          await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "VIEW" });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 400);
      },
    },
    {
      name: "Teacher not owner cannot share",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ ownerId: "owner-1" }));
        User.findOne = () => Promise.resolve(createUser({ role: "Teacher" }));
        let caught = null;
        try {
          await createExamSetShareService("607f1f77bcf86cd799439111", "not-owner", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "VIEW" });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 403);
      },
    },
    {
      name: "expiresAt in past",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.findOne = () => Promise.resolve(createUser());
        let caught = null;
        try {
          await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "VIEW", expiresAt: new Date(Date.now() - 10000) });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 422);
      },
    },
    {
      name: "permission invalid",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.findOne = () => Promise.resolve(createUser());
        let caught = null;
        try {
          await createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "BAD" });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 400);
      },
    },
    {
      name: "invalid examSetId",
      fn: async () => {
        let caught = null;
        try {
          await createExamSetShareService("not-objectid", "507f1f77bcf86cd799439011", "Teacher", { sharedWithUserId: "607f1f77bcf86cd799439222", permission: "VIEW" });
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
