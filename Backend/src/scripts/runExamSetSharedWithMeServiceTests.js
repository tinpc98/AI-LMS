import assert from "assert";
import { listSharedExamSetsService } from "../services/examSet.services.js";
import ExamSetShare from "../models/examSetShare.model.js";
import ExamSet from "../models/examSet.model.js";
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
  title: props.title || "Exam Set X",
  description: props.description || "Description",
  tags: props.tags || ["math"],
  status: props.status || "draft",
  questionCount: props.questionCount || 10,
  totalPoints: props.totalPoints || 20,
  versionNumber: props.versionNumber || 1,
  rootExamSetId: props.rootExamSetId || "607f1f77bcf86cd799439111",
  isLatestVersion: props.isLatestVersion !== undefined ? props.isLatestVersion : true,
  createdAt: props.createdAt || new Date("2026-01-01T00:00:00Z"),
  updatedAt: props.updatedAt || new Date("2026-01-01T00:00:00Z"),
  isDeleted: props.isDeleted || false,
});

const createShare = (props = {}) => ({
  _id: props._id || "707f1f77bcf86cd799439999",
  examSetId: props.examSetId || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  sharedWithUserId: props.sharedWithUserId || "607f1f77bcf86cd799439222",
  permission: props.permission || "VIEW",
  status: props.status || "ACTIVE",
  sharedBy: props.sharedBy || "507f1f77bcf86cd799439011",
  expiresAt: props.expiresAt || null,
  note: props.note || "",
  createdAt: props.createdAt || new Date("2026-01-01T00:00:00Z"),
  updatedAt: props.updatedAt || new Date("2026-01-01T00:00:00Z"),
});

const createUser = (props = {}) => ({
  _id: props._id || "507f1f77bcf86cd799439011",
  fullName: props.fullName || "Teacher A",
  email: props.email || "a@example.com",
  avatar: props.avatar || "",
  status: props.status || "Active",
  role: props.role || "Teacher",
});

const runAll = async () => {
  let passed = 0;
  const tests = [
    {
      name: "Teacher gets shared exam set with VIEW permission",
      fn: async () => {
        ExamSetShare.aggregate = () => Promise.resolve([{ items: [{ share: { _id: "707f...", permission: "VIEW", status: "ACTIVE", effectiveStatus: "ACTIVE", expiresAt: null, note: "", sharedAt: new Date("2026-01-01T00:00:00Z"), createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") }, examSet: { _id: "607f...", title: "Title X", description: "Desc", tags: ["math"], status: "draft", metrics: { totalQuestions: 10, totalPoints: 20 }, versionNumber: 1, rootExamSetId: "607f...", isLatestVersion: true, createdAt: new Date("2026-01-01T00:00:00Z"), updatedAt: new Date("2026-01-01T00:00:00Z") }, owner: { _id: "507f...", fullName: "Owner", email: "owner@example.com", avatar: "" } }], totalCount: [{ count: 1 }] }]);
        const result = await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", { page: 1, limit: 10 });
        assert.equal(result.items.length, 1);
        assert.equal(result.items[0].share.permission, "VIEW");
        assert.equal(result.items[0].examSet.title, "Title X");
      },
    },
    {
      name: "Teacher gets shared exam set with EDIT permission",
      fn: async () => {
        ExamSetShare.aggregate = () => Promise.resolve([{ items: [{ share: { permission: "EDIT" }, examSet: { title: "Title Y" }, owner: { email: "owner@example.com" } }], totalCount: [{ count: 1 }] }]);
        const result = await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", { page: 1, limit: 10, permission: "EDIT" });
        assert.equal(result.items[0].share.permission, "EDIT");
      },
    },
    {
      name: "Empty list returns 200 with pagination totalItems 0",
      fn: async () => {
        ExamSetShare.aggregate = () => Promise.resolve([{ items: [], totalCount: [] }]);
        const result = await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", { page: 1, limit: 10 });
        assert.equal(result.items.length, 0);
        assert.equal(result.pagination.totalItems, 0);
        assert.equal(result.pagination.totalPages, 0);
      },
    },
    {
      name: "Filter ownerId is passed through",
      fn: async () => {
        let pipeline;
        ExamSetShare.aggregate = (p) => {
          pipeline = p;
          return Promise.resolve([{ items: [], totalCount: [] }]);
        };
        await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", { page: 1, limit: 10, ownerId: "507f1f77bcf86cd799439011" });
        assert.ok(pipeline.some((stage) => stage.$match && stage.$match["examSet.ownerId"]));
      },
    },
    {
      name: "Search term is escaped and used in pipeline",
      fn: async () => {
        let pipeline;
        ExamSetShare.aggregate = (p) => {
          pipeline = p;
          return Promise.resolve([{ items: [], totalCount: [] }]);
        };
        await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", { page: 1, limit: 10, search: "Title" });
        assert.ok(pipeline.some((stage) => stage.$match && stage.$match.$or));
      },
    },
    {
      name: "Student gets 403",
      fn: async () => {
        let caught = null;
        try {
          await listSharedExamSetsService("607f1f77bcf86cd799439222", "Student", { page: 1, limit: 10 });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 403);
      },
    },
    {
      name: "Invalid user id returns 400",
      fn: async () => {
        let caught = null;
        try {
          await listSharedExamSetsService("invalid-id", "Teacher", { page: 1, limit: 10 });
        } catch (err) { caught = err; }
        assert.ok(caught && caught.status === 400);
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
