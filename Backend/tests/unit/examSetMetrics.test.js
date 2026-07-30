// Port từ src/scripts/runExamSetMetricsTests.js (characterization test).
import { describe, it, expect } from "vitest";
import { recalculateExamSetMetrics } from "../../src/services/examSet.metrics.js";

const cases = [
  { name: "Empty questions array", examSet: { questions: [] }, expectedCount: 0, expectedPoints: 0 },
  { name: "Single valid question score 3", examSet: { questions: [{ points: 3 }] }, expectedCount: 1, expectedPoints: 3 },
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

describe("recalculateExamSetMetrics", () => {
  it.each(cases)("$name", ({ examSet, expectedCount, expectedPoints }) => {
    const clone = JSON.parse(JSON.stringify(examSet));
    const result = recalculateExamSetMetrics(clone);
    expect(result.questionCount).toBe(expectedCount);
    expect(result.totalPoints).toBe(expectedPoints);
  });
});
