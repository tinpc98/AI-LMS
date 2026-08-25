import { expect } from "chai";
import mongoose from "mongoose";
import StudentSkillPerformance from "../../../../src/modules/performance/studentSkillPerformance.model.js";
import StudentWeakness from "../../../../src/modules/performance/studentWeakness.model.js";
import { processAttemptPerformanceService } from "../../../../src/modules/performance/performance.service.js";

describe("Domain 03.5 - Performance Engine", () => {
  let studentId;
  let topicId;
  let primarySkillId;
  let mockAttempt;

  before(async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/ai-lms";
    await mongoose.connect(mongoUri);

    studentId = new mongoose.Types.ObjectId();
    topicId = new mongoose.Types.ObjectId();
    primarySkillId = new mongoose.Types.ObjectId();
  });

  after(async () => {
    await StudentSkillPerformance.deleteMany({});
    await StudentWeakness.deleteMany({});
  });

  it("should aggregate correct answers and detect weakness when evidence > 5", async () => {
    mockAttempt = {
      studentId,
      questions: [
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: false, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: false, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: false, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: false, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: false, questionSnapshot: { meta: { topicId, primarySkillId } } }
      ]
    };

    // 1 correct out of 6 -> 16.67% accuracy. Evidence count: 6
    await processAttemptPerformanceService(mockAttempt, "ASSIGNMENT");

    const perf = await StudentSkillPerformance.findOne({ studentId, skillId: primarySkillId });
    expect(perf).to.exist;
    expect(perf.totalQuestions).to.equal(6);
    expect(perf.correctAnswers).to.equal(1);
    expect(perf.accuracy).to.be.closeTo(16.67, 0.01);

    const weakness = await StudentWeakness.findOne({ studentId, skillId: primarySkillId });
    expect(weakness).to.exist;
    expect(weakness.status).to.equal("ACTIVE");
    expect(weakness.severity).to.equal("HIGH");
  });

  it("should aggregate attempts without duplicating or overwriting (Idempotent aggregate test)", async () => {
    const attempt2 = {
      studentId,
      questions: [
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } }
      ]
    };
    
    // 4 correct out of 4. Total should become 10 questions, 5 correct -> 50% accuracy -> MEDIUM severity
    await processAttemptPerformanceService(attempt2, "ASSIGNMENT");

    const perf = await StudentSkillPerformance.findOne({ studentId, skillId: primarySkillId });
    expect(perf.totalQuestions).to.equal(10);
    expect(perf.correctAnswers).to.equal(5);
    expect(perf.accuracy).to.equal(50);

    const weakness = await StudentWeakness.findOne({ studentId, skillId: primarySkillId });
    expect(weakness.severity).to.equal("MEDIUM");
    expect(weakness.evidenceCount).to.equal(10);
  });

  it("should mark weakness as IMPROVED if accuracy goes above 70", async () => {
    const attempt3 = {
      studentId,
      questions: [
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } },
        { isCorrect: true, questionSnapshot: { meta: { topicId, primarySkillId } } }
      ]
    };

    // 7 correct out of 7. Total: 17 questions, 12 correct -> 12/17 * 100 = 70.58% accuracy.
    await processAttemptPerformanceService(attempt3, "ASSIGNMENT");

    const weakness = await StudentWeakness.findOne({ studentId, skillId: primarySkillId });
    expect(weakness.status).to.equal("IMPROVED");
  });
});
