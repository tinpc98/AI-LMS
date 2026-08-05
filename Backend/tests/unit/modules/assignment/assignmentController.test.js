// Characterization test cho assignment.controller.js TRƯỚC KHI tách service/repository
// (rule bắt buộc: viết test đặc tả hành vi hiện tại trước khi refactor module phức tạp).
// Mock toàn bộ Mongoose model + Cloudinary + checkClassTeacherOwnership (qua classModel).
import { describe, it, expect, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import assignmentController from "../../../../src/modules/assignment/assignment.controller.js";
import { Assignment } from "#modules/assignment";
import { Submission } from "#modules/assignment";
import cloudinary from "../../../../src/config/cloudinary.js";
import { Class as classModel } from "#modules/class";

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

/**
 * Gọi controller rồi lấy ra lỗi mà nó chuyển sang next().
 *
 * SAU KHI ÁP asyncHandler, controller KHÔNG còn tự trả lỗi qua res nữa: nó gọi next(error), và
 * errorHandler tập trung mới là nơi quyết định mã HTTP cùng thân phản hồi. Vì vậy các test
 * nhánh lỗi phải kiểm mã trên CHÍNH ĐỐI TƯỢNG LỖI, chứ không kiểm res.status.
 *
 * Kiểm cả "next được gọi đúng một lần": nếu controller vừa gọi next vừa trả res, hoặc nuốt lỗi
 * mà không gọi next (request treo vô hạn), test sẽ đỏ.
 */
const expectErrorStatus = async (handler, req, res, status) => {
  const next = vi.fn();
  await handler(req, res, next);

  expect(next, "controller phải chuyển lỗi sang next()").toHaveBeenCalledTimes(1);
  const error = next.mock.calls[0][0];
  expect(error, "next() phải nhận một Error").toBeInstanceOf(Error);
  expect(error.status ?? 500, `kỳ vọng ${status}, nhận ${error.status} — "${error.message}"`).toBe(
    status
  );
  expect(
    res.status,
    "không được trả phản hồi khi đã chuyển lỗi sang next()"
  ).not.toHaveBeenCalled();
  return error;
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
    await expectErrorStatus(assignmentController.createAssignment, req, res, 400);
  });

  it("classId sai định dạng ObjectId trả 400", async () => {
    const req = makeReq({
      body: { title: "BT1", deadline: new Date(), classId: "not-a-valid-id" },
    });
    const res = makeRes();
    await expectErrorStatus(assignmentController.createAssignment, req, res, 400);
  });

  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OTHER_TEACHER_ID,
    });
    const req = makeReq({ body: { title: "BT1", deadline: new Date(), classId: CLASS_ID } });
    const res = makeRes();
    await expectErrorStatus(assignmentController.createAssignment, req, res, 403);
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
    expect(body.assignment.attachments[0].url).toContain("fake_public_id");
  });
});

describe("gradeSubmission", () => {
  it("submissionId sai định dạng trả 400 và rollback transaction", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    const req = makeReq({ params: { submissionId: "invalid" } });
    const res = makeRes();
    await expectErrorStatus(assignmentController.gradeSubmission, req, res, 400);
  });

  it("Không tìm thấy submission trả 404", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Submission, "findById").mockReturnValue(mongooseQuery(null));
    const req = makeReq({ params: { submissionId: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await expectErrorStatus(assignmentController.gradeSubmission, req, res, 404);
  });

  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Submission, "findById").mockReturnValue(mongooseQuery({ assignmentId: "a1" }));
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery({ classId: CLASS_ID }));
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OTHER_TEACHER_ID,
    });

    const req = makeReq({
      params: { submissionId: "607f1f77bcf86cd799439333" },
      body: { grade: 8 },
    });
    const res = makeRes();
    await expectErrorStatus(assignmentController.gradeSubmission, req, res, 403);
  });

  it("Chấm điểm thành công", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    const submission = { assignmentId: "a1", save: vi.fn().mockResolvedValue(true) };
    vi.spyOn(Submission, "findById").mockReturnValue(mongooseQuery(submission));
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery({ classId: CLASS_ID }));
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });

    const req = makeReq({
      params: { submissionId: "607f1f77bcf86cd799439333" },
      body: { grade: 9, feedback: "Tốt" },
    });
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
    await expectErrorStatus(assignmentController.updateAssignment, req, res, 400);
  });

  it("Không tìm thấy bài tập trả 404", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue(null);
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await expectErrorStatus(assignmentController.updateAssignment, req, res, 404);
  });

  it("Giáo viên không phụ trách lớp bị chặn 403", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({ classId: CLASS_ID });
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OTHER_TEACHER_ID,
    });
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await expectErrorStatus(assignmentController.updateAssignment, req, res, 403);
  });

  it("Cập nhật thành công, giữ nguyên attachments cũ nếu không upload file mới", async () => {
    const assignment = {
      classId: CLASS_ID,
      title: "Cũ",
      attachments: [{ name: "a", url: "u", publicId: "p" }],
      save: vi.fn().mockResolvedValue(true),
    };
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
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OTHER_TEACHER_ID,
    });
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await expectErrorStatus(assignmentController.deleteAssignment, req, res, 403);
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
  it("id SAI ĐỊNH DẠNG trả 400, không phải 404 (giai đoạn 2)", async () => {
    // Bản cũ trả 404 "Bài tập không tồn tại" cho một id sai định dạng — khẳng định sai một sự
    // thật, vì hệ thống chưa hề tra cứu gì. Nay là 400 kèm errorCode INVALID_ID.
    const req = makeReq({ params: { id: "khong-phai-objectid" } });
    const err = await expectErrorStatus(
      assignmentController.getAssignmentById,
      req,
      makeRes(),
      400
    );
    expect(err.errorCode).toBe("INVALID_ID");
  });

  it("Trả 404 nếu không tìm thấy", async () => {
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery(null));
    const req = makeReq({ params: { id: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await expectErrorStatus(assignmentController.getAssignmentById, req, res, 404);
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
    vi.spyOn(classModel, "findById").mockResolvedValue({
      _id: CLASS_ID,
      teacherId: OTHER_TEACHER_ID,
    });
    const req = makeReq({ params: { assignmentId: "607f1f77bcf86cd799439333" } });
    const res = makeRes();
    await expectErrorStatus(assignmentController.getSubmissionsByAssignment, req, res, 403);
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
    await expectErrorStatus(assignmentController.getMySubmission, req, res, 400);
  });

  it("Không tìm thấy bài nộp trả 404", async () => {
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(null));
    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await expectErrorStatus(assignmentController.getMySubmission, req, res, 404);
  });

  it("Trả về bài nộp của chính học sinh", async () => {
    vi.spyOn(Submission, "findOne").mockReturnValue(
      mongooseQuery({ _id: "s1", studentId: STUDENT_ID })
    );
    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await assignmentController.getMySubmission(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("submitAssignment", () => {
  it("Bài tập không tồn tại hoặc đã xóa trả 404", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(mongooseQuery(null));
    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await expectErrorStatus(assignmentController.submitAssignment, req, res, 404);
  });

  it("Đã được chấm điểm thì chặn nộp lại (409)", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(
      mongooseQuery({
        isDeleted: false,
        deadline: new Date(Date.now() + 100000),
        classId: CLASS_ID,
      })
    );
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery({ grade: 8, status: "graded" }));

    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await expectErrorStatus(assignmentController.submitAssignment, req, res, 409);
  });

  it("Quá hạn deadline khi đã từng nộp (không phải withdrawn) thì chặn (400)", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(
      mongooseQuery({
        isDeleted: false,
        deadline: new Date(Date.now() - 100000),
        classId: CLASS_ID,
      })
    );
    vi.spyOn(Submission, "findOne").mockReturnValue(
      mongooseQuery({ grade: null, status: "submitted" })
    );

    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await expectErrorStatus(assignmentController.submitAssignment, req, res, 400);
  });

  it("Nộp bài lần đầu thành công (status 201)", async () => {
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(
      mongooseQuery({
        isDeleted: false,
        deadline: new Date(Date.now() + 100000),
        classId: CLASS_ID,
      })
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
      mongooseQuery({
        isDeleted: false,
        deadline: new Date(Date.now() + 100000),
        classId: CLASS_ID,
      })
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
    vi.spyOn(Assignment, "findById").mockResolvedValue({
      isDeleted: false,
      deadline: new Date(Date.now() - 100000),
    });
    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await expectErrorStatus(assignmentController.cancelSubmission, req, res, 400);
  });

  it("Đã chấm điểm thì chặn hủy nộp (409)", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({
      isDeleted: false,
      deadline: new Date(Date.now() + 100000),
    });
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery({ grade: 8, status: "graded" }));
    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await expectErrorStatus(assignmentController.cancelSubmission, req, res, 409);
  });

  it("Hủy nộp thành công", async () => {
    vi.spyOn(Assignment, "findById").mockResolvedValue({
      isDeleted: false,
      deadline: new Date(Date.now() + 100000),
    });
    const submission = {
      grade: null,
      status: "submitted",
      attachments: [],
      save: vi.fn().mockResolvedValue(true),
    };
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(submission));

    const req = makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
    });
    const res = makeRes();
    await assignmentController.cancelSubmission(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(submission.status).toBe("withdrawn");
  });
});

// ============================================================================
// Hành vi MỚI có được nhờ áp asyncHandler (§7).
//
// Các test phía trên chốt rằng hành vi cũ không đổi. Phần này chốt thứ trước đây KHÔNG có:
// controller chuyển lỗi nguyên vẹn sang errorHandler thay vì tự ép về 500.
// ============================================================================
describe("assignment.controller — chuyển lỗi sang errorHandler", () => {
  it("ValidationError của Mongoose tới next NGUYÊN VẸN để được quy đổi thành 400", async () => {
    // Đây là điểm được lớn nhất của thay đổi. Bản cũ bắt lỗi rồi trả `error.status || 500`;
    // ValidationError không có .status nên client nhận 500 — báo "lỗi máy chủ" cho một lỗi
    // hoàn toàn do dữ liệu gửi lên. Nay lỗi đi tới errorHandler, nơi đã có sẵn tầng quy đổi.
    const validationError = new Error("Assignment validation failed");
    validationError.name = "ValidationError";
    validationError.errors = { title: { path: "title", message: "Tiêu đề là bắt buộc" } };

    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });
    vi.spyOn(Assignment.prototype, "save").mockRejectedValue(validationError);

    const req = makeReq({ body: { title: "BT1", deadline: new Date(), classId: CLASS_ID } });
    const res = makeRes();
    const next = vi.fn();

    await assignmentController.createAssignment(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const forwarded = next.mock.calls[0][0];
    expect(forwarded.name).toBe("ValidationError");
    expect(forwarded.errors).toBeDefined(); // errorHandler cần trường này để dựng details
    expect(res.status).not.toHaveBeenCalled();
  });

  it("lỗi không lường trước cũng tới next, không bị nuốt thành 500 tại chỗ", async () => {
    vi.spyOn(classModel, "findById").mockRejectedValue(new Error("mất kết nối DB"));

    const req = makeReq({ body: { title: "BT1", deadline: new Date(), classId: CLASS_ID } });
    const res = makeRes();
    const next = vi.fn();

    await assignmentController.createAssignment(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].message).toBe("mất kết nối DB");
    // Quan trọng: KHÔNG tự trả phản hồi. Ở production errorHandler sẽ che message nội bộ này;
    // bản cũ gửi thẳng "mất kết nối DB" ra cho client.
    expect(res.status).not.toHaveBeenCalled();
  });

  it("nhánh THÀNH CÔNG không gọi next", async () => {
    // Gọi next sau khi đã trả phản hồi sẽ khiến errorHandler chạy trên một response đã gửi.
    vi.spyOn(classModel, "findById").mockResolvedValue({ _id: CLASS_ID, teacherId: TEACHER_ID });
    vi.spyOn(Assignment.prototype, "save").mockResolvedValue(true);

    const req = makeReq({ body: { title: "BT1", deadline: new Date(), classId: CLASS_ID } });
    const res = makeRes();
    const next = vi.fn();

    await assignmentController.createAssignment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });
});

// ============================================================================
// Chính sách 2A: CHẶN CỨNG bài nộp quá hạn.
//
// Bản cũ chỉ chặn NỘP LẠI sau hạn — nộp lần đầu sau hạn vẫn được nhận và đánh dấu "late".
// Nghĩa là hạn nộp không có hiệu lực với ai chưa từng nộp. Các test dưới đây chốt hành vi mới,
// và nhóm test cũ ở trên vẫn xanh vì luật mới CHẶT HƠN luật cũ chứ không mâu thuẫn.
// ============================================================================
describe("submitAssignment — chặn cứng quá hạn (chính sách 2A)", () => {
  const baiTap = (deadline) => mongooseQuery({ isDeleted: false, deadline, classId: CLASS_ID });

  const reqNop = () =>
    makeReq({
      params: { assignmentId: "607f1f77bcf86cd799439333" },
      user: { id: STUDENT_ID, role: "Student" },
      body: { content: "bài làm" },
    });

  it("NỘP LẦN ĐẦU sau hạn bị TỪ CHỐI", async () => {
    // Đây là hành vi MỚI. Trước đây trường hợp này được nhận và ghi status "late".
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(baiTap(new Date(Date.now() - 100000)));
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(null)); // chưa từng nộp

    await expectErrorStatus(assignmentController.submitAssignment, reqNop(), makeRes(), 400);
  });

  it("thông báo nói rõ lý do là quá hạn, không phải lỗi chung chung", async () => {
    // Học sinh cần hiểu vì sao bị từ chối để không thử lại vô ích.
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(baiTap(new Date(Date.now() - 100000)));
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(null));

    const error = await expectErrorStatus(
      assignmentController.submitAssignment,
      reqNop(),
      makeRes(),
      400
    );
    expect(error.message).toMatch(/quá hạn/i);
  });

  it("nộp TRƯỚC hạn vẫn bình thường", async () => {
    // Chốt rằng luật mới không chặn nhầm bài nộp đúng hạn.
    vi.spyOn(mongoose, "startSession").mockResolvedValue(mockSession());
    vi.spyOn(Assignment, "findById").mockReturnValue(baiTap(new Date(Date.now() + 100000)));
    vi.spyOn(Submission, "findOne").mockReturnValue(mongooseQuery(null));
    vi.spyOn(Submission.prototype, "save").mockResolvedValue(true);

    const res = makeRes();
    const next = vi.fn();
    await assignmentController.submitAssignment(reqNop(), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
