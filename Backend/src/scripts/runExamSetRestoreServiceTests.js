import assert from "assert";
import ExamSet from "../models/examSet.model.js";
import Folder from "../models/folder.model.js";
import { restoreExamSetVersionService } from "../services/examSet.services.js";

const originalFindOne = ExamSet.findOne;
const originalFind = ExamSet.find;
const originalCount = ExamSet.countDocuments;
const originalFolderFindOne = Folder.findOne;

const restoreAll = () => {
  ExamSet.findOne = originalFindOne;
  ExamSet.find = originalFind;
  ExamSet.countDocuments = originalCount;
  Folder.findOne = originalFolderFindOne;
};

const createExamSet = (props = {}) => {
  const base = {
    _id: "607f1f77bcf86cd799439111",
    ownerId: "507f1f77bcf86cd799439011",
    folderId: "607f1f77bcf86cd799439022",
    title: "Orig",
    description: "d",
    tags: ["t"],
    status: "published",
    versionNumber: 1,
    version: 1,
    rootExamSetId: null,
    previousVersionId: null,
    isLatestVersion: true,
    questions: [
      { _id: "507f1f77bcf86cd799439222", questionId: "q1", content: "c1", options: [], acceptedAnswers: [], rubric: [], points: 10 },
    ],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject() { return { ...this, questions: this.questions.map(q => ({ ...q })) }; },
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
    restoreAll();
  }
};

const tests = [
  {
    name: "Owner can restore older version and latest updated",
    fn: async () => {
      const src = createExamSet({ _id: "607f1f77bcf86cd799439101", versionNumber: 1, ownerId: "owner-1" });
      const v2 = createExamSet({ _id: "607f1f77bcf86cd799439102", versionNumber: 2, ownerId: "owner-1", isLatestVersion: false });
      const v3 = createExamSet({ _id: "607f1f77bcf86cd799439103", versionNumber: 3, ownerId: "owner-1", isLatestVersion: true });
      v3.save = async function () { return this; };

      ExamSet.findOne = (query) => {
        if (query && String(query._id) === String(src._id) && query.isDeleted === false) return src;
        // latest query: return chainable that supports .sort()
        return { sort() { return v3; } };
      };

      ExamSet.prototype.save = async function () { return this; };
      ExamSet.prototype.populate = function () { return this; };

      Folder.findOne = async () => ({ _id: src.folderId, ownerId: src.ownerId, isDeleted: false });

      const newV = await restoreExamSetVersionService(src._id, "owner-1", "teacher");

      assert.equal(newV.status, "draft");
      assert.equal(newV.versionNumber, 4);
      assert.equal(String(newV.previousVersionId), String(v3._id));
      assert.equal(newV.isLatestVersion, true);
      assert.equal(newV.questions.length, 1);
      assert.notStrictEqual(String(newV.questions[0]._id), String(src.questions[0]._id));
    },
  },
  {
    name: "Admin can restore",
    fn: async () => {
      const src = createExamSet({ _id: "607f1f77bcf86cd799439201", versionNumber: 1, ownerId: "owner-a" });
      const latest = createExamSet({ _id: "607f1f77bcf86cd799439203", versionNumber: 2, ownerId: "owner-a", isLatestVersion: true });
      latest.save = async function () { return this; };

      ExamSet.findOne = (query) => {
        if (query && String(query._id) === String(src._id) && query.isDeleted === false) return src;
        return { sort() { return latest; } };
      };

      ExamSet.prototype.save = async function () { return this; };
      Folder.findOne = async () => null;

      const newV = await restoreExamSetVersionService(src._id, "admin-1", "Admin");
      assert.equal(newV.status, "draft");
      assert.equal(String(newV.previousVersionId), String(latest._id));
    },
  },
  {
    name: "Cannot restore soft-deleted source",
    fn: async () => {
      const src = createExamSet({ _id: "607f1f77bcf86cd799439301", isDeleted: true });
      ExamSet.findOne = (query) => null;
      let caught = null;
      try {
        await restoreExamSetVersionService(src._id, "owner-1", "teacher");
      } catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
    },
  },
];

const runAll = async () => {
  let passed = 0;
  for (const t of tests) { if (await runTest(t.name, t.fn)) passed += 1; }
  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
