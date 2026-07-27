import { examSetQuestionCreateValidation, examSetQuestionUpdateValidation } from "../utils/validators.js";
import { isEditableExamSetStatus } from "../services/examSet.services.js";

const createReq = (body) => ({ body });
const createRes = () => {
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

const runTest = async (name, { middleware, payload, expectedSuccess, expectedMessageFragment }) => {
  const req = createReq(payload);
  const res = createRes();
  const passed = await runMiddleware(middleware, req, res).catch((error) => {
    console.error(`${name}: unexpected error`, error);
    return false;
  });

  if (expectedSuccess) {
    if (!passed) {
      console.error(`FAIL: ${name} - expected pass but middleware rejected`, res.body);
      return false;
    }
    return true;
  }

  if (res.statusCode !== 400) {
    console.error(`FAIL: ${name} - expected 400 but got ${res.statusCode}`, res.body);
    return false;
  }

  if (expectedMessageFragment) {
    const message = typeof res.body.message === "string" ? res.body.message : JSON.stringify(res.body.message);
    if (!message.includes(expectedMessageFragment)) {
      console.error(`FAIL: ${name} - expected '${expectedMessageFragment}' in message but got '${message}'`, res.body);
      return false;
    }
  }
  return true;
};

const tests = [
  {
    name: "Create ESSAY valid required fields",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-1",
      type: "essay",
      content: "Phân tích ưu điểm và nhược điểm của mô hình MVC.",
      score: 5,
      difficulty: "medium",
    },
    expectedSuccess: true,
  },
  {
    name: "Create ESSAY valid with suggestedAnswer",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-2",
      type: "essay",
      content: "Hãy trình bày tính năng chính của REST API.",
      score: 4,
      difficulty: "easy",
      suggestedAnswer: "REST API là...",
    },
    expectedSuccess: true,
  },
  {
    name: "Create ESSAY valid with rubric",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-3",
      type: "essay",
      content: "Trình bày sự khác nhau giữa HTTP và HTTPS.",
      score: 5,
      difficulty: "medium",
      rubric: [
        { criterion: "Giải thích HTTP", maxScore: 2 },
        { criterion: "Giải thích HTTPS", maxScore: 2 },
        { criterion: "So sánh bảo mật", maxScore: 1 },
      ],
    },
    expectedSuccess: true,
  },
  {
    name: "Create ESSAY missing content",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-4",
      type: "essay",
      score: 5,
      difficulty: "medium",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Content là bắt buộc",
  },
  {
    name: "Create ESSAY content only whitespace",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-5",
      type: "essay",
      content: "    ",
      score: 5,
      difficulty: "medium",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Content là bắt buộc",
  },
  {
    name: "Create ESSAY content too long",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-6",
      type: "essay",
      content: "a".repeat(5001),
      score: 5,
      difficulty: "medium",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Content phải có độ dài từ 5 đến 5000 ký tự",
  },
  {
    name: "Create ESSAY negative score",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-7",
      type: "essay",
      content: "Phân tích MVC.",
      score: -1,
      difficulty: "medium",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Score phải là số hợp lệ và không được âm",
  },
  {
    name: "Create ESSAY score string invalid",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-8",
      type: "essay",
      content: "Phân tích MVC.",
      score: "5",
      difficulty: "medium",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Score phải là số hợp lệ và không được âm",
  },
  {
    name: "Create ESSAY invalid difficulty",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-9",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "expert",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Difficulty phải thuộc enum easy, medium, hard",
  },
  {
    name: "Create ESSAY invalid suggestedAnswer type",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-10",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      suggestedAnswer: 123,
    },
    expectedSuccess: false,
    expectedMessageFragment: "suggestedAnswer phải là một chuỗi",
  },
  {
    name: "Create ESSAY rubric not array",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-11",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: { criterion: "A", maxScore: 5 },
    },
    expectedSuccess: false,
    expectedMessageFragment: "Rubric phải là một mảng",
  },
  {
    name: "Create ESSAY rubric empty array",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-12",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: [],
    },
    expectedSuccess: false,
    expectedMessageFragment: "Rubric phải là mảng có tối thiểu 1 và tối đa 20 tiêu chí",
  },
  {
    name: "Create ESSAY rubric missing criterion",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-13",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: [{ maxScore: 2 }],
    },
    expectedSuccess: false,
    expectedMessageFragment: "rubric[0].criterion là bắt buộc",
  },
  {
    name: "Create ESSAY rubric empty criterion",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-14",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: [{ criterion: "   ", maxScore: 2 }],
    },
    expectedSuccess: false,
    expectedMessageFragment: "rubric[0].criterion là bắt buộc",
  },
  {
    name: "Create ESSAY rubric duplicate criterion",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-15",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: [
        { criterion: "Nêu khái niệm", maxScore: 2 },
        { criterion: "nêu khái niệm ", maxScore: 2 },
      ],
    },
    expectedSuccess: false,
    expectedMessageFragment: "rubric không được có tiêu chí trùng nhau",
  },
  {
    name: "Create ESSAY rubric missing maxScore",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-16",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: [{ criterion: "Nêu khái niệm" }],
    },
    expectedSuccess: false,
    expectedMessageFragment: "rubric[0].maxScore là bắt buộc và phải là số",
  },
  {
    name: "Create ESSAY rubric maxScore zero",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-17",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: [{ criterion: "Nêu khái niệm", maxScore: 0 }],
    },
    expectedSuccess: false,
    expectedMessageFragment: "rubric[0].maxScore phải lớn hơn 0",
  },
  {
    name: "Create ESSAY rubric maxScore negative",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-18",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: [{ criterion: "Nêu khái niệm", maxScore: -1 }],
    },
    expectedSuccess: false,
    expectedMessageFragment: "rubric[0].maxScore phải lớn hơn 0",
  },
  {
    name: "Create ESSAY rubric total greater than score",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-19",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      rubric: [
        { criterion: "A", maxScore: 3 },
        { criterion: "B", maxScore: 3 },
      ],
    },
    expectedSuccess: false,
    expectedMessageFragment: "Tổng rubric không được lớn hơn score của câu hỏi",
  },
  {
    name: "Create ESSAY with options forbidden",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-20",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      options: [{ id: "o1", text: "A" }],
    },
    expectedSuccess: false,
    expectedMessageFragment: "ESSAY không sử dụng options",
  },
  {
    name: "Create ESSAY with correctAnswer forbidden",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-21",
      type: "essay",
      content: "Phân tích MVC.",
      score: 5,
      difficulty: "medium",
      correctAnswer: "o1",
    },
    expectedSuccess: false,
    expectedMessageFragment: "ESSAY không sử dụng correctAnswer",
  },
  {
    name: "Update ESSAY valid partial suggestedAnswer",
    middleware: examSetQuestionUpdateValidation,
    payload: {
      type: "essay",
      suggestedAnswer: "Đáp án mẫu mới",
    },
    expectedSuccess: true,
  },
  {
    name: "Update ESSAY invalid rubric with rest valid",
    middleware: examSetQuestionUpdateValidation,
    payload: {
      type: "essay",
      suggestedAnswer: "Đáp án mẫu",
      rubric: [{ criterion: "Tiêu chí", maxScore: 6 }],
      score: 5,
    },
    expectedSuccess: false,
    expectedMessageFragment: "Tổng rubric không được lớn hơn score của câu hỏi",
  },
  {
    name: "Editable status draft allowed",
    middleware: null,
    payload: null,
    expectedSuccess: true,
    extra: () => isEditableExamSetStatus("draft") === true,
  },
  {
    name: "Published status not editable",
    middleware: null,
    payload: null,
    expectedSuccess: true,
    extra: () => isEditableExamSetStatus("published") === false,
  },
];

const runAll = async () => {
  let passedCount = 0;
  for (const test of tests) {
    let passed = false;
    if (test.extra) {
      passed = test.extra();
    } else {
      passed = await runTest(test.name, test);
    }
    if (passed) {
      console.log(`PASS: ${test.name}`);
      passedCount += 1;
    } else {
      console.error(`FAIL: ${test.name}`);
    }
  }

  console.log(`\n${passedCount}/${tests.length} tests passed.`);
  process.exit(passedCount === tests.length ? 0 : 1);
};

runAll();
