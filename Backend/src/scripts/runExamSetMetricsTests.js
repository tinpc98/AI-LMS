import { validationResult } from "express-validator";
import ExamSet from "../models/examSet.model.js";
import { recalculateExamSetMetrics } from "../services/examSet.metrics.js";

const createResponse = () => {
  const res = { statusCode: null, body: null, status(code) { this.statusCode = code; return this; }, json(payload) { this.body = payload; return this; } };
  return res;
};

const runTest = async (name, examSet, expectedCount, expectedPoints) => {
  const clone = JSON.parse(JSON.stringify(examSet));
  const result = recalculateExamSetMetrics(clone);
  const pass = result.questionCount === expectedCount && result.totalPoints === expectedPoints;
  if (pass) {
    console.log(`PASS: ${name}`);
  } else {
    console.error(`FAIL: ${name} -> expected count=${expectedCount}, points=${expectedPoints} but got count=${result.questionCount}, points=${result.totalPoints}`);
  }
  return pass;
};

const tests = [
  {
    name: "Empty questions array",
    examSet: { questions: [] },
    expectedCount: 0,
    expectedPoints: 0,
  },
  {
    name: "Single valid question score 3",
    examSet: { questions: [{ points: 3 }] },
    expectedCount: 1,
    expectedPoints: 3,
  },
  {
    name: "Multiple valid questions with decimals",
    examSet: { questions: [{ points: 2.5 }, { points: 1.5 }, { points: 0 }] },
    expectedCount: 3,
    expectedPoints: 4,
  },
  {
    name: "Question with invalid score string treated as 0",
    examSet: { questions: [{ points: "5" }, { points: 2 }] },
    expectedCount: 2,
    expectedPoints: 2,
  },
  {
    name: "Question with NaN score treated as 0",
    examSet: { questions: [{ points: NaN }, { points: 2 }] },
    expectedCount: 2,
    expectedPoints: 2,
  },
  {
    name: "Negative score treated as 0",
    examSet: { questions: [{ points: -1 }, { points: 3 }] },
    expectedCount: 2,
    expectedPoints: 3,
  },
  {
    name: "Soft deleted question excluded",
    examSet: { questions: [{ points: 3 }, { points: 2, isDeleted: true }, { points: 4, deletedAt: new Date() }] },
    expectedCount: 1,
    expectedPoints: 3,
  },
];

const runAll = async () => {
  let passed = 0;
  for (const test of tests) {
    if (await runTest(test.name, test.examSet, test.expectedCount, test.expectedPoints)) {
      passed += 1;
    }
  }
  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
