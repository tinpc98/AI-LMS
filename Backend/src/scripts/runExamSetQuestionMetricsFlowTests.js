import ExamSet from "../models/examSet.model.js";
import {
  addQuestionToExamSetService,
  updateQuestionInExamSetService,
  deleteQuestionFromExamSetService,
} from "../services/examSet.services.js";

const createQuestion = (data) => {
  const question = {
    ...data,
    toObject() {
      const { toObject, ...rest } = this;
      return rest;
    },
  };
  return question;
};

const createExamSet = (props) => {
  return {
    ...props,
    questions: Array.isArray(props.questions) ? props.questions : [],
    save: async function () {
      return this;
    },
    populate: function () {
      return this;
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
    console.error(error);
    return false;
  }
};

const tests = [
  {
    name: "Add question recalculates metrics",
    fn: async () => {
      const examSet = createExamSet({
        _id: "set-1",
        ownerId: "user-1",
        status: "draft",
        isDeleted: false,
        questions: [],
      });

      const originalFindOne = ExamSet.findOne;
      ExamSet.findOne = async () => examSet;

      const questionData = {
        questionId: "q-1",
        type: "multiple_choice",
        content: "What is 1+1?",
        options: [
          { id: "o1", text: "1", isCorrect: false },
          { id: "o2", text: "2", isCorrect: true },
        ],
        correctAnswer: "o2",
        points: 3,
      };

      const result = await addQuestionToExamSetService("set-1", "user-1", questionData);
      ExamSet.findOne = originalFindOne;

      if (result.questionCount !== 1 || result.totalPoints !== 3) {
        throw new Error(`Expected count 1 and points 3, got count=${result.questionCount} points=${result.totalPoints}`);
      }
    },
  },
  {
    name: "Update question preserves metrics when points change",
    fn: async () => {
      const examSet = createExamSet({
        _id: "set-2",
        ownerId: "user-2",
        status: "draft",
        isDeleted: false,
        questions: [
          createQuestion({
            questionId: "q-2",
            order: 0,
            type: "short_answer",
            content: "Name a planet.",
            points: 2,
            correctAnswer: "Mars",
            isActive: true,
          }),
        ],
      });

      const originalFindOne = ExamSet.findOne;
      ExamSet.findOne = async () => examSet;

      const result = await updateQuestionInExamSetService("set-2", "user-2", "q-2", { points: 5 });
      ExamSet.findOne = originalFindOne;

      if (result.questionCount !== 1 || result.totalPoints !== 5) {
        throw new Error(`Expected count 1 and points 5, got count=${result.questionCount} points=${result.totalPoints}`);
      }
    },
  },
  {
    name: "Delete question updates metrics",
    fn: async () => {
      const examSet = createExamSet({
        _id: "set-3",
        ownerId: "user-3",
        status: "draft",
        isDeleted: false,
        questions: [
          createQuestion({
            questionId: "q-3a",
            order: 0,
            type: "essay",
            content: "Explain MVC.",
            points: 4,
            score: 4,
            isActive: true,
          }),
          createQuestion({
            questionId: "q-3b",
            order: 1,
            type: "true_false",
            content: "The sky is blue.",
            points: 3,
            correctAnswer: true,
            options: [
              { id: "true", text: "True", isCorrect: true },
              { id: "false", text: "False", isCorrect: false },
            ],
            isActive: true,
          }),
        ],
      });

      const originalFindOne = ExamSet.findOne;
      ExamSet.findOne = async () => examSet;

      const result = await deleteQuestionFromExamSetService("507f1f77bcf86cd799439011", "user-3", "teacher", "q-3a");
      ExamSet.findOne = originalFindOne;

      if (result.questionCount !== 1 || result.totalPoints !== 3) {
        throw new Error(`Expected count 1 and points 3, got count=${result.questionCount} points=${result.totalPoints}`);
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
