import { validationResult } from "express-validator";
import { multipleChoiceQuestionValidation } from "../utils/validators.js";

const createRequest = (body) => ({ body });

const createResponse = () => {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
};

const runMiddleware = async (middleware, req, res) => {
  for (const fn of middleware) {
    await new Promise((resolve, reject) => {
      const next = (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      };

      try {
        fn(req, res, next);
      } catch (error) {
        reject(error);
      }
    });

    if (res.statusCode) {
      return false;
    }
  }
  return true;
};

const runTest = async (name, payload, expectedSuccess, expectedMessageFragment) => {
  const req = createRequest(payload);
  const res = createResponse();

  const passed = await runMiddleware(multipleChoiceQuestionValidation, req, res).catch((error) => {
    console.error(`[ERROR] ${name}:`, error);
    return false;
  });

  if (expectedSuccess) {
    if (!passed) {
      console.error(`FAIL: ${name} - expected pass but middleware rejected`);
      return false;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error(`FAIL: ${name} - unexpected validation errors`, errors.array());
      return false;
    }
    console.log(`PASS: ${name}`);
    return true;
  }

  if (!res.body || res.statusCode !== 400) {
    console.error(`FAIL: ${name} - expected 400 response but got`, { statusCode: res.statusCode, body: res.body });
    return false;
  }

  const message = typeof res.body.message === "string" ? res.body.message : JSON.stringify(res.body.message);
  if (expectedMessageFragment && !message.includes(expectedMessageFragment)) {
    console.error(`FAIL: ${name} - expected message to include '${expectedMessageFragment}' but got '${message}'`);
    return false;
  }

  console.log(`PASS: ${name}`);
  return true;
};

const tests = [
  {
    name: "Valid multiple choice question",
    payload: {
      questionId: "q1",
      type: "multiple_choice",
      content: "What is 2+2?",
      options: [
        { id: "o1", text: "3", isCorrect: false },
        { id: "o2", text: "4", isCorrect: true },
      ],
      correctAnswer: "o2",
      points: 1,
      difficulty: "easy",
    },
    expectedSuccess: true,
  },
  {
    name: "Missing content",
    payload: {
      questionId: "q2",
      type: "multiple_choice",
      options: [
        { id: "o1", text: "A", isCorrect: false },
        { id: "o2", text: "B", isCorrect: true },
      ],
      correctAnswer: "o2",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Content là bắt buộc",
  },
  {
    name: "Duplicate option ids",
    payload: {
      questionId: "q3",
      type: "multiple_choice",
      content: "Choose one",
      options: [
        { id: "o1", text: "A", isCorrect: false },
        { id: "o1", text: "B", isCorrect: true },
      ],
      correctAnswer: "o1",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Option id không được trùng nhau",
  },
  {
    name: "Correct answer not in options",
    payload: {
      questionId: "q4",
      type: "multiple_choice",
      content: "Choose one",
      options: [
        { id: "o1", text: "A", isCorrect: false },
        { id: "o2", text: "B", isCorrect: true },
      ],
      correctAnswer: "o3",
    },
    expectedSuccess: false,
    expectedMessageFragment: "correctAnswer phải tồn tại trong options",
  },
  {
    name: "Less than two options",
    payload: {
      questionId: "q5",
      type: "multiple_choice",
      content: "Choose one",
      options: [{ id: "o1", text: "A", isCorrect: true }],
      correctAnswer: "o1",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Phải có tối thiểu 2 options",
  },
  {
    name: "Negative score",
    payload: {
      questionId: "q6",
      type: "multiple_choice",
      content: "Choose one",
      options: [
        { id: "o1", text: "A", isCorrect: false },
        { id: "o2", text: "B", isCorrect: true },
      ],
      correctAnswer: "o2",
      points: -5,
    },
    expectedSuccess: false,
    expectedMessageFragment: "Score phải lớn hơn hoặc bằng 0",
  },
  {
    name: "Invalid difficulty enum",
    payload: {
      questionId: "q7",
      type: "multiple_choice",
      content: "Choose one",
      options: [
        { id: "o1", text: "A", isCorrect: false },
        { id: "o2", text: "B", isCorrect: true },
      ],
      correctAnswer: "o2",
      difficulty: "expert",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Difficulty phải thuộc enum easy, medium, hard",
  },
];

const runAll = async () => {
  let passedCount = 0;
  for (const test of tests) {
    const result = await runTest(test.name, test.payload, test.expectedSuccess, test.expectedMessageFragment);
    if (result) passedCount += 1;
  }

  console.log(`\n${passedCount}/${tests.length} tests passed.`);
  process.exit(passedCount === tests.length ? 0 : 1);
};

runAll();
