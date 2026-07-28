import assert from "assert";
import ExamSet from "../models/examSet.model.js";
import { getExamSetVersionsService } from "../services/examSet.services.js";

const originalFindOne = ExamSet.findOne;
const originalFind = ExamSet.find;
const originalCount = ExamSet.countDocuments;

const restore = () => {
  ExamSet.findOne = originalFindOne;
  ExamSet.find = originalFind;
  ExamSet.countDocuments = originalCount;
};

const createExamSet = (props = {}) => {
  const base = {
    _id: "607f1f77bcf86cd799439111",
    ownerId: "507f1f77bcf86cd799439011",
    title: "Sample Exam",
    versionNumber: 1,
    status: "published",
    rootExamSetId: null,
    previousVersionId: null,
    isLatestVersion: true,
    questionCount: 1,
    totalPoints: 10,
    createdAt: new Date("2024-01-01T00:00:00Z"),
    updatedAt: new Date("2024-01-02T00:00:00Z"),
    publishedAt: new Date("2024-01-03T00:00:00Z"),
  };

  return { ...base, ...props };
};

const runTest = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    return true;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err && err.message ? err.message : err);
    return false;
  } finally {
    restore();
  }
};

const tests = [
  {
    name: "Owner can retrieve full lineage versions sorted desc",
    fn: async () => {
      const source = createExamSet({ _id: "607f1f77bcf86cd799439101", ownerId: "owner-1", rootExamSetId: null, versionNumber: 2 });

      ExamSet.findOne = (query) => ({ lean: () => source });

      const versions = [
        { _id: "607f1f77bcf86cd799439103", title: "v3", versionNumber: 3, isLatestVersion: true, ownerId: "owner-1", questionCount: 3, totalPoints: 30, createdAt: new Date(), updatedAt: new Date(), publishedAt: null },
        { _id: "607f1f77bcf86cd799439102", title: "v2", versionNumber: 2, isLatestVersion: false, ownerId: "owner-1", questionCount: 2, totalPoints: 20, createdAt: new Date(), updatedAt: new Date(), publishedAt: null },
        { _id: "607f1f77bcf86cd799439101", title: "v1", versionNumber: 1, isLatestVersion: false, ownerId: "owner-1", questionCount: 1, totalPoints: 10, createdAt: new Date(), updatedAt: new Date(), publishedAt: null },
      ];

      ExamSet.find = () => ({
        select() { return this; },
        lean() { return this; },
        sort() { return this; },
        skip() { return this; },
        limit() { return this; },
        exec: async () => versions,
      });
      ExamSet.countDocuments = async () => versions.length;

      const res = await getExamSetVersionsService(source._id, "owner-1", "teacher", { page: 1, limit: 10, sort: "desc" });

      assert.equal(res.versions.length, 3);
      assert.equal(res.versions[0].versionNumber, 3);
      assert.equal(res.pagination.totalItems, 3);
    },
  },
  {
    name: "Sort asc works",
    fn: async () => {
      const source = createExamSet({ _id: "607f1f77bcf86cd799439201", ownerId: "owner-2", rootExamSetId: "607f1f77bcf86cd799439201", versionNumber: 2 });
      ExamSet.findOne = (query) => ({ lean: () => source });

      const versions = [
        { _id: "607f1f77bcf86cd799439202", versionNumber: 1, ownerId: "owner-2", questionCount: 1, totalPoints: 10, createdAt: new Date(), updatedAt: new Date() },
        { _id: "607f1f77bcf86cd799439203", versionNumber: 2, ownerId: "owner-2", questionCount: 2, totalPoints: 20, createdAt: new Date(), updatedAt: new Date() },
      ];

      ExamSet.find = () => ({
        select() { return this; },
        lean() { return this; },
        sort() { return this; },
        skip() { return this; },
        limit() { return this; },
        exec: async () => versions,
      });
      ExamSet.countDocuments = async () => versions.length;

      const res = await getExamSetVersionsService(source._id, "owner-2", "teacher", { page: 1, limit: 10, sort: "asc" });
      assert.equal(res.versions[0].versionNumber, 1);
    },
  },
  {
    name: "Source without rootExamSetId uses its own id as root",
    fn: async () => {
      const source = createExamSet({ _id: "607f1f77bcf86cd799439301", ownerId: "owner-3", rootExamSetId: null, versionNumber: 1 });
      ExamSet.findOne = (query) => ({ lean: () => source });

      const versions = [{ _id: "607f1f77bcf86cd799439301", versionNumber: 1, ownerId: "owner-3", questionCount: 1, totalPoints: 10, createdAt: new Date(), updatedAt: new Date() }];
      ExamSet.find = () => ({
        select() { return this; },
        lean() { return this; },
        sort() { return this; },
        skip() { return this; },
        limit() { return this; },
        exec: async () => versions,
      });
      ExamSet.countDocuments = async () => 1;

      const res = await getExamSetVersionsService(source._id, "owner-3", "teacher", {});
      assert.equal(res.versions.length, 1);
      assert.equal(res.rootExamSetId, String(source._id));
    },
  },
  {
    name: "Unauthorized user cannot access lineage",
    fn: async () => {
      const source = createExamSet({ _id: "607f1f77bcf86cd799439401", ownerId: "owner-x", rootExamSetId: null });
      ExamSet.findOne = (query) => ({ lean: () => source });

      let caught = null;
      try {
        await getExamSetVersionsService(source._id, "someone-else", "teacher", {});
      } catch (err) {
        caught = err;
      }

      assert.ok(caught && caught.status === 404);
    },
  },
];

const runAll = async () => {
  let passed = 0;
  for (const t of tests) {
    if (await runTest(t.name, t.fn)) passed += 1;
  }
  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
