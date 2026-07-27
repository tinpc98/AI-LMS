import assert from "assert";
import { listExamSetSharesService } from "../services/examSet.services.js";
import ExamSet from "../models/examSet.model.js";
import ExamSetShare from "../models/examSetShare.model.js";
import User from "../models/user.models.js";

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
  expiresAt: props.expiresAt || null,
  note: props.note || "",
  sharedBy: props.sharedBy || "507f1f77bcf86cd799439011",
  revokedAt: props.revokedAt || null,
  revokedBy: props.revokedBy || null,
  createdAt: props.createdAt || new Date("2026-01-01T00:00:00Z"),
  updatedAt: props.updatedAt || new Date("2026-01-01T00:00:00Z"),
  toObject() { return { ...this }; },
});

const createUser = (props = {}) => ({
  _id: props._id || "607f1f77bcf86cd799439222",
  fullName: props.fullName || "Nguyen Van A",
  email: props.email || "a@example.com",
  role: props.role || "Teacher",
  avatar: props.avatar || "",
  status: props.status || "Active",
});

const runAll = async () => {
  let passed = 0;
  const tests = [
    {
      name: "Owner retrieves shares successfully",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        ExamSetShare.find = () => ({
          sort: () => ({ skip: () => ({ limit: () => ({
            populate: () => ({ populate: () => ({ populate: () => Promise.resolve([createShare()]) }) })
          }) }) }),
        });
        ExamSetShare.countDocuments = () => Promise.resolve(1);
        User.find = () => Promise.resolve([]);

        const result = await listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { page: 1, limit: 10 });
        assert.equal(result.items.length, 1);
        assert.equal(result.pagination.totalItems, 1);
      },
    },
    {
      name: "Admin retrieves shares successfully",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ ownerId: "some-owner" }));
        ExamSetShare.find = () => ({
          sort: () => ({ skip: () => ({ limit: () => ({
            populate: () => ({ populate: () => ({ populate: () => Promise.resolve([createShare({ sharedWithUserId: { _id: "607f1f77bcf86cd799439222", fullName: "B", email: "b@example.com", role: "Teacher", avatar: "", status: "Active" } })]) }) })
          }) }) }),
        });
        ExamSetShare.countDocuments = () => Promise.resolve(1);
        User.find = () => Promise.resolve([]);

        const result = await listExamSetSharesService("607f1f77bcf86cd799439111", "admin-id", "Admin", { page: 1, limit: 10 });
        assert.equal(result.items[0].sharedWithUser.email, "b@example.com");
      },
    },
    {
      name: "Returns effectiveStatus EXPIRED when active share expired",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        const expired = createShare({
          status: "ACTIVE",
          expiresAt: new Date(Date.now() - 1000),
          sharedWithUserId: { _id: "607f1f77bcf86cd799439222", fullName: "C", email: "c@example.com", role: "Teacher", avatar: "", status: "Active" },
        });
        ExamSetShare.find = () => ({
          sort: () => ({ skip: () => ({ limit: () => ({
            populate: () => ({ populate: () => ({ populate: () => Promise.resolve([expired]) }) })
          }) }) }),
        });
        ExamSetShare.countDocuments = () => Promise.resolve(1);
        User.find = () => Promise.resolve([]);

        const result = await listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { page: 1, limit: 10 });
        assert.equal(result.items[0].status, "ACTIVE");
        assert.equal(result.items[0].effectiveStatus, "EXPIRED");
      },
    },
    {
      name: "Permission filter works",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        ExamSetShare.find = (filter) => {
          assert.equal(filter.permission, "EDIT");
          return ({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve([]) }) }) }) }) }) });
        };
        ExamSetShare.countDocuments = () => Promise.resolve(0);
        User.find = () => Promise.resolve([]);

        const result = await listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { page: 1, limit: 10, permission: "EDIT" });
        assert.equal(result.pagination.totalItems, 0);
      },
    },
    {
      name: "Status filter works",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        ExamSetShare.find = (filter) => {
          assert.equal(filter.status, "REVOKED");
          return ({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve([]) }) }) }) }) }) });
        };
        ExamSetShare.countDocuments = () => Promise.resolve(0);
        User.find = () => Promise.resolve([]);

        const result = await listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { page: 1, limit: 10, status: "REVOKED" });
        assert.equal(result.pagination.totalItems, 0);
      },
    },
    {
      name: "Search filters by user email and name",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet());
        User.find = () => ({ select: () => Promise.resolve([{ _id: "607f1f77bcf86cd799439222" }]) });
        ExamSetShare.find = (filter) => {
          assert.deepEqual(filter.sharedWithUserId, { $in: ["607f1f77bcf86cd799439222"] });
          return ({ sort: () => ({ skip: () => ({ limit: () => ({ populate: () => ({ populate: () => ({ populate: () => Promise.resolve([]) }) }) }) }) }) });
        };
        ExamSetShare.countDocuments = () => Promise.resolve(0);

        const result = await listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { page: 1, limit: 10, search: "a@example.com" });
        assert.equal(result.pagination.totalItems, 0);
      },
    },
    {
      name: "Teacher not owner gets 403",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439013" }));
        User.find = () => Promise.resolve([]);
        let caught = null;
        try {
          await listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", { page: 1, limit: 10 });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 403);
      },
    },
    {
      name: "Student gets 403",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439013" }));
        User.find = () => Promise.resolve([]);
        let caught = null;
        try {
          await listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Student", { page: 1, limit: 10 });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 403);
      },
    },
    {
      name: "Exam set not found returns 404",
      fn: async () => {
        ExamSet.findOne = () => Promise.resolve(null);
        User.find = () => Promise.resolve([]);
        let caught = null;
        try {
          await listExamSetSharesService("607f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Admin", { page: 1, limit: 10 });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 404);
      },
    },
  ];

  for (const test of tests) {
    const ok = await runTest(test.name, test.fn);
    if (ok) passed += 1;
  }

  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
