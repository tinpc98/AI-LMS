import assert from "assert";
import { updateExamSetTagsService } from "#modules/exam-set/examSet.service.js";

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

const createExamSet = (overrides = {}) => ({
  _id: "507f1f77bcf86cd799439999",
  ownerId: "507f1f77bcf86cd799439011",
  folderId: "607f1f77bcf86cd799439022",
  status: "draft",
  tags: ["old"],
  isDeleted: false,
  async save() {
    return this;
  },
  populate() {
    return this;
  },
  ...overrides,
});

const tests = [
  {
    name: "Normalizes tags and removes duplicates",
    fn: async () => {
      const examSet = createExamSet();

      const result = await updateExamSetTagsService(examSet, [
        "  #Math  ",
        "science",
        "math",
        "#Science",
      ]);

      assert.deepEqual(result.tags, ["math", "science"]);
      assert.equal(result.status, "draft");
    },
  },
  {
    name: "Allows empty tag list",
    fn: async () => {
      const examSet = createExamSet();

      const result = await updateExamSetTagsService(examSet, []);

      assert.deepEqual(result.tags, []);
    },
  },
  {
    name: "Rejects non-string tag values",
    fn: async () => {
      const examSet = createExamSet();

      try {
        await updateExamSetTagsService(examSet, ["valid", 123]);
        throw new Error("Expected validation error");
      } catch (error) {
        assert.equal(error.status, 400);
        assert.ok(error.message.includes("tags[1] phải là chuỗi"));
      }
    },
  },
  {
    name: "Rejects too many tags",
    fn: async () => {
      const examSet = createExamSet();
      const tags = Array.from({ length: 21 }, (_, index) => `tag${index}`);

      try {
        await updateExamSetTagsService(examSet, tags);
        throw new Error("Expected validation error");
      } catch (error) {
        assert.equal(error.status, 400);
        assert.ok(error.message.includes("Không được phép có quá 20 tag"));
      }
    },
  },
  {
    name: "Rejects update when exam set is not draft",
    fn: async () => {
      const examSet = createExamSet({ status: "published" });

      try {
        await updateExamSetTagsService(examSet, ["tag"]);
        throw new Error("Expected permission error");
      } catch (error) {
        assert.equal(error.status, 403);
        assert.ok(error.message.includes("Không thể cập nhật tags"));
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
