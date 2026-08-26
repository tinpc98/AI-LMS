// Test cho lessonProgress.service.js — TÍNH NĂNG MỚI (mục 1.5): ghi tiến độ THẬT theo block,
// BR-1.4 (video union), BR-1.6 (quiz làm lại vô hạn, điểm cao nhất), BR-1.7 (không thu hồi
// completed đã true).
import { describe, it, expect, vi, beforeEach } from "vitest";

const lessonFindById = vi.fn();
const lessonFind = vi.fn();
const topicFindById = vi.fn();
const topicFind = vi.fn();
const progressCountDocuments = vi.fn();
const enrollmentFindOne = vi.fn();
const progressFindOne = vi.fn();
const progressFind = vi.fn();
const progressSave = vi.fn().mockResolvedValue(true);
const quizFindById = vi.fn();
const questionFind = vi.fn();
const attemptCount = vi.fn();
const attemptCreate = vi.fn();

vi.mock("#modules/lesson/lesson.model.js", () => ({
  default: { findById: (...a) => lessonFindById(...a), find: (...a) => lessonFind(...a) },
}));
vi.mock("#modules/topic", () => ({
  Topic: { findById: (...a) => topicFindById(...a), find: (...a) => topicFind(...a) },
}));
vi.mock("#modules/enrollment", () => ({
  Enrollment: { findOne: (...a) => enrollmentFindOne(...a) },
}));
vi.mock("#modules/question", () => ({ Question: { find: (...a) => questionFind(...a) } }));
vi.mock("#modules/lesson/practiceQuiz.model.js", () => ({
  default: { findById: (...a) => quizFindById(...a) },
}));
vi.mock("#modules/lesson/practiceQuizAttempt.model.js", () => ({
  default: { countDocuments: (...a) => attemptCount(...a), create: (...a) => attemptCreate(...a) },
}));
const awardXpService = vi.fn();
const resolveActiveClassIdForStudent = vi.fn();
vi.mock("#modules/badge/xp.service.js", () => ({
  awardXpService: (...a) => awardXpService(...a),
  resolveActiveClassIdForStudent: (...a) => resolveActiveClassIdForStudent(...a),
}));
const checkAndAwardGettingStartedBadge = vi.fn();
const checkAndAwardConquerorBadge = vi.fn();
const checkAndAwardPerfectScoreBadge = vi.fn();
vi.mock("#modules/badge/badgeAward.service.js", () => ({
  checkAndAwardGettingStartedBadge: (...a) => checkAndAwardGettingStartedBadge(...a),
  checkAndAwardConquerorBadge: (...a) => checkAndAwardConquerorBadge(...a),
  checkAndAwardPerfectScoreBadge: (...a) => checkAndAwardPerfectScoreBadge(...a),
}));

vi.mock("#modules/lesson/lessonProgress.model.js", () => {
  class LessonProgressMock {
    constructor(data) {
      Object.assign(this, data);
      this.blocks = [];
      this.completed = false;
      this.progress = 0;
    }
    save = progressSave;
  }
  LessonProgressMock.findOne = (...a) => progressFindOne(...a);
  LessonProgressMock.find = (...a) => progressFind(...a);
  LessonProgressMock.countDocuments = (...a) => progressCountDocuments(...a);
  return { default: LessonProgressMock };
});

const {
  recordVideoProgressService,
  recordDocumentCloseService,
  submitPracticeQuizAttemptService,
  getProgressForLessonsService,
} = await import("#modules/lesson/lessonProgress.service.js");

const LESSON_ID = "lesson-1";
const TOPIC_ID = "topic-1";
const COURSE_ID = "course-1";
const STUDENT_ID = "student-1";
const VIDEO_BLOCK_ID = "block-video";
const DOC_BLOCK_ID = "block-doc";
const QUIZ_BLOCK_ID = "block-quiz";

const buildBlocks = () => {
  const blocks = [
    { _id: VIDEO_BLOCK_ID, type: "VIDEO", isRequired: true, video: { durationSeconds: 100 } },
    { _id: DOC_BLOCK_ID, type: "DOCUMENT", isRequired: true, document: { publicId: "doc-1" } },
    { _id: QUIZ_BLOCK_ID, type: "PRACTICE_QUIZ", isRequired: true, quizId: "quiz-1" },
  ];
  blocks.id = (id) => blocks.find((b) => String(b._id) === String(id)) || null;
  return blocks;
};

beforeEach(() => {
  vi.clearAllMocks();
  lessonFindById.mockResolvedValue({ _id: LESSON_ID, topicId: TOPIC_ID, blocks: buildBlocks() });
  topicFindById.mockReturnValue({
    lean: () => Promise.resolve({ _id: TOPIC_ID, courseId: COURSE_ID }),
  });
  enrollmentFindOne.mockResolvedValue({ _id: "enr-1", status: "APPROVED" });
  progressFindOne.mockResolvedValue(null);
  resolveActiveClassIdForStudent.mockResolvedValue("class-1");
  awardXpService.mockResolvedValue({ _id: "xp-1" });
  // Mặc định: Course không có Topic nào -> checkCourseCompletionAndAward dừng sớm, các test
  // không liên quan tới "Chinh phục"/Course Completed không cần mock sâu Lesson.find/countDocuments.
  topicFind.mockReturnValue({ select: () => ({ lean: () => Promise.resolve([]) }) });
});

describe("recordVideoProgressService", () => {
  it("Khoảng thời gian không hợp lệ (end <= start) → BusinessRuleError", async () => {
    await expect(
      recordVideoProgressService(LESSON_ID, VIDEO_BLOCK_ID, STUDENT_ID, { start: 10, end: 10 })
    ).rejects.toThrow(/không hợp lệ/);
  });

  it("Xem chưa đủ 80% → block chưa completed, Lesson progress < 100", async () => {
    const progress = await recordVideoProgressService(LESSON_ID, VIDEO_BLOCK_ID, STUDENT_ID, {
      start: 0,
      end: 50,
    });
    const bp = progress.blocks.find((b) => b.blockId === VIDEO_BLOCK_ID);
    expect(bp.completed).toBe(false);
    expect(progress.completed).toBe(false);
  });

  it("BR-1.4: xem đủ 80% (qua nhiều đoạn union, không trùng) → block completed", async () => {
    const progress = await recordVideoProgressService(LESSON_ID, VIDEO_BLOCK_ID, STUDENT_ID, {
      start: 0,
      end: 80,
    });
    const bp = progress.blocks.find((b) => b.blockId === VIDEO_BLOCK_ID);
    expect(bp.watchedSeconds).toBe(80);
    expect(bp.completed).toBe(true);
    expect(bp.completedAt).toBeTruthy();
  });

  it("Tua đi tua lại (đoạn chồng lấn) không cộng dồn gấp đôi để đạt ngưỡng giả", async () => {
    progressFindOne.mockResolvedValue({
      studentId: STUDENT_ID,
      lessonId: LESSON_ID,
      completed: false,
      blocks: [
        {
          blockId: VIDEO_BLOCK_ID,
          type: "VIDEO",
          completed: false,
          watchedRanges: [{ start: 0, end: 60 }],
        },
      ],
      save: progressSave,
    });
    // Đoạn mới [30,90] chồng 30s với đoạn cũ [0,60] -> union thật = 90, KHÔNG phải 60+60=120.
    const progress = await recordVideoProgressService(LESSON_ID, VIDEO_BLOCK_ID, STUDENT_ID, {
      start: 30,
      end: 90,
    });
    const bp = progress.blocks.find((b) => b.blockId === VIDEO_BLOCK_ID);
    expect(bp.watchedSeconds).toBe(90); // 90/100 = 90% >= 80% → đúng là completed, nhưng qua giá trị union thật
    expect(bp.completed).toBe(true);
  });

  it("BR-1.7: Lesson đã completed=true trước đó → không tính lại, giữ nguyên", async () => {
    progressFindOne.mockResolvedValue({
      studentId: STUDENT_ID,
      lessonId: LESSON_ID,
      completed: true,
      progress: 100,
      blocks: [],
      save: progressSave,
    });
    const progress = await recordVideoProgressService(LESSON_ID, VIDEO_BLOCK_ID, STUDENT_ID, {
      start: 0,
      end: 5,
    });
    expect(progress.completed).toBe(true);
    expect(progress.progress).toBe(100);
  });
});

describe("recordDocumentCloseService", () => {
  it("openedSeconds âm → BusinessRuleError", async () => {
    await expect(
      recordDocumentCloseService(LESSON_ID, DOC_BLOCK_ID, STUDENT_ID, { openedSeconds: -1 })
    ).rejects.toThrow(/không hợp lệ/);
  });

  it("Cộng dồn totalOpenSeconds qua nhiều lần đóng/mở, đạt 30s → completed", async () => {
    progressFindOne.mockResolvedValue({
      studentId: STUDENT_ID,
      lessonId: LESSON_ID,
      completed: false,
      blocks: [{ blockId: DOC_BLOCK_ID, type: "DOCUMENT", completed: false, totalOpenSeconds: 20 }],
      save: progressSave,
    });
    const progress = await recordDocumentCloseService(LESSON_ID, DOC_BLOCK_ID, STUDENT_ID, {
      openedSeconds: 15,
    });
    const bp = progress.blocks.find((b) => b.blockId === DOC_BLOCK_ID);
    expect(bp.totalOpenSeconds).toBe(35);
    expect(bp.completed).toBe(true);
  });
});

describe("submitPracticeQuizAttemptService", () => {
  const QUESTION_A = {
    _id: "qa",
    options: [
      { id: "a1", isCorrect: true },
      { id: "a2", isCorrect: false },
    ],
  };
  const QUESTION_B = {
    _id: "qb",
    options: [
      { id: "b1", isCorrect: false },
      { id: "b2", isCorrect: true },
    ],
  };

  beforeEach(() => {
    quizFindById.mockReturnValue({
      lean: () =>
        Promise.resolve({
          _id: "quiz-1",
          questions: [{ questionId: "qa" }, { questionId: "qb" }],
        }),
    });
    questionFind.mockReturnValue({ lean: () => Promise.resolve([QUESTION_A, QUESTION_B]) });
    attemptCount.mockResolvedValue(0);
    attemptCreate.mockImplementation((data) => Promise.resolve({ _id: "attempt-1", ...data }));
  });

  it("Chấm đúng — khớp chính xác tập đáp án đúng, trả điểm % + đáp án đúng để hiện ngay", async () => {
    const result = await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [
        { questionId: "qa", selectedOptionIds: ["a1"] },
        { questionId: "qb", selectedOptionIds: ["b1"] }, // sai
      ],
    });

    expect(result.scorePercent).toBe(50);
    expect(result.gradedAnswers[0].isCorrect).toBe(true);
    expect(result.gradedAnswers[0].correctOptionIds).toEqual(["a1"]);
    expect(result.gradedAnswers[1].isCorrect).toBe(false);
  });

  it("BR-1.6: attemptNumber tăng dần, không upsert đè lên attempt cũ", async () => {
    attemptCount.mockResolvedValue(2);
    await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [{ questionId: "qa", selectedOptionIds: ["a1"] }],
    });
    expect(attemptCreate).toHaveBeenCalledWith(expect.objectContaining({ attemptNumber: 3 }));
  });

  it("BR-1.6: điểm ghi nhận ở LessonProgress là điểm CAO NHẤT giữa các lần làm", async () => {
    progressFindOne.mockResolvedValue({
      studentId: STUDENT_ID,
      lessonId: LESSON_ID,
      completed: false,
      blocks: [
        { blockId: QUIZ_BLOCK_ID, type: "PRACTICE_QUIZ", completed: false, bestScorePercent: 80 },
      ],
      save: progressSave,
    });
    // Lần này chỉ đúng 1/2 = 50%, THẤP hơn điểm cũ 80% → best score phải giữ 80, không bị ghi đè xuống.
    const result = await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [{ questionId: "qa", selectedOptionIds: ["a1"] }],
    });
    expect(result.bestScorePercent).toBe(80);
  });

  it("Đạt ngưỡng 70% → block quiz completed, Lesson progress tính lại", async () => {
    const result = await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [
        { questionId: "qa", selectedOptionIds: ["a1"] },
        { questionId: "qb", selectedOptionIds: ["b2"] },
      ],
    });
    expect(result.scorePercent).toBe(100);
    expect(result.bestScorePercent).toBe(100);
  });

  it("Không chọn đáp án nào cho 1 câu → tính sai câu đó, không throw", async () => {
    const result = await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [{ questionId: "qa", selectedOptionIds: ["a1"] }],
    });
    expect(result.gradedAnswers[1].isCorrect).toBe(false);
    expect(result.gradedAnswers[1].selectedOptionIds).toEqual([]);
  });
});

describe("TÍNH NĂNG MỚI (mục 5) — cộng XP khi có kết quả đã xác minh", () => {
  it("Lần đầu đạt 70% → cộng 10 XP 'Practice Quiz Passed', sourceRef theo blockId", async () => {
    await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [
        { questionId: "qa", selectedOptionIds: ["a1"] },
        { questionId: "qb", selectedOptionIds: ["b2"] },
      ],
    });

    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: STUDENT_ID,
        classId: "class-1",
        activityType: "Practice Quiz Passed",
        sourceRef: `quiz-pass:${QUIZ_BLOCK_ID}`,
        xpAmount: 10,
      })
    );
  });

  it("Đạt 100% ngay lần đầu → cộng CẢ 10 XP đạt ngưỡng LẪN 5 XP thưởng điểm tuyệt đối", async () => {
    await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [
        { questionId: "qa", selectedOptionIds: ["a1"] },
        { questionId: "qb", selectedOptionIds: ["b2"] },
      ],
    });

    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: `quiz-pass:${QUIZ_BLOCK_ID}`, xpAmount: 10 })
    );
    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: `quiz-perfect:${QUIZ_BLOCK_ID}`, xpAmount: 5 })
    );
    expect(checkAndAwardPerfectScoreBadge).toHaveBeenCalledWith(STUDENT_ID);
  });

  it("Đã từng đạt 70%+ trước đó → làm lại không cộng XP 'Practice Quiz Passed' lần 2", async () => {
    progressFindOne.mockResolvedValue({
      studentId: STUDENT_ID,
      lessonId: LESSON_ID,
      completed: false,
      blocks: [
        { blockId: QUIZ_BLOCK_ID, type: "PRACTICE_QUIZ", completed: true, bestScorePercent: 100 },
      ],
      save: progressSave,
    });

    // Lần này chỉ đúng 1/2 = 50%, thấp hơn best cũ — không đạt ngưỡng mới, không thưởng mới.
    await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [{ questionId: "qa", selectedOptionIds: ["a1"] }],
    });

    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: `quiz-pass:${QUIZ_BLOCK_ID}` })
    );
    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ sourceRef: `quiz-perfect:${QUIZ_BLOCK_ID}` })
    );
  });

  it("Không tìm được lớp ACTIVE của học sinh → bỏ qua cộng XP, không throw", async () => {
    resolveActiveClassIdForStudent.mockResolvedValue(null);

    await expect(
      submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
        answers: [
          { questionId: "qa", selectedOptionIds: ["a1"] },
          { questionId: "qb", selectedOptionIds: ["b2"] },
        ],
      })
    ).resolves.toBeTruthy();
    expect(awardXpService).not.toHaveBeenCalled();
  });

  it("Hoàn thành trọn Lesson (mọi block bắt buộc xong) → cộng 20 XP 'Lesson Completed' đúng 1 lần", async () => {
    progressFindOne.mockResolvedValue({
      studentId: STUDENT_ID,
      lessonId: LESSON_ID,
      completed: false,
      blocks: [
        {
          blockId: VIDEO_BLOCK_ID,
          type: "VIDEO",
          completed: true,
          watchedRanges: [],
          watchedSeconds: 100,
        },
        { blockId: DOC_BLOCK_ID, type: "DOCUMENT", completed: true, totalOpenSeconds: 30 },
      ],
      save: progressSave,
    });

    await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [
        { questionId: "qa", selectedOptionIds: ["a1"] },
        { questionId: "qb", selectedOptionIds: ["b2"] },
      ],
    });

    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({
        activityType: "Lesson Completed",
        sourceRef: `lesson:${LESSON_ID}`,
        xpAmount: 20,
      })
    );
    expect(checkAndAwardGettingStartedBadge).toHaveBeenCalledWith(STUDENT_ID);
  });

  it("Lesson đã completed=true từ trước → không cộng lại 20 XP 'Lesson Completed'", async () => {
    progressFindOne.mockResolvedValue({
      studentId: STUDENT_ID,
      lessonId: LESSON_ID,
      completed: true,
      progress: 100,
      blocks: [],
      save: progressSave,
    });

    await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [{ questionId: "qa", selectedOptionIds: ["a1"] }],
    });

    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "Lesson Completed" })
    );
  });
});

describe("TÍNH NĂNG MỚI (mục 4) — 'Chinh phục' + 200 XP 'Course Completed' khi xong trọn khóa học", () => {
  const mongooseLeanArray = (result) => ({
    select: () => ({ lean: () => Promise.resolve(result) }),
  });

  const completeLessonScenario = () => {
    progressFindOne.mockResolvedValue({
      studentId: STUDENT_ID,
      lessonId: LESSON_ID,
      completed: false,
      blocks: [
        {
          blockId: VIDEO_BLOCK_ID,
          type: "VIDEO",
          completed: true,
          watchedRanges: [],
          watchedSeconds: 100,
        },
        { blockId: DOC_BLOCK_ID, type: "DOCUMENT", completed: true, totalOpenSeconds: 30 },
      ],
      save: progressSave,
    });
  };

  it("Mọi Lesson PUBLISHED trong Course đều completed → cộng 200 XP + trao badge Chinh phục", async () => {
    completeLessonScenario();
    topicFind.mockReturnValue(mongooseLeanArray([{ _id: TOPIC_ID }]));
    lessonFind.mockReturnValue(mongooseLeanArray([{ _id: LESSON_ID }, { _id: "lesson-2" }]));
    progressCountDocuments.mockResolvedValue(2); // Cả 2 lesson đều completed=true cho học sinh này.

    await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [
        { questionId: "qa", selectedOptionIds: ["a1"] },
        { questionId: "qb", selectedOptionIds: ["b2"] },
      ],
    });

    expect(awardXpService).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: STUDENT_ID,
        classId: "class-1",
        activityType: "Course Completed",
        sourceRef: "course:course-1",
        xpAmount: 200,
      })
    );
    expect(checkAndAwardConquerorBadge).toHaveBeenCalledWith(STUDENT_ID);
  });

  it("Còn Lesson khác trong Course chưa completed → KHÔNG cộng Course Completed", async () => {
    completeLessonScenario();
    topicFind.mockReturnValue(mongooseLeanArray([{ _id: TOPIC_ID }]));
    lessonFind.mockReturnValue(mongooseLeanArray([{ _id: LESSON_ID }, { _id: "lesson-2" }]));
    progressCountDocuments.mockResolvedValue(1); // Chỉ 1/2 lesson completed.

    await submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
      answers: [
        { questionId: "qa", selectedOptionIds: ["a1"] },
        { questionId: "qb", selectedOptionIds: ["b2"] },
      ],
    });

    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "Course Completed" })
    );
    expect(checkAndAwardConquerorBadge).not.toHaveBeenCalled();
  });

  it("Course không có Lesson PUBLISHED nào → không throw, không cộng", async () => {
    completeLessonScenario();
    topicFind.mockReturnValue(mongooseLeanArray([{ _id: TOPIC_ID }]));
    lessonFind.mockReturnValue(mongooseLeanArray([]));

    await expect(
      submitPracticeQuizAttemptService(LESSON_ID, QUIZ_BLOCK_ID, STUDENT_ID, {
        answers: [
          { questionId: "qa", selectedOptionIds: ["a1"] },
          { questionId: "qb", selectedOptionIds: ["b2"] },
        ],
      })
    ).resolves.toBeTruthy();
    expect(awardXpService).not.toHaveBeenCalledWith(
      expect.objectContaining({ activityType: "Course Completed" })
    );
  });
});

describe("getProgressForLessonsService", () => {
  it("Danh sách lessonIds rỗng → trả mảng rỗng, không query DB", async () => {
    const result = await getProgressForLessonsService([], STUDENT_ID);
    expect(result).toEqual([]);
    expect(progressFind).not.toHaveBeenCalled();
  });

  it("Có lessonIds → query đúng studentId + $in lessonIds", async () => {
    const docs = [{ lessonId: "l1", completed: true }];
    progressFind.mockReturnValue({ lean: () => Promise.resolve(docs) });

    const result = await getProgressForLessonsService(["l1", "l2"], STUDENT_ID);

    expect(progressFind).toHaveBeenCalledWith({
      studentId: STUDENT_ID,
      lessonId: { $in: ["l1", "l2"] },
    });
    expect(result).toEqual(docs);
  });
});
