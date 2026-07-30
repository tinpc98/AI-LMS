// Ported từ src/scripts/runEssayQuestionValidationTests.js (characterization test — giữ nguyên
// các case và message đã có, chỉ đổi test runner sang Vitest).
import { describe, it, expect } from "vitest";
import { examSetQuestionCreateValidation, examSetQuestionUpdateValidation } from "../../src/utils/validators.js";
import { isEditableExamSetStatus } from "../../src/services/examSet.services.js";
import { createRequest, createResponse, runMiddleware, extractErrorMessages } from "../helpers/expressMock.js";

const cases = [
  {
    name: "Create ESSAY valid required fields",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-1", type: "essay", content: "Phân tích ưu điểm và nhược điểm của mô hình MVC.", score: 5, difficulty: "medium" },
    expectedSuccess: true,
  },
  {
    name: "Create ESSAY valid with suggestedAnswer",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-2", type: "essay", content: "Hãy trình bày tính năng chính của REST API.", score: 4, difficulty: "easy", suggestedAnswer: "REST API là..." },
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
    payload: { questionId: "essay-4", type: "essay", score: 5, difficulty: "medium" },
    expectedSuccess: false,
    expectedMessageFragment: "Content là bắt buộc",
  },
  {
    name: "Create ESSAY content only whitespace",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-5", type: "essay", content: "    ", score: 5, difficulty: "medium" },
    expectedSuccess: false,
    expectedMessageFragment: "Content là bắt buộc",
  },
  {
    name: "Create ESSAY content too long",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-6", type: "essay", content: "a".repeat(5001), score: 5, difficulty: "medium" },
    expectedSuccess: false,
    expectedMessageFragment: "Content phải có độ dài từ 5 đến 5000 ký tự",
  },
  {
    name: "Create ESSAY negative score",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-7", type: "essay", content: "Phân tích MVC.", score: -1, difficulty: "medium" },
    expectedSuccess: false,
    expectedMessageFragment: "Score phải là số hợp lệ và không được âm",
  },
  {
    name: "Create ESSAY score string invalid",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-8", type: "essay", content: "Phân tích MVC.", score: "5", difficulty: "medium" },
    expectedSuccess: false,
    expectedMessageFragment: "Score phải là số hợp lệ và không được âm",
  },
  {
    name: "Create ESSAY invalid difficulty",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-9", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "expert" },
    expectedSuccess: false,
    expectedMessageFragment: "Difficulty phải thuộc enum easy, medium, hard",
  },
  {
    name: "Create ESSAY invalid suggestedAnswer type",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-10", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", suggestedAnswer: 123 },
    expectedSuccess: false,
    expectedMessageFragment: "suggestedAnswer phải là một chuỗi",
  },
  {
    name: "Create ESSAY rubric not array",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-11", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", rubric: { criterion: "A", maxScore: 5 } },
    expectedSuccess: false,
    expectedMessageFragment: "Rubric phải là một mảng",
  },
  {
    name: "Create ESSAY rubric empty array",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-12", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", rubric: [] },
    expectedSuccess: false,
    expectedMessageFragment: "Rubric phải là mảng có tối thiểu 1 và tối đa 20 tiêu chí",
  },
  {
    name: "Create ESSAY rubric missing criterion",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-13", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", rubric: [{ maxScore: 2 }] },
    expectedSuccess: false,
    expectedMessageFragment: "rubric[0].criterion là bắt buộc",
  },
  {
    name: "Create ESSAY rubric empty criterion",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-14", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", rubric: [{ criterion: "   ", maxScore: 2 }] },
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
    payload: { questionId: "essay-16", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", rubric: [{ criterion: "Nêu khái niệm" }] },
    expectedSuccess: false,
    expectedMessageFragment: "rubric[0].maxScore là bắt buộc và phải là số",
  },
  {
    name: "Create ESSAY rubric maxScore zero",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-17", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", rubric: [{ criterion: "Nêu khái niệm", maxScore: 0 }] },
    expectedSuccess: false,
    expectedMessageFragment: "rubric[0].maxScore phải lớn hơn 0",
  },
  {
    name: "Create ESSAY rubric maxScore negative",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-18", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", rubric: [{ criterion: "Nêu khái niệm", maxScore: -1 }] },
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
    payload: { questionId: "essay-20", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", options: [{ id: "o1", text: "A" }] },
    expectedSuccess: false,
    expectedMessageFragment: "ESSAY không sử dụng options",
  },
  {
    name: "Create ESSAY with correctAnswer forbidden",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-21", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", correctAnswer: "o1" },
    expectedSuccess: false,
    expectedMessageFragment: "ESSAY không sử dụng correctAnswer",
  },
  {
    name: "Create ESSAY with questionCount blocked",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-22", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", questionCount: 10 },
    expectedSuccess: false,
    expectedMessageFragment: "questionCount không được phép gửi từ client",
  },
  {
    name: "Create ESSAY with totalPoints blocked",
    middleware: examSetQuestionCreateValidation,
    payload: { questionId: "essay-23", type: "essay", content: "Phân tích MVC.", score: 5, difficulty: "medium", totalPoints: 20 },
    expectedSuccess: false,
    expectedMessageFragment: "totalPoints không được phép gửi từ client",
  },
  {
    name: "Update ESSAY with questionCount blocked",
    middleware: examSetQuestionUpdateValidation,
    payload: { type: "essay", questionCount: 5 },
    expectedSuccess: false,
    expectedMessageFragment: "questionCount không được phép gửi từ client",
  },
  {
    name: "Update ESSAY with totalPoints blocked",
    middleware: examSetQuestionUpdateValidation,
    payload: { type: "essay", totalPoints: 10 },
    expectedSuccess: false,
    expectedMessageFragment: "totalPoints không được phép gửi từ client",
  },
  {
    name: "Update ESSAY valid partial suggestedAnswer",
    middleware: examSetQuestionUpdateValidation,
    payload: { type: "essay", suggestedAnswer: "Đáp án mẫu mới" },
    expectedSuccess: true,
  },
  {
    name: "Update ESSAY invalid rubric with rest valid",
    middleware: examSetQuestionUpdateValidation,
    payload: { type: "essay", suggestedAnswer: "Đáp án mẫu", rubric: [{ criterion: "Tiêu chí", maxScore: 6 }], score: 5 },
    expectedSuccess: false,
    expectedMessageFragment: "Tổng rubric không được lớn hơn score của câu hỏi",
  },
];

describe("examSetQuestionCreate/UpdateValidation", () => {
  it.each(cases)("$name", async ({ middleware, payload, expectedSuccess, expectedMessageFragment }) => {
    const req = createRequest(payload);
    const res = createResponse();

    const passed = await runMiddleware(middleware, req, res);

    if (expectedSuccess) {
      expect(passed).toBe(true);
      return;
    }

    expect(res.statusCode).toBe(400);
    if (expectedMessageFragment) {
      expect(extractErrorMessages(res)).toContain(expectedMessageFragment);
    }
  });
});

describe("isEditableExamSetStatus", () => {
  it("draft status is editable", () => {
    expect(isEditableExamSetStatus("draft")).toBe(true);
  });

  it("published status is not editable", () => {
    expect(isEditableExamSetStatus("published")).toBe(false);
  });
});
