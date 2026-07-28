import assert from "assert";
import ExamSet from "../models/examSet.model.js";
import Folder from "../models/folder.model.js";
import { createNewExamSetVersionService } from "../services/examSet.services.js";

const originalExamSetFindOne = ExamSet.findOne;
const originalFolderFindOne = Folder.findOne;
const originalSave = ExamSet.prototype.save;

const restore = () => {
  ExamSet.findOne = originalExamSetFindOne;
  Folder.findOne = originalFolderFindOne;
  ExamSet.prototype.save = originalSave;
};

const createQueryMock = (result) => {
  const query = {
    sort() {
      return query;
    },
    select() {
      return query;
    },
    lean() {
      return result;
    },
    populate() {
      return query;
    },
    exec: async () => result,
    then: async (resolve, reject) => {
      try {
        const value = await result;
        return resolve ? resolve(value) : value;
      } catch (err) {
        return reject ? reject(err) : Promise.reject(err);
      }
    },
  };
  return query;
};

const createExamSet = (props = {}) => {
  const base = {
    _id: "607f1f77bcf86cd799439111",
    ownerId: "507f1f77bcf86cd799439011",
    folderId: "607f1f77bcf86cd799439022",
    title: "Sample Exam Set",
    description: "Original description",
    tags: ["math"],
    status: "published",
    versionNumber: 1,
    version: 1,
    rootExamSetId: null,
    previousVersionId: null,
    isLatestVersion: true,
    questions: [
      {
        _id: "507f1f77bcf86cd799439222",
        questionId: "q-1",
        order: 0,
        type: "short_answer",
        content: "What is 2+2?",
        points: 10,
        difficulty: "easy",
        correctAnswer: "4",
        options: [],
        acceptedAnswers: [],
        rubric: [],
        suggestedAnswer: "4",
      },
    ],
    isDeleted: false,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    toObject() {
      return {
        ...this,
        questions: Array.isArray(this.questions)
          ? this.questions.map((question) => ({ ...question }))
          : [],
      };
    },
  };

  return {
    ...base,
    save: async function () {
      this.updatedAt = new Date();
      return this;
    },
    ...props,
  };
};

const runTest = async (name, callback) => {
  try {
    await callback();
    console.log(`PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.message || error);
    return false;
  } finally {
    restore();
  }
};

const tests = [
  {
    name: "Owner can create a new version from the latest published exam set",
    fn: async () => {
      const sourceExamSet = createExamSet();
      const folder = { _id: sourceExamSet.folderId, ownerId: sourceExamSet.ownerId, isDeleted: false };

      ExamSet.findOne = (query) => {
        if (query && query._id === sourceExamSet._id && query.isDeleted === false) {
          return createQueryMock(sourceExamSet);
        }

        if (query && query.$or) {
          return createQueryMock({ versionNumber: sourceExamSet.versionNumber });
        }

        return createQueryMock(null);
      };

      Folder.findOne = async () => folder;
      ExamSet.prototype.save = async function () {
        this.updatedAt = new Date();
        return this;
      };

      const result = await createNewExamSetVersionService(sourceExamSet._id, sourceExamSet.ownerId, "Teacher");

      assert.equal(result.versionNumber, 2);
      assert.equal(result.status, "draft");
      assert.equal(String(result.previousVersionId), String(sourceExamSet._id));
      assert.equal(String(result.rootExamSetId), String(sourceExamSet._id));
      assert.equal(result.isLatestVersion, true);
      assert.equal(result.ownerId, sourceExamSet.ownerId);
      assert.equal(result.questions.length, 1);
      assert.notStrictEqual(result.questions[0]._id, sourceExamSet.questions[0]._id);
      assert.equal(sourceExamSet.isLatestVersion, false);
      assert.equal(String(sourceExamSet.rootExamSetId), String(sourceExamSet._id));
    },
  },
  {
    name: "Non-owner non-admin cannot create a new version",
    fn: async () => {
      const sourceExamSet = createExamSet();

      ExamSet.findOne = (query) => {
        if (query && query._id === sourceExamSet._id && query.isDeleted === false) {
          return createQueryMock(sourceExamSet);
        }
        return createQueryMock(null);
      };

      Folder.findOne = async () => null;
      ExamSet.prototype.save = async function () {
        return this;
      };

      let caught = null;
      try {
        await createNewExamSetVersionService(sourceExamSet._id, "student-1", "Student");
      } catch (error) {
        caught = error;
      }

      assert.ok(caught, "Expected error to be thrown");
      assert.equal(caught.status, 403);
    },
  },
  {
    name: "Cannot create a new version when source is not latest",
    fn: async () => {
      const sourceExamSet = createExamSet({ isLatestVersion: false });

      ExamSet.findOne = (query) => {
        if (query && query._id === sourceExamSet._id && query.isDeleted === false) {
          return createQueryMock(sourceExamSet);
        }
        return createQueryMock(null);
      };

      Folder.findOne = async () => null;
      ExamSet.prototype.save = async function () {
        return this;
      };

      let caught = null;
      try {
        await createNewExamSetVersionService(sourceExamSet._id, sourceExamSet.ownerId, "Teacher");
      } catch (error) {
        caught = error;
      }

      assert.ok(caught, "Expected error to be thrown");
      assert.equal(caught.status, 409);
    },
  },
  {
    name: "Cannot create a new version from a draft source",
    fn: async () => {
      const sourceExamSet = createExamSet({ status: "draft" });

      ExamSet.findOne = (query) => {
        if (query && query._id === sourceExamSet._id && query.isDeleted === false) {
          return createQueryMock(sourceExamSet);
        }
        return createQueryMock(null);
      };

      Folder.findOne = async () => null;
      ExamSet.prototype.save = async function () {
        return this;
      };

      let caught = null;
      try {
        await createNewExamSetVersionService(sourceExamSet._id, sourceExamSet.ownerId, "Teacher");
      } catch (error) {
        caught = error;
      }

      assert.ok(caught, "Expected error to be thrown");
      assert.equal(caught.status, 409);
    },
  },
];

const runAll = async () => {
  let passed = 0;

  for (const test of tests) {
    if (await runTest(test.name, test.fn)) {
      passed += 1;
    }
  }

  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
