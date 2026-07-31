// Port từ src/scripts/runExamSetQuestionMetricsFlowTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import ExamSet from "../../src/models/examSet.model.js";
import {
  addQuestionToExamSetService,
  updateQuestionInExamSetService,
  deleteQuestionFromExamSetService,
} from "../../src/services/examSet.service.js";

const createQuestion = (data) => ({
  ...data,
  toObject() {
    const { toObject, ...rest } = this;
    return rest;
  },
});

const createExamSet = (props) => ({
  ...props,
  questions: Array.isArray(props.questions) ? props.questions : [],
  save: async function () {
    return this;
  },
  populate: function () {
    return this;
  },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExamSet question CRUD recalculates metrics", () => {
  it("Add question recalculates metrics", async () => {
    const examSet = createExamSet({ _id: "set-1", ownerId: "user-1", status: "draft", isDeleted: false, questions: [] });
    vi.spyOn(ExamSet, "findOne").mockImplementation(async () => examSet);

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
    expect(result.questionCount).toBe(1);
    expect(result.totalPoints).toBe(3);
  });

  it("Update question preserves metrics when points change", async () => {
    const examSet = createExamSet({
      _id: "set-2",
      ownerId: "user-2",
      status: "draft",
      isDeleted: false,
      questions: [
        createQuestion({ questionId: "q-2", order: 0, type: "short_answer", content: "Name a planet.", points: 2, correctAnswer: "Mars", isActive: true }),
      ],
    });
    vi.spyOn(ExamSet, "findOne").mockImplementation(async () => examSet);

    const result = await updateQuestionInExamSetService("set-2", "user-2", "q-2", { points: 5 });
    expect(result.questionCount).toBe(1);
    expect(result.totalPoints).toBe(5);
  });

  it("Delete question updates metrics", async () => {
    const examSet = createExamSet({
      _id: "set-3",
      ownerId: "user-3",
      status: "draft",
      isDeleted: false,
      questions: [
        createQuestion({ questionId: "q-3a", order: 0, type: "essay", content: "Explain MVC.", points: 4, score: 4, isActive: true }),
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
    vi.spyOn(ExamSet, "findOne").mockImplementation(async () => examSet);

    const result = await deleteQuestionFromExamSetService("507f1f77bcf86cd799439011", "user-3", "teacher", "q-3a");
    expect(result.questionCount).toBe(1);
    expect(result.totalPoints).toBe(3);
  });
});
