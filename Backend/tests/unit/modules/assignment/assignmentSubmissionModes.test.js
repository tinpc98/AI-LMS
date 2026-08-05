import { describe, it, expect, vi, beforeEach } from "vitest";
import assignmentController from "../../../../src/modules/assignment/assignment.controller.js";
import Assignment from "../../../../src/modules/assignment/assignment.model.js";
import Submission from "../../../../src/modules/assignment/submission.model.js";
import classModel from "../../../../src/modules/class/class.model.js";
import mongoose from "mongoose";

const TEACHER_ID = "607f1f77bcf86cd799439011";
const STUDENT_ID = "607f1f77bcf86cd799439022";
const CLASS_ID = "607f1f77bcf86cd799439033";
const ASSIGNMENT_ID = "607f1f77bcf86cd799439044";

const makeReq = (overrides = {}) => ({
  user: { id: STUDENT_ID, role: "student" },
  params: {},
  body: {},
  query: {},
  files: [],
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("Assignment Submission Modes & Drafts - Unit Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Teacher creates assignment with questions & modes", () => {
    it("creates assignment with submissionMode 'direct' and sanitized questions", async () => {
      vi.spyOn(classModel, "findById").mockResolvedValue({
        _id: CLASS_ID,
        teacherId: TEACHER_ID,
      });

      let savedData = null;
      vi.spyOn(Assignment.prototype, "save").mockImplementation(function () {
        savedData = this;
        return Promise.resolve(this);
      });

      const req = makeReq({
        user: { id: TEACHER_ID, role: "teacher" },
        body: {
          title: "Bài tập lập trình",
          submissionMode: "direct",
          deadline: new Date(Date.now() + 86400000).toISOString(),
          classId: CLASS_ID,
          questions: JSON.stringify([
            { order: 1, content: "<p>Câu hỏi 1</p><script>alert('xss')</script>", required: true },
            { order: 2, content: "<p>Câu hỏi 2</p>", required: false },
          ]),
        },
      });
      const res = makeRes();

      await assignmentController.createAssignment(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(savedData.submissionMode).toBe("direct");
      expect(savedData.questions).toHaveLength(2);
      expect(savedData.questions[0].content).toBe("<p>Câu hỏi 1</p>");
      expect(savedData.questions[0].content).not.toContain("<script>");
      expect(savedData.questions[1].required).toBe(false);
    });
  });

  describe("Student saves draft", () => {
    it("saves draft without affecting deadline or requiring mandatory fields", async () => {
      vi.spyOn(Assignment, "findById").mockResolvedValue({
        _id: ASSIGNMENT_ID,
        classId: CLASS_ID,
        deadline: new Date(Date.now() - 1000).toISOString(), // Đã quá hạn vẫn cho lưu draft
      });

      vi.spyOn(Submission, "findOne").mockReturnValue({
        withDeleted: vi.fn().mockResolvedValue(null),
      });

      let savedSubmission = null;
      vi.spyOn(Submission.prototype, "save").mockImplementation(function () {
        savedSubmission = this;
        return Promise.resolve(this);
      });

      const req = makeReq({
        params: { assignmentId: ASSIGNMENT_ID },
        body: {
          submissionType: "direct",
          answers: JSON.stringify([
            { questionId: new mongoose.Types.ObjectId(), content: "<p>Đang làm dở dang...</p>" },
          ]),
        },
      });
      const res = makeRes();

      await assignmentController.saveDraft(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(savedSubmission.status).toBe("draft");
      expect(savedSubmission.answers[0].content).toBe("<p>Đang làm dở dang...</p>");
    });
  });

  describe("Teacher list submissions excludes drafts", () => {
    it("filters out status: draft when querying submissions", async () => {
      vi.spyOn(Assignment, "findById").mockResolvedValue({
        _id: ASSIGNMENT_ID,
        classId: CLASS_ID,
      });

      vi.spyOn(classModel, "findById").mockResolvedValue({
        _id: CLASS_ID,
        teacherId: TEACHER_ID,
      });

      const mockFind = vi.fn().mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockReturnValue({
            sort: vi.fn().mockReturnValue({
              skip: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  lean: vi.fn().mockResolvedValue([
                    { _id: "sub1", status: "submitted", answers: [] },
                  ]),
                }),
              }),
            }),
          }),
        }),
      });
      vi.spyOn(Submission, "find").mockImplementation(mockFind);
      vi.spyOn(Submission, "countDocuments").mockResolvedValue(1);

      const req = makeReq({
        user: { id: TEACHER_ID, role: "teacher" },
        params: { assignmentId: ASSIGNMENT_ID },
      });
      const res = makeRes();

      await assignmentController.getSubmissionsByAssignment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(mockFind).toHaveBeenCalledWith({
        assignmentId: ASSIGNMENT_ID,
        status: { $ne: "draft" },
      });
    });
  });
});
