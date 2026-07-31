// Ported từ src/scripts/runMultipleChoiceValidatorTests.js (characterization test — giữ nguyên
// các case và message đã có, chỉ đổi test runner sang Vitest).
import { describe, it, expect } from "vitest";
import { validationResult } from "express-validator";
import { multipleChoiceQuestionValidation } from "../../src/modules/question/question.validator.js";
import {
  createRequest,
  createResponse,
  runMiddleware,
  extractErrorMessages,
} from "../helpers/expressMock.js";

const cases = [
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

describe("multipleChoiceQuestionValidation", () => {
  it.each(cases)("$name", async ({ payload, expectedSuccess, expectedMessageFragment }) => {
    const req = createRequest(payload);
    const res = createResponse();

    const passed = await runMiddleware(multipleChoiceQuestionValidation, req, res);

    if (expectedSuccess) {
      expect(passed).toBe(true);
      expect(validationResult(req).isEmpty()).toBe(true);
      return;
    }

    expect(res.statusCode).toBe(400);
    expect(extractErrorMessages(res)).toContain(expectedMessageFragment);
  });
});
