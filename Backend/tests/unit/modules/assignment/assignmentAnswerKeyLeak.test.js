// Test cho assignment.controller.js#getAssignmentById — chốt lỗ hổng bảo mật thật đã tìm và
// sửa trong đợt review toàn dự án: trước đây response trả nguyên options[].isCorrect (đáp án
// đúng) cho học sinh, chỉ cần gọi thẳng GET /assignments/:id là lấy được đáp án trước khi làm
// bài. File test gốc (assignmentController.test.js) đang ở trạng thái lỗi có sẵn từ trước
// (baseline đã biết, không liên quan sửa lần này) nên viết file riêng, tối giản, để chốt đúng
// hành vi của bug này thay vì đụng vào file cũ.
import { describe, it, expect, vi, beforeEach } from "vitest";

const findAssignmentById = vi.fn();
const findTopicById = vi.fn();
const classFind = vi.fn();
const classEnrollmentExists = vi.fn();
const checkTopicOwnership = vi.fn();

vi.mock("#modules/assignment/assignment.repository.js", () => ({
  findAssignmentById: (...a) => findAssignmentById(...a),
}));
vi.mock("#modules/assignment/assignment.service.js", () => ({}));
vi.mock("#modules/topic/topic.model.js", () => ({
  default: { findById: (...a) => findTopicById(...a) },
}));
vi.mock("#modules/enrollment/enrollment.model.js", () => ({ default: {} }));
vi.mock("#modules/class", () => ({
  checkClassTeacherOwnership: vi.fn(),
  resolveClassContentIds: vi.fn(),
}));
vi.mock("#modules/classEnrollment", () => ({
  ClassEnrollment: { exists: (...a) => classEnrollmentExists(...a) },
}));
// getAssignmentById dynamic-import()s class.model.js / classEnrollment.model.js trực tiếp
// (không qua barrel) — mock đúng 2 đường dẫn tương đối đó.
vi.mock("#modules/class/class.model.js", () => ({
  default: { find: (...a) => classFind(...a) },
}));
vi.mock("#modules/classEnrollment/classEnrollment.model.js", () => ({
  default: { exists: (...a) => classEnrollmentExists(...a) },
}));

const { getAssignmentById } = await import("#modules/assignment/assignment.controller.js");

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const buildAssignment = () => ({
  _id: "assignment-1",
  status: "PUBLISHED",
  topicId: "topic-1",
  questions: [
    {
      questionId: {
        _id: "q1",
        type: "MCQ",
        options: [
          { id: "opt-a", isCorrect: true, content: [{ id: "c1", type: "TEXT", text: "A" }] },
          { id: "opt-b", isCorrect: false, content: [{ id: "c2", type: "TEXT", text: "B" }] },
        ],
      },
    },
  ],
  toObject() {
    return JSON.parse(JSON.stringify(this));
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  findTopicById.mockResolvedValue({ _id: "topic-1", courseId: "course-1" });
  classFind.mockReturnValue({ select: () => Promise.resolve([{ _id: "class-1" }]) });
});

describe("getAssignmentById — BUG ĐÃ SỬA: ẩn đáp án đúng khỏi học sinh", () => {
  it("Học sinh đã ghi danh → KHÔNG thấy field isCorrect trong options, nhưng vẫn thấy nội dung câu hỏi", async () => {
    findAssignmentById.mockReturnValue(Promise.resolve(buildAssignment()));
    classEnrollmentExists.mockResolvedValue(true);
    const req = { params: { id: "assignment-1" }, user: { id: "student-1", role: "STUDENT" } };
    const res = buildRes();

    await getAssignmentById(req, res);

    const body = res.json.mock.calls[0][0];
    const options = body.assignment.questions[0].questionId.options;
    expect(options).toHaveLength(2);
    for (const opt of options) {
      expect(opt).not.toHaveProperty("isCorrect");
    }
    // Nội dung câu hỏi vẫn còn nguyên — chỉ ẩn đáp án, không phá UI.
    expect(options[0].content[0].text).toBe("A");
  });

  it("Giáo viên sở hữu bài tập → VẪN thấy isCorrect (cần để soạn/chấm bài)", async () => {
    findAssignmentById.mockReturnValue(Promise.resolve(buildAssignment()));
    const req = { params: { id: "assignment-1" }, user: { id: "teacher-1", role: "TEACHER" } };
    const res = buildRes();

    // checkTopicOwnership nội bộ gọi Topic.findById(...).populate("courseId") — courseId cần
    // có createdBy khớp userId để qua được kiểm tra sở hữu.
    findTopicById.mockReturnValue({
      populate: () => Promise.resolve({ courseId: { createdBy: { toString: () => "teacher-1" } } }),
    });

    await getAssignmentById(req, res);

    const body = res.json.mock.calls[0][0];
    const options = body.assignment.questions[0].questionId.options;
    expect(options[0]).toHaveProperty("isCorrect", true);
  });
});
