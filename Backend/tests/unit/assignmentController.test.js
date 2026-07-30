// Characterization test cho assignment.controller.js TRƯỚC KHI tách service/repository
// (rule bắt buộc: viết test đặc tả hành vi hiện tại trước khi refactor module phức tạp).
// Mock toàn bộ Mongoose model + Cloudinary + checkClassTeacherOwnership (qua classModel).
import { describe, it, expect, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import assignmentController from "../../src/controllers/assignment.controller.js";
import Assignment from "../../src/models/assignment.model.js";
import Submission from "../../src/models/submission.model.js";
import cloudinary from "../../src/config/cloudinary.js";
import classModel from "../../src/models/class.model.js";

const TEACHER_ID = "507f1f77bcf86cd799439011";
const OTHER_TEACHER_ID = "507f1f77bcf86cd799439099";
const CLASS_ID = "607f1f77bcf86cd799439111";
const STUDENT_ID = "607f1f77bcf86cd799439222";

// Query mock thenable — mô phỏng chuỗi Mongoose Query (populate/sort/skip/limit/lean/withDeleted/session
// đều trả về chính nó, và bản thân object có thể await trực tiếp), khớp với convention
// createQueryMock đã dùng trong các script test cũ của repo.
const mongooseQuery = (resolvedValue) => {
  const query = {
    populate: () => query,
    sort: () => query,
    skip: () => query,
    limit: () => query,
    lean: () => query,
    withDeleted: () => query,
    session: () => query,
    select: () => query,
    then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
    catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
  };
  return query;
};

const makeReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  files: undefined,
  user: { id: TEACHER_ID, role: "Teacher" },
  ...overrides,
});

const makeRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn(() => res);
  return res;
};

const mockSession = () => ({
  startTransaction: vi.fn(),
  commitTransaction: vi.fn().mockResolvedValue(true),
  abortTransaction: vi.fn().mockResolvedValue(true),
  endSession: vi.fn(),
  inTransaction: vi.fn(() => true),
});

const mockUploadStream = () => {
  vi.spyOn(cloudinary.uploader, "upload_stream").mockImplementation((options, callback) => ({
    end: () => callback(null, { secure_url: "http://fake/file.pdf", public_id: "fake_public_id" }),
  }));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createAssignment", () => {
  it("Thiếu title/deadline/classId trả 400", async () => {
    const req = makeReq({ body: {} });
    const res = makeRes();
    await assignmentController.createAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("classId sai định dạng ObjectId trả 400", async () => {
    const req = makeReq({ body: { title: "BT1", deadline: new Date(), classId: "not-a-valid-id" } });
    const res = makeRes();
    await assignmentController.createAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: OTHER_TEACHER_ID });
    const req = makeReq({ body: { title: "BT1", deadline: new Date(), classId: CLASS_ID } });
    const res = makeRes();
    await assignmentController.createAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("Tạo bài tập thành công (không kèm file)", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });
    vi.spyOn(Assignment.prototype, "save").mockResolvedValue(true);

    const req = makeReq({ body: { title: "BT1", deadline: new Date(), classId: CLASS_ID } });
    const res = makeRes();
    await assignmentController.createAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.assignment.title).toBe("BT1");
    expect(body.assignment.attachments).toEqual([]);
  });

  it("Tạo bài tập thành công kèm file upload lên Cloudinary", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });
    vi.spyOn(Assignment.prototype, "save").mockResolvedValue(true);
    mockUploadStream();

    const req = makeReq({
      body: { title: "BT1", deadline: new Date(), classId: CLASS_ID },
      files: [{ buffer: Buffer.from("x"), originalname: "de.pdf" }],
    });
    const res = makeRes();
    await assignmentController.createAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    const body = res.json.mock.calls[0][0];
    expect(body.assignment.attachments).toHaveLength(1);
    expect(body.assignment.attachments[0].url).toBe("http://fake/file.pdf");
  });
});

describe("gradeSubmission", () => {
  it("submissionId sai định dạng trả 400 và rollback transaction", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    const req = makeReq({ params: { submissionId: "invalid" } });
    const res = makeRes();
    await assignmentController.gradeSubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Không tìm thấy submission trả 404", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Submission, "findById").mockReturnValue(mongooseQuery(null));
    const req = makeReq({ params: { submissionId: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.gradeSubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Submission, "findById").mockReturnValue(mongooseQuery({ assignmentId: "a1" }));
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery({ classId: CLASS_ID }));
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: OTHER_TEACHER_ID });

    const req = makeReq({ params: { submissionId: "607f1f77bcf86cd799439333" }, body: { grade: 8 } });
    const res = makeRes();
    await assignmentController.gradeSubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("Chấm điểm thành công", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    const submission = { assignmentId: "a1", save: vi.fn().mockResolvedValue(true) };
    vi.spyOn(Submission, "findById").mockReturnValue(mongooseQuery(submission));
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery({ classId: CLASS_ID }));
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });

    const req = makeReq({ params: { submissionId: "607f1f77bcf86cd799439333" }, body: { grade: 9, feedback: "Tốt" } });
    const res = makeRes();
    await assignmentController.gradeSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(submission.save).toHaveBeenCalled();
    expect(submission.grade).toBe(9);
    expect(submission.status).toBe("graded");
  });
});

describe("updateAssignment", () => {
  it("id sai định dạng trả 400", async () => {
    const req = makeReq({ params: { id: "invalid" } });
    const res = makeRes();
    await assignmentController.updateAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Không tìm thấy bài tập trả 404", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue(null);
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.updateAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ classId: CLASS_ID });
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: OTHER_TEACHER_ID });
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.updateAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("Cập nhật thành công, giữ nguyên attachments cũ nếu không upload file mới", async () => {
    const assignment = { classId: CLASS_ID, title: "Cũ", attachments: [{ name: "a", url: "u", publicId: "p" }], save: vi.fn().mockResolvedValue(true) };
    vi.spyOn(Assignment, "findById").mockResolvedValue(assignment);
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });

    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" }, body: { title: "Mới" } });
    const res = makeRes();
    await assignmentController.updateAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(assignment.title).toBe("Mới");
    expect(assignment.attachments).toHaveLength(1);
  });
});

describe("deleteAssignment", () => {
  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ classId: CLASS_ID });
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: OTHER_TEACHER_ID });
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.deleteAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("Xóa thành công", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ classId: CLASS_ID });
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });
    vi.spyOn(Assignment, "softDelete").mockResolvedValue(true);

    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.deleteAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("getAssignmentById", () => {
  it("Trả 404 nếu không tìm thấy", async () => {
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery(null));
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.getAssignmentById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("Trả về đúng assignment khi tìm thấy", async () => {
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery({ _id: "a1", title: "BT1" }));
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.getAssignmentById(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].assignment.title).toBe("BT1");
  });
});

describe("getAssignmentsByClass", () => {
  it("classId sai định dạng trả mảng rỗng, status 200", async () => {
    const req = makeReq({ params: { classId: "invalid" } });
    const res = makeRes();
    await assignmentController.getAssignmentsByClass(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].assignments).toEqual([]);
  });

  it("Trả về danh sách + pagination đúng", async () => {
    vi.spyOn(Assignment, "find").mockReturnValue(mongooseQuery([{ _id: "a1" }, { _id: "a2" }]));
    vi.spyOn(Assignment, "countDocuments").mockResolvedValue(2);
    const req = makeReq({ params: { classId: CLASS_ID } });
    const res = makeRes();
    await assignmentController.getAssignmentsByClass(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.assignments).toHaveLength(2);
    expect(body.pagination.total).toBe(2);
  });
});

describe("getSubmissionsByAssignment", () => {
  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ classId: CLASS_ID });
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: OTHER_TEACHER_ID });
    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.getSubmissionsByAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("Giáo viên phụ trách lớp xem được danh sách bài nộp", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ classId: CLASS_ID });
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });
    vi.spyOn(Submission, "find").mockReturnValue(mongooseQuery([{ _id: "s1" }]));
    vi.spyOn(Submission, "countDocuments").mockResolvedValue(1);

    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await assignmentController.getSubmissionsByAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].submissions).toHaveLength(1);
  });
});

describe("getMySubmission", () => {
  it("Không có req.user trả 401", async () => {
    const req = makeReq({ user: null, params: { assignmentId: CLASS_ID } });
    const res = makeRes();
    await assignmentController.getMySubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it("assignmentId sai định dạng trả 400", async () => {
    const req = makeReq({ params: { assignmentId: "invalid" } });
    const res = makeRes();
    await assignmentController.getMySubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Không tìm thấy bài nộp trả 404", async () => {
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(null));
    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" }, user: { id: STUDENT_ID, role: "Student" } });
    const res = makeRes();
    await assignmentController.getMySubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("Trả về bài nộp của chính học sinh", async () => {
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery({ _id: "s1", studentId: STUDENT_ID }));
    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" }, user: { id: STUDENT_ID, role: "Student" } });
    const res = makeRes();
    await assignmentController.getMySubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("submitAssignment", () => {
  it("Bài tập không tồn tại hoặc đã xóa trả 404", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery(null));
    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" }, user: { id: STUDENT_ID, role: "Student" } });
    const res = makeRes();
    await assignmentController.submitAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("Đã được chấm điểm thì chặn nộp lại (409)", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(
      mongooseQuery({ isDeleted: false, deadline: new Date(Date.now() + 100000), classId: CLASS_ID })
    );
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery({ grade: 8, status: "graded" }));

    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" }, user: { id: STUDENT_ID, role: "Student" } });
    const res = makeRes();
    await assignmentController.submitAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("Quá hạn deadline khi đã từng nộp (không phải withdrawn) thì chặn (400)", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(
      mongooseQuery({ isDeleted: false, deadline: new Date(Date.now() - 100000), classId: CLASS_ID })
    );
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery({ grade: null, status: "submitted" }));

    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" }, user: { id: STUDENT_ID, role: "Student" } });
    const res = makeRes();
    await assignmentController.submitAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Nộp bài lần đầu thành công (status 201)", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(
      mongooseQuery({ isDeleted: false, deadline: new Date(Date.now() + 100000), classId: CLASS_ID })
    );
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(null));
    vi.spyOn(Submission.prototype, "save").mockResolvedValue(true);

    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      body: { content: "Bài làm của em" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await assignmentController.submitAssignment(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("Nộp lại bài (resubmit) thành công, xóa file cũ trên Cloudinary", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(
      mongooseQuery({ isDeleted: false, deadline: new Date(Date.now() + 100000), classId: CLASS_ID })
    );
    const existingSubmission = {
      grade: null,
      status: "withdrawn",
      attachments: [{ name: "old", url: "u", publicId: "old_public_id" }],
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(existingSubmission));
    mockUploadStream();
    vi.spyOn(cloudinary.uploader, "destroy").mockResolvedValue({});

    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      body: { content: "Sửa lại bài" },
      files: [{ buffer: Buffer.from("x"), originalname: "new.pdf" }],
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await assignmentController.submitAssignment(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(existingSubmission.save).toHaveBeenCalled();
  });
});

describe("cancelSubmission", () => {
  it("Quá hạn deadline thì chặn hủy nộp (400)", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ isDeleted: false, deadline: new Date(Date.now() - 100000) });
    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" }, user: { id: STUDENT_ID, role: "Student" } });
    const res = makeRes();
    await assignmentController.cancelSubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("Đã chấm điểm thì chặn hủy nộp (409)", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ isDeleted: false, deadline: new Date(Date.now() + 100000) });
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery({ grade: 8, status: "graded" }));
    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" }, user: { id: STUDENT_ID, role: "Student" } });
    const res = makeRes();
    await assignmentController.cancelSubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it("Hủy nộp thành công", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ isDeleted: false, deadline: new Date(Date.now() + 100000) });
    const submission = { grade: null, status: "submitted", attachments: [], save: vi.fn().mockResolvedValue(true) };
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(submission));

    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" }, user: { id: STUDENT_ID, role: "Student" } });
    const res = makeRes();
    await assignmentController.cancelSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(submission.status).toBe("withdrawn");
  });
});
