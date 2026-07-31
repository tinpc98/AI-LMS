import assert from "assert";
import ExamSet from "../models/examSet.model.js";
import Folder from "../models/folder.model.js";
import { createExamSetService, duplicateExamSetService } from "../services/examSet.service.js";

const createExamSetDoc = (props = {}) => {
  const examSet = {
    _id: "507f1f77bcf86cd799439999",
    ownerId: "507f1f77bcf86cd799439011",
    folderId: "607f1f77bcf86cd799439022",
    title: "Test Exam Set",
    description: "Desc",
    status: "draft",
    tags: ["test"],
    questions: [],
    isDeleted: false,
    async save() {
      return this;
    },
    populate() {
      return this;
    },
    ...props,
  };
  return examSet;
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
  }
};

const tests = [
  {
    name: "New exam set defaults versionNumber 1, previousVersionId null, isLatestVersion true, rootExamSetId self",
    fn: async () => {
      const examSet = createExamSetDoc();
      examSet._id = "507f1f77bcf86cd799439999";
      examSet.rootExamSetId = null;
      const originalSave = ExamSet.prototype.save;
      const originalFolderFindOne = Folder.findOne;

      ExamSet.prototype.save = async function () {
        return this;
      };
      Folder.findOne = async () => ({
        _id: examSet.folderId,
        ownerId: examSet.ownerId,
        isDeleted: false,
      });

      const result = await createExamSetService("507f1f77bcf86cd799439011", {
        folderId: examSet.folderId,
        title: examSet.title,
        description: examSet.description,
        tags: examSet.tags,
      });

      ExamSet.prototype.save = originalSave;
      Folder.findOne = originalFolderFindOne;

      assert.equal(result.versionNumber, 1);
      assert.equal(result.previousVersionId, null);
      assert.equal(result.isLatestVersion, true);
      assert.equal(String(result.rootExamSetId), String(result._id));
    },
  },
  {
    name: "Duplicate exam set creates independent lineage with versionNumber 1 and no source version metadata",
    fn: async () => {
      const sourceExamSet = createExamSetDoc({
        _id: "607f1f77bcf86cd799439111",
        versionNumber: 5,
        rootExamSetId: "607f1f77bcf86cd799439111",
        previousVersionId: "607f1f77bcf86cd799439110",
        isLatestVersion: false,
      });

      const originalFindOne = ExamSet.findOne;
      const originalFolderFindOne = Folder.findOne;
      const originalSave = ExamSet.prototype.save;
      const originalPopulate = ExamSet.prototype.populate;

      ExamSet.findOne = () => ({
        populate() {
          return this;
        },
        exec: async () => sourceExamSet,
        then: async (resolve, reject) => {
          try {
            const value = await sourceExamSet;
            return resolve ? resolve(value) : value;
          } catch (err) {
            return reject ? reject(err) : Promise.reject(err);
          }
        },
      });

      const folder = { _id: sourceExamSet.folderId, ownerId: sourceExamSet.ownerId, isDeleted: false };
      Folder.findOne = async () => folder;

      ExamSet.prototype.save = async function () {
        return this;
      };
      ExamSet.prototype.populate = function () {
        return this;
      };

      const result = await duplicateExamSetService(sourceExamSet._id, "507f1f77bcf86cd799439011", "Teacher");

      ExamSet.findOne = originalFindOne;
      Folder.findOne = originalFolderFindOne;
      ExamSet.prototype.save = originalSave;
      ExamSet.prototype.populate = originalPopulate;

      assert.equal(result.versionNumber, 1);
      assert.equal(result.previousVersionId, null);
      assert.equal(result.isLatestVersion, true);
      assert.equal(String(result.rootExamSetId), String(result._id));
      assert.notEqual(String(result.rootExamSetId), String(sourceExamSet.rootExamSetId));
    },
  },
  {
    name: "Schema rejects versionNumber 0, negative or decimal",
    fn: async () => {
      const invalids = [0, -1, 1.5];
      for (const invalid of invalids) {
        try {
          const doc = new ExamSet({
            ownerId: "507f1f77bcf86cd799439011",
            folderId: "607f1f77bcf86cd799439022",
            title: "Test",
            tags: ["test"],
            versionNumber: invalid,
            rootExamSetId: "507f1f77bcf86cd799439999",
            previousVersionId: null,
            isLatestVersion: true,
          });
          await doc.validate();
          throw new Error(`Expected invalid versionNumber ${invalid}`);
        } catch (err) {
          if (!(err.name === "ValidationError")) {
            throw err;
          }
        }
      }
    },
  },
  {
    name: "Schema rejects invalid ObjectId for rootExamSetId and previousVersionId",
    fn: async () => {
      try {
        const doc = new ExamSet({
          ownerId: "507f1f77bcf86cd799439011",
          folderId: "607f1f77bcf86cd799439022",
          title: "Test",
          tags: ["test"],
          rootExamSetId: "invalid-id",
          previousVersionId: "invalid-id",
          isLatestVersion: true,
        });
        await doc.validate();
        throw new Error("Expected invalid ObjectId validation error");
      } catch (err) {
        if (!(err.name === "ValidationError")) {
          throw err;
        }
      }
    },
  },
  {
    name: "Schema rejects previousVersionId equal to _id",
    fn: async () => {
      try {
        const doc = new ExamSet({
          _id: "507f1f77bcf86cd799439011",
          ownerId: "507f1f77bcf86cd799439011",
          folderId: "607f1f77bcf86cd799439022",
          title: "Test",
          tags: ["test"],
          previousVersionId: "507f1f77bcf86cd799439011",
          isLatestVersion: true,
        });
        await doc.validate();
        throw new Error("Expected previousVersionId self-reference validation error");
      } catch (err) {
        if (!(err.name === "ValidationError")) {
          throw err;
        }
      }
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
