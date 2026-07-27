import assert from "assert";
import ExamSet from "../models/examSet.model.js";
import { requireExamSetDraftAccess } from "../middlewares/examSetAccess.middlewares.js";
import { saveDraftExamSetService } from "../services/examSet.services.js";

const createReq = (overrides = {}) => ({
  headers: {},
  params: {},
  body: {},
  user: null,
  ...overrides,
});

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.payload = payload;
    return res;
  };
  return res;
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
    name: "saveDraft service keeps draft status and updates metadata",
    fn: async () => {
      const examSet = {
        _id: "507f1f77bcf86cd799439021",
        ownerId: "owner-1",
        folderId: "folder-1",
        title: "Old title",
        description: "Old description",
        status: "draft",
        tags: ["old"],
        questions: [],
        isDeleted: false,
        async save() {
          return this;
        },
      };

      const updated = await saveDraftExamSetService(examSet, {
        title: "New title",
        description: "New description",
        tags: ["new"],
      });

      assert.equal(updated.status, "draft");
      assert.equal(updated.title, "New title");
      assert.equal(updated.description, "New description");
      assert.deepEqual(updated.tags, ["new"]);
    },
  },
  {
    name: "save draft middleware denies non-owner and non-admin with 403",
    fn: async () => {
      const examSet = {
        _id: "507f1f77bcf86cd799439022",
        ownerId: "owner-1",
        isDeleted: false,
      };

      const originalFindOne = ExamSet.findOne;
      ExamSet.findOne = async () => examSet;

      const req = createReq({
        params: { examSetId: examSet._id },
        user: { id: "student-1", role: "Student" },
      });
      const res = createRes();

      let nextCalled = false;
      await requireExamSetDraftAccess(req, res, () => {
        nextCalled = true;
      });

      ExamSet.findOne = originalFindOne;

      assert.equal(res.statusCode, 403, `Expected 403, got ${res.statusCode}`);
      assert.equal(nextCalled, false);
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
