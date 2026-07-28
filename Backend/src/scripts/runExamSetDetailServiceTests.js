import ExamSet from "../models/examSet.model.js";
import { getExamSetDetailService } from "../services/examSet.services.js";

const createExamSet = (props = {}) => {
  return {
    ...props,
    toObject() {
      const { toObject, populate, ...rest } = this;
      return rest;
    },
    populate() {
      return this;
    },
  };
};

const createQueryMock = (result) => {
  return {
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
  }
};

const tests = [
  {
    name: "Invalid examSetId should reject with 400",
    fn: async () => {
      try {
        await getExamSetDetailService("invalid-id", { id: "user-1", role: "Teacher" });
        throw new Error("Expected error but got success");
      } catch (error) {
        if (error.status !== 400) {
          throw new Error(`Expected status 400, got ${error.status}`);
        }
      }
    },
  },
  {
    name: "Owner can retrieve own exam set detail",
    fn: async () => {
      const examSet = createExamSet({
        _id: "507f1f77bcf86cd799439011",
        ownerId: { _id: "user-1", fullName: "Teacher A", avatar: "avatar.png" },
        folderId: { _id: "folder-1", name: "Math" },
        title: "Exam Set 1",
        description: "Description",
        status: "draft",
        tags: ["math"],
        questionCount: 1,
        totalPoints: 10,
        version: 1,
        questions: [
          {
            questionId: "q-1",
            order: 0,
            type: "short_answer",
            content: "What is 2+2?",
            points: 10,
            correctAnswer: "4",
          },
        ],
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      });

      const originalFindOne = ExamSet.findOne;
      ExamSet.findOne = () => createQueryMock(examSet);

      const result = await getExamSetDetailService(examSet._id, {
        id: "user-1",
        role: "Teacher",
      });
      ExamSet.findOne = originalFindOne;

      if (!result || result.id !== String(examSet._id)) {
        throw new Error("Returned exam set detail is invalid");
      }
      if (!result.access?.isOwner) {
        throw new Error("Expected owner access");
      }
    },
  },
  {
    name: "Admin can retrieve any exam set detail",
    fn: async () => {
      const examSet = createExamSet({
        _id: "507f1f77bcf86cd799439012",
        ownerId: { _id: "user-2", fullName: "Teacher B", avatar: "avatar2.png" },
        folderId: { _id: "folder-2", name: "Physics" },
        title: "Exam Set 2",
        status: "published",
        questionCount: 0,
        totalPoints: 0,
        version: 1,
        questions: [],
        createdAt: new Date("2024-01-02T00:00:00.000Z"),
        updatedAt: new Date("2024-01-03T00:00:00.000Z"),
      });

      const originalFindOne = ExamSet.findOne;
      ExamSet.findOne = () => createQueryMock(examSet);

      const result = await getExamSetDetailService(examSet._id, {
        id: "admin-1",
        role: "Admin",
      });
      ExamSet.findOne = originalFindOne;

      if (!result || result.access?.permission !== "ADMIN") {
        throw new Error("Expected admin permission");
      }
      if (result.access?.canEdit) {
        throw new Error("Admin should not be treated as owner");
      }
    },
  },
  {
    name: "Non-owner non-admin cannot retrieve exam set detail",
    fn: async () => {
      const originalFindOne = ExamSet.findOne;
      ExamSet.findOne = () => createQueryMock(null);

      try {
        await getExamSetDetailService("507f1f77bcf86cd799439013", {
          id: "user-3",
          role: "Teacher",
        });
        throw new Error("Expected not found error");
      } catch (error) {
        if (error.status !== 404) {
          throw new Error(`Expected status 404, got ${error.status}`);
        }
      }
      ExamSet.findOne = originalFindOne;
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
