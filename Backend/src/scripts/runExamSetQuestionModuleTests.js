import jwt from "jsonwebtoken";
import ExamSet from "../models/examSet.model.js";
import {
  addQuestionToExamSetService,
  updateQuestionInExamSetService,
  deleteQuestionFromExamSetService,
  reorderQuestionsInExamSetService,
} from "../services/examSet.service.js";
import { verifyUser } from "../middlewares/auth.middleware.js";
import { requireExamSetEditAccess } from "../middlewares/examSetAccess.middleware.js";
import {
  examSetQuestionCreateValidation,
  examSetQuestionUpdateValidation,
  reorderQuestionsValidation,
} from "../utils/validators.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-env";

const createReq = (props = {}) => ({
  headers: {},
  body: {},
  params: {},
  ...props,
});

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
  const handlers = Array.isArray(middleware) ? middleware : [middleware];
  for (const fn of handlers) {
    await new Promise((resolve, reject) => {
      let settled = false;

      const settle = (err, success = true) => {
        if (settled) return;
        settled = true;
        if (err) {
          reject(err);
        } else {
          resolve(success);
        }
      };

      const next = (err) => {
        settle(err, !err);
      };

      try {
        const result = fn(req, res, next);
        if (res.statusCode && !settled) {
          settle(null, false);
          return;
        }

        if (result && typeof result.then === "function") {
          result
            .then(() => {
              if (!settled) settle(null, true);
            })
            .catch((error) => {
              if (!settled) settle(error, false);
            });
        }
      } catch (error) {
        settle(error, false);
      }
    });

    if (res.statusCode) {
      return false;
    }
  }
  return true;
};

const createQuestion = (props = {}) => {
  const question = {
    ...props,
    toObject() {
      const { toObject, populate, ...rest } = this;
      return rest;
    },
  };
  return question;
};

const createExamSet = (props = {}) => {
  return {
    ...props,
    questions: Array.isArray(props.questions) ? props.questions : [],
    save: async function () {
      return this;
    },
    populate() {
      return this;
    },
  };
};

const mockExamSetFindOne = (result) => {
  const original = ExamSet.findOne;
  ExamSet.findOne = () => Promise.resolve(result);
  return original;
};

const restoreExamSetFindOne = (original) => {
  ExamSet.findOne = original;
};

const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

const tests = [];

const addTest = (name, fn) => {
  tests.push({ name, fn });
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const runTest = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    return true;
  } catch (error) {
    console.error(`FAIL: ${name}`);
    console.error(error.message || error);
    return false;
  }
};

// Validation tests
const validationTests = [
  {
    name: "Multiple Choice valid payload",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "mq-1",
      type: "multiple_choice",
      content: "What is 1+1?",
      options: [
        { id: "o1", text: "1", isCorrect: false },
        { id: "o2", text: "2", isCorrect: true },
      ],
      correctAnswer: "o2",
      points: 3,
      difficulty: "easy",
    },
    expectedSuccess: true,
  },
  {
    name: "Multiple Choice missing content",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "mq-2",
      type: "multiple_choice",
      options: [
        { id: "o1", text: "1", isCorrect: false },
        { id: "o2", text: "2", isCorrect: true },
      ],
      correctAnswer: "o2",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Content là bắt buộc",
  },
  {
    name: "Multiple Choice duplicate option id",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "mq-3",
      type: "multiple_choice",
      content: "Choose one.",
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
    name: "Multiple Choice correctAnswer not found",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "mq-4",
      type: "multiple_choice",
      content: "Choose one.",
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
    name: "Multiple Choice invalid difficulty",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "mq-5",
      type: "multiple_choice",
      content: "Choose one.",
      options: [
        { id: "o1", text: "A", isCorrect: false },
        { id: "o2", text: "B", isCorrect: true },
      ],
      correctAnswer: "o2",
      points: 2,
      difficulty: "expert",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Difficulty phải thuộc enum easy, medium, hard",
  },
  {
    name: "Essay missing score",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-1",
      type: "essay",
      content: "Explain what MVC means.",
      difficulty: "medium",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Score là bắt buộc cho ESSAY",
  },
  {
    name: "Essay negative score",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-2",
      type: "essay",
      content: "Explain what MVC means.",
      score: -1,
      difficulty: "medium",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Score phải là số hợp lệ và không được âm",
  },
  {
    name: "Essay invalid rubric total greater than score",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "essay-3",
      type: "essay",
      content: "Discuss REST.",
      score: 3,
      difficulty: "medium",
      rubric: [
        { criterion: "Concept", maxScore: 2 },
        { criterion: "Details", maxScore: 2 },
      ],
    },
    expectedSuccess: false,
    expectedMessageFragment: "Tổng rubric không được lớn hơn score của câu hỏi",
  },
  {
    name: "Short Answer missing correctAnswer",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "sa-1",
      type: "short_answer",
      content: "Name a planet.",
      difficulty: "easy",
    },
    expectedSuccess: false,
    expectedMessageFragment: "correctAnswer là bắt buộc cho short_answer",
  },
  {
    name: "True False invalid correctAnswer",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "tf-1",
      type: "true_false",
      content: "The earth is flat.",
      correctAnswer: "maybe",
      difficulty: "easy",
    },
    expectedSuccess: false,
    expectedMessageFragment: "correctAnswer phải là boolean hoặc 'true'/'false' cho true_false",
  },
  {
    name: "Invalid type",
    middleware: examSetQuestionCreateValidation,
    payload: {
      questionId: "invalid-1",
      type: "graph",
      content: "Test invalid type.",
      difficulty: "easy",
    },
    expectedSuccess: false,
    expectedMessageFragment: "Type phải là một trong các loại câu hỏi hợp lệ",
  },
];

validationTests.forEach((test) => {
  addTest(test.name, async () => {
    const req = createReq({ body: test.payload });
    const res = createRes();
    const passed = await runMiddleware(test.middleware, req, res).catch((error) => {
      throw new Error(`Middleware execution failed: ${error.message || error}`);
    });

    if (test.expectedSuccess) {
      assert(passed, "Expected middleware to pass");
      return;
    }

    assert(res.statusCode === 400, `Expected 400, got ${res.statusCode}`);
    if (test.expectedMessageFragment) {
      const message =
        typeof res.body.message === "string" ? res.body.message : JSON.stringify(res.body.message);
      assert(
        message.includes(test.expectedMessageFragment),
        `Expected message to include '${test.expectedMessageFragment}', got '${message}'`
      );
    }
  });
});

// Permission tests for middleware and auth
addTest("No JWT returns 401", async () => {
  const req = createReq();
  const res = createRes();
  const passed = await runMiddleware(verifyUser, req, res).catch((error) => {
    throw new Error(`verifyUser execution failed: ${error.message || error}`);
  });
  assert(!passed, "Expected middleware to fail without JWT");
  assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
});

addTest("Invalid JWT returns 401", async () => {
  const req = createReq({ headers: { authorization: "Bearer invalid.token.value" } });
  const res = createRes();
  const passed = await runMiddleware(verifyUser, req, res).catch((error) => {
    throw new Error(`verifyUser execution failed: ${error.message || error}`);
  });
  assert(!passed, "Expected middleware to fail with invalid JWT");
  assert(res.statusCode === 401, `Expected 401, got ${res.statusCode}`);
});

addTest("Owner edit access allowed", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const token = signToken({ id: ownerId, role: "Teacher", email: "owner@example.com" });
  const examSet = createExamSet({ _id: "607f1f77bcf86cd799439011", ownerId, isDeleted: false });
  const original = mockExamSetFindOne(examSet);

  const req = createReq({
    headers: { authorization: `Bearer ${token}` },
    params: { id: examSet._id },
  });
  const res = createRes();
  const passed = await runMiddleware([verifyUser, requireExamSetEditAccess], req, res);
  restoreExamSetFindOne(original);

  assert(passed, "Expected owner to pass edit access");
  assert(req.examSet === examSet, "Expected examSet to be attached to req");
});

addTest("Admin edit access allowed", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const token = signToken({ id: "admin-1", role: "Admin", email: "admin@example.com" });
  const examSet = createExamSet({ _id: "607f1f77bcf86cd799439012", ownerId, isDeleted: false });
  const original = mockExamSetFindOne(examSet);

  const req = createReq({
    headers: { authorization: `Bearer ${token}` },
    params: { id: examSet._id },
  });
  const res = createRes();
  const passed = await runMiddleware([verifyUser, requireExamSetEditAccess], req, res);
  restoreExamSetFindOne(original);

  assert(passed, "Expected admin to pass edit access");
  assert(req.examSet === examSet, "Expected examSet to be attached to req");
});

addTest("Teacher other than owner denied edit access", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const token = signToken({ id: "teacher-2", role: "Teacher", email: "teacher2@example.com" });
  const examSet = createExamSet({ _id: "607f1f77bcf86cd799439013", ownerId, isDeleted: false });
  const original = mockExamSetFindOne(examSet);

  const req = createReq({
    headers: { authorization: `Bearer ${token}` },
    params: { id: examSet._id },
  });
  const res = createRes();
  const passed = await runMiddleware([verifyUser, requireExamSetEditAccess], req, res);
  restoreExamSetFindOne(original);

  assert(!passed, "Expected teacher other than owner to be denied");
  assert(res.statusCode === 404, `Expected 404, got ${res.statusCode}`);
});

// Service tests for question module
addTest("Create first question sets questionCount and totalPoints", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const examSet = createExamSet({
    _id: "707f1f77bcf86cd799439011",
    ownerId,
    status: "draft",
    isDeleted: false,
    questions: [],
  });
  const original = mockExamSetFindOne(examSet);

  const questionData = {
    questionId: "q1",
    type: "multiple_choice",
    content: "What is 1+1?",
    options: [
      { id: "o1", text: "1", isCorrect: false },
      { id: "o2", text: "2", isCorrect: true },
    ],
    correctAnswer: "o2",
    points: 3,
    difficulty: "easy",
  };

  const result = await addQuestionToExamSetService(examSet._id, ownerId, questionData);
  restoreExamSetFindOne(original);

  assert(result.questionCount === 1, `Expected questionCount 1, got ${result.questionCount}`);
  assert(result.totalPoints === 3, `Expected totalPoints 3, got ${result.totalPoints}`);
});

addTest("Add second question increments count and totalPoints", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const examSet = createExamSet({
    _id: "707f1f77bcf86cd799439012",
    ownerId,
    status: "draft",
    isDeleted: false,
    questions: [
      createQuestion({
        questionId: "q1",
        order: 0,
        type: "multiple_choice",
        content: "What is 1+1?",
        options: [
          { id: "o1", text: "1", isCorrect: false },
          { id: "o2", text: "2", isCorrect: true },
        ],
        correctAnswer: "o2",
        points: 3,
        difficulty: "easy",
      }),
    ],
  });
  const original = mockExamSetFindOne(examSet);

  const questionData = {
    questionId: "q2",
    type: "short_answer",
    content: "Name a star.",
    correctAnswer: "Sun",
    points: 4,
    difficulty: "medium",
  };

  const result = await addQuestionToExamSetService(examSet._id, ownerId, questionData);
  restoreExamSetFindOne(original);

  assert(result.questionCount === 2, `Expected questionCount 2, got ${result.questionCount}`);
  assert(result.totalPoints === 7, `Expected totalPoints 7, got ${result.totalPoints}`);
});

addTest("Update question score changes totalPoints", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const examSet = createExamSet({
    _id: "707f1f77bcf86cd799439013",
    ownerId,
    status: "draft",
    isDeleted: false,
    questions: [
      createQuestion({
        questionId: "q1",
        order: 0,
        type: "multiple_choice",
        content: "What is 1+1?",
        options: [
          { id: "o1", text: "1", isCorrect: false },
          { id: "o2", text: "2", isCorrect: true },
        ],
        correctAnswer: "o2",
        points: 3,
        difficulty: "easy",
      }),
      createQuestion({
        questionId: "q2",
        order: 1,
        type: "short_answer",
        content: "Name a planet.",
        correctAnswer: "Mars",
        points: 2,
        difficulty: "medium",
      }),
    ],
  });
  const original = mockExamSetFindOne(examSet);

  const result = await updateQuestionInExamSetService(examSet._id, ownerId, "q1", { points: 5 });
  restoreExamSetFindOne(original);

  assert(result.questionCount === 2, `Expected questionCount 2, got ${result.questionCount}`);
  assert(result.totalPoints === 7, `Expected totalPoints 7, got ${result.totalPoints}`);
});

addTest("Update question content does not change totalPoints", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const examSet = createExamSet({
    _id: "707f1f77bcf86cd799439014",
    ownerId,
    status: "draft",
    isDeleted: false,
    questions: [
      createQuestion({
        questionId: "q1",
        order: 0,
        type: "short_answer",
        content: "Name a planet.",
        correctAnswer: "Mars",
        points: 2,
        difficulty: "medium",
      }),
    ],
  });
  const original = mockExamSetFindOne(examSet);

  const result = await updateQuestionInExamSetService(examSet._id, ownerId, "q1", {
    content: "Name a star.",
  });
  restoreExamSetFindOne(original);

  assert(result.questionCount === 1, `Expected questionCount 1, got ${result.questionCount}`);
  assert(result.totalPoints === 2, `Expected totalPoints 2, got ${result.totalPoints}`);
});

addTest("Delete question reduces questionCount and totalPoints", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const examSet = createExamSet({
    _id: "707f1f77bcf86cd799439015",
    ownerId,
    status: "draft",
    isDeleted: false,
    questions: [
      createQuestion({
        questionId: "q1",
        order: 0,
        type: "multiple_choice",
        content: "What is 1+1?",
        options: [
          { id: "o1", text: "1", isCorrect: false },
          { id: "o2", text: "2", isCorrect: true },
        ],
        correctAnswer: "o2",
        points: 3,
        difficulty: "easy",
      }),
      createQuestion({
        questionId: "q2",
        order: 1,
        type: "short_answer",
        content: "Name a planet.",
        correctAnswer: "Mars",
        points: 2,
        difficulty: "medium",
      }),
    ],
  });
  const original = mockExamSetFindOne(examSet);

  const result = await deleteQuestionFromExamSetService(examSet._id, ownerId, "Teacher", "q1");
  restoreExamSetFindOne(original);

  assert(result.questionCount === 1, `Expected questionCount 1, got ${result.questionCount}`);
  assert(result.totalPoints === 2, `Expected totalPoints 2, got ${result.totalPoints}`);
});

addTest("Delete last question resets metrics", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const examSet = createExamSet({
    _id: "707f1f77bcf86cd799439016",
    ownerId,
    status: "draft",
    isDeleted: false,
    questions: [
      createQuestion({
        questionId: "q1",
        order: 0,
        type: "short_answer",
        content: "Name a planet.",
        correctAnswer: "Mars",
        points: 2,
        difficulty: "medium",
      }),
    ],
  });
  const original = mockExamSetFindOne(examSet);

  const result = await deleteQuestionFromExamSetService(examSet._id, ownerId, "Teacher", "q1");
  restoreExamSetFindOne(original);

  assert(result.questionCount === 0, `Expected questionCount 0, got ${result.questionCount}`);
  assert(result.totalPoints === 0, `Expected totalPoints 0, got ${result.totalPoints}`);
});

addTest("Reorder questions preserves all questions and totalPoints", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const examSet = createExamSet({
    _id: "707f1f77bcf86cd799439017",
    ownerId,
    status: "draft",
    isDeleted: false,
    questions: [
      createQuestion({
        questionId: "q1",
        order: 0,
        type: "multiple_choice",
        content: "A?",
        options: [
          { id: "o1", text: "Yes", isCorrect: true },
          { id: "o2", text: "No", isCorrect: false },
        ],
        correctAnswer: "o1",
        points: 3,
        difficulty: "easy",
      }),
      createQuestion({
        questionId: "q2",
        order: 1,
        type: "short_answer",
        content: "B?",
        correctAnswer: "Answer",
        points: 2,
        difficulty: "medium",
      }),
      createQuestion({
        questionId: "q3",
        order: 2,
        type: "true_false",
        content: "C?",
        options: [
          { id: "true", text: "True", isCorrect: true },
          { id: "false", text: "False", isCorrect: false },
        ],
        correctAnswer: true,
        points: 1,
        difficulty: "easy",
      }),
    ],
  });
  const original = mockExamSetFindOne(examSet);

  const result = await reorderQuestionsInExamSetService(examSet._id, ownerId, "Teacher", [
    { questionId: "q3", order: 0 },
    { questionId: "q1", order: 2 },
  ]);
  restoreExamSetFindOne(original);

  assert(result.questions.length === 3, `Expected 3 questions, got ${result.questions.length}`);
  assert(result.questions[0].questionId === "q3", "Expected first question q3 after reorder");
  assert(result.questions[1].questionId === "q2", "Expected second question q2 after reorder");
  assert(result.questions[2].questionId === "q1", "Expected third question q1 after reorder");
  assert(result.totalPoints === 6, `Expected totalPoints 6, got ${result.totalPoints}`);
});

addTest("Service invalid examSetId returns 400", async () => {
  try {
    await reorderQuestionsInExamSetService("invalid-id", "user-1", "admin", [
      { questionId: "q1", order: 0 },
    ]);
    throw new Error("Expected error");
  } catch (error) {
    assert(error.status === 400, `Expected 400, got ${error.status}`);
  }
});

addTest("Service unauthorized user returns 403", async () => {
  const ownerId = "507f1f77bcf86cd799439011";
  const examSet = createExamSet({
    _id: "707f1f77bcf86cd799439018",
    ownerId,
    status: "draft",
    isDeleted: false,
    questions: [
      createQuestion({
        questionId: "q1",
        order: 0,
        type: "short_answer",
        content: "Name a planet.",
        correctAnswer: "Mars",
        points: 2,
        difficulty: "medium",
      }),
    ],
  });
  const original = mockExamSetFindOne(examSet);

  try {
    await reorderQuestionsInExamSetService(examSet._id, "student-1", "Student", [
      { questionId: "q1", order: 0 },
    ]);
    throw new Error("Expected 403 error");
  } catch (error) {
    assert(error.status === 403, `Expected 403, got ${error.status}`);
  }
  restoreExamSetFindOne(original);
});

// Admin create/update/delete permission tests to capture current service bug
addTest(
  "Admin create question for another owner - expected behavior should allow admin",
  async () => {
    const ownerId = "507f1f77bcf86cd799439011";
    const adminId = "admin-1";
    const examSet = createExamSet({
      _id: "707f1f77bcf86cd799439019",
      ownerId,
      status: "draft",
      isDeleted: false,
      questions: [],
    });
    const original = mockExamSetFindOne(examSet);

    const questionData = {
      questionId: "q1",
      type: "short_answer",
      content: "Name a planet.",
      correctAnswer: "Mars",
      points: 2,
    };

    try {
      await addQuestionToExamSetService(examSet._id, adminId, questionData);
      restoreExamSetFindOne(original);
    } catch (error) {
      restoreExamSetFindOne(original);
      throw new Error(`Admin create question failed: ${error.message}`);
    }
  }
);

addTest(
  "Admin update question for another owner - expected behavior should allow admin",
  async () => {
    const ownerId = "507f1f77bcf86cd799439011";
    const adminId = "admin-1";
    const examSet = createExamSet({
      _id: "707f1f77bcf86cd799439020",
      ownerId,
      status: "draft",
      isDeleted: false,
      questions: [
        createQuestion({
          questionId: "q1",
          order: 0,
          type: "short_answer",
          content: "Name a planet.",
          correctAnswer: "Mars",
          points: 2,
          difficulty: "medium",
        }),
      ],
    });
    const original = mockExamSetFindOne(examSet);

    try {
      await updateQuestionInExamSetService(examSet._id, adminId, "q1", { content: "Name a star." });
      restoreExamSetFindOne(original);
    } catch (error) {
      restoreExamSetFindOne(original);
      throw new Error(`Admin update question failed: ${error.message}`);
    }
  }
);

addTest(
  "Admin delete question for another owner - expected behavior should allow admin",
  async () => {
    const ownerId = "507f1f77bcf86cd799439011";
    const adminId = "admin-1";
    const examSet = createExamSet({
      _id: "707f1f77bcf86cd799439021",
      ownerId,
      status: "draft",
      isDeleted: false,
      questions: [
        createQuestion({
          questionId: "q1",
          order: 0,
          type: "short_answer",
          content: "Name a planet.",
          correctAnswer: "Mars",
          points: 2,
          difficulty: "medium",
        }),
      ],
    });
    const original = mockExamSetFindOne(examSet);

    try {
      await deleteQuestionFromExamSetService(examSet._id, adminId, "Admin", "q1");
      restoreExamSetFindOne(original);
    } catch (error) {
      restoreExamSetFindOne(original);
      throw new Error(`Admin delete question failed: ${error.message}`);
    }
  }
);

const runAll = async () => {
  console.log(`TOTAL TESTS ${tests.length}`);
  let passed = 0;
  let index = 0;
  for (const test of tests) {
    index += 1;
    console.log(`START TEST ${index}/${tests.length}: ${test.name}`);
    const result = await runTest(test.name, test.fn);
    console.log(
      `FINISH TEST ${index}/${tests.length}: ${test.name} => ${result ? "PASS" : "FAIL"}`
    );
    if (result) {
      passed += 1;
    }
  }

  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
