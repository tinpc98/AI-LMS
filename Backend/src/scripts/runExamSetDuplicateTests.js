import assert from "assert";
import ExamSet from "#modules/exam-set/examSet.model.js";
import { Folder } from "#modules/folder";
import { duplicateExamSetService } from "#modules/exam-set/examSet.service.js";

const originalFindOne = ExamSet.findOne;
const originalFolderFindOne = Folder.findOne;
const originalSave = ExamSet.prototype.save;
const originalPopulate = ExamSet.prototype.populate;

const restore = () => {
  ExamSet.findOne = originalFindOne;
  Folder.findOne = originalFolderFindOne;
  ExamSet.prototype.save = originalSave;
  ExamSet.prototype.populate = originalPopulate;
};

const createQueryMock = (result) => ({
  populate() {
    return this;
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
});

const createExamSet = (props = {}) => {
  const source = {
    _id: "607f1f77bcf86cd799439111",
    ownerId: "507f1f77bcf86cd799439011",
    folderId: "607f1f77bcf86cd799439022",
    title: "JavaScript Basic Test",
    description: "Original description",
    tags: ["js"],
    status: "published",
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
        questions: this.questions.map((q) => ({ ...q })),
      };
    },
    ...props,
  };

  return source;
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
    name: "Owner duplicate creates independent draft copy with cloned questions",
    fn: async () => {
      const sourceExamSet = createExamSet();
      const folder = {
        _id: sourceExamSet.folderId,
        ownerId: sourceExamSet.ownerId,
        isDeleted: false,
      };

      ExamSet.findOne = () => createQueryMock(sourceExamSet);
      Folder.findOne = async () => folder;
      ExamSet.prototype.save = async function () {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        return this;
      };
      ExamSet.prototype.populate = function () {
        return this;
      };

      const result = await duplicateExamSetService(
        sourceExamSet._id,
        "507f1f77bcf86cd799439011",
        "Teacher"
      );

      assert.notStrictEqual(result._id.toString(), sourceExamSet._id.toString());
      assert.equal(String(result.ownerId), "507f1f77bcf86cd799439011");
      assert.equal(result.status, "draft");
      assert.equal(result.title, "JavaScript Basic Test - Copy");
      assert.equal(result.questions.length, 1);
      assert.notStrictEqual(
        result.questions[0]._id.toString(),
        sourceExamSet.questions[0]._id.toString()
      );
      assert.equal(result.questionCount, 1);
      assert.equal(result.totalPoints, 10);
      assert.equal(sourceExamSet.status, "published");
      assert.equal(sourceExamSet.title, "JavaScript Basic Test");
    },
  },
  {
    name: "Admin duplicate uses null folder for other owner resources",
    fn: async () => {
      const sourceExamSet = createExamSet({ ownerId: "teacher-1", folderId: "folder-2" });

      ExamSet.findOne = () => createQueryMock(sourceExamSet);
      Folder.findOne = async () => null;
      ExamSet.prototype.save = async function () {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        return this;
      };
      ExamSet.prototype.populate = function () {
        return this;
      };

      const result = await duplicateExamSetService(
        sourceExamSet._id,
        "507f1f77bcf86cd799439999",
        "Admin"
      );

      assert.equal(result.folderId, null);
      assert.equal(result.status, "draft");
      assert.equal(String(result.ownerId), "507f1f77bcf86cd799439999");
    },
  },
  {
    name: "Service denies duplicate for non-owner non-admin",
    fn: async () => {
      const sourceExamSet = createExamSet();

      ExamSet.findOne = () => createQueryMock(sourceExamSet);
      Folder.findOne = async () => null;
      ExamSet.prototype.save = async function () {
        return this;
      };
      ExamSet.prototype.populate = function () {
        return this;
      };

      try {
        await duplicateExamSetService(sourceExamSet._id, "student-1", "Student");
        throw new Error("Expected duplicate permission error");
      } catch (error) {
        assert.equal(error.status, 403, `Expected 403, got ${error.status}`);
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
