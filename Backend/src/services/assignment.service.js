// File: src/services/assignment.service.js
// Business logic cho Assignment/Submission — tách ra từ assignment.controller.js (PR-08).
// Không phụ thuộc req/res; nhận tham số nguyên thủy, trả data hoặc throw Error có .status.
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";
import { checkClassTeacherOwnership } from "../middlewares/auth.middleware.js";
import * as assignmentRepo from "../repositories/assignment.repository.js";

const throwError = (message, status) => {
  const error = new Error(message);
  error.status = status;
  throw error;
};

const uploadToCloudinary = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "AI_LMS_Assignments", resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ name: originalName, url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(fileBuffer);
  });
};

const uploadFiles = async (files) => {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((file) => uploadToCloudinary(file.buffer, file.originalname)));
};

export const createAssignmentService = async ({
  title,
  description,
  deadline,
  classId,
  lessonId,
  isAIGenerated,
  aiPromptUsed,
  files,
  teacherId,
  teacherRole,
}) => {
  if (!title || !deadline || !classId) {
    throwError("Thiếu thông tin: Tiêu đề, Hạn nộp hoặc ClassId", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(classId)) {
    throwError("ID lớp học không hợp lệ!", 400);
  }

  const isAuthorized = await checkClassTeacherOwnership(classId, teacherId, teacherRole);
  if (!isAuthorized) {
    throwError("Bạn không có quyền tạo bài tập cho lớp học này!", 403);
  }

  const attachments = await uploadFiles(files);

  const newAssignment = assignmentRepo.createAssignment({
    title,
    description,
    attachments,
    deadline,
    classId,
    lessonId: lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? lessonId : null,
    teacherId,
    createdBy: teacherId,
    isAIGenerated: isAIGenerated === "true" || isAIGenerated === true,
    aiPromptUsed: aiPromptUsed || null,
  });

  await newAssignment.save();
  return newAssignment;
};

export const gradeSubmissionService = async ({
  submissionId,
  grade,
  feedback,
  aiFeedback,
  userId,
  userRole,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!submissionId || !mongoose.Types.ObjectId.isValid(submissionId)) {
      throwError("ID bài nộp không hợp lệ!", 400);
    }

    const submission = await assignmentRepo.findSubmissionById(submissionId, { session });
    if (!submission) {
      throwError("Không tìm thấy bài nộp này", 404);
    }

    const assignment = await assignmentRepo.findAssignmentById(submission.assignmentId, {
      session,
    });
    if (!assignment) {
      throwError("Bài tập không tồn tại", 404);
    }

    const isAuthorized = await checkClassTeacherOwnership(assignment.classId, userId, userRole);
    if (!isAuthorized) {
      throwError("Bạn không có quyền chấm bài nộp của lớp học này!", 403);
    }

    submission.grade = grade;
    submission.feedback = feedback || "";
    if (aiFeedback !== undefined) submission.aiFeedback = aiFeedback;
    submission.gradedBy = userId;
    submission.gradedAt = new Date();
    submission.status = "graded";

    await submission.save({ session });
    await session.commitTransaction();
    return submission;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const updateAssignmentService = async ({
  id,
  title,
  description,
  deadline,
  lessonId,
  files,
  userId,
  userRole,
}) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throwError("ID bài tập không hợp lệ!", 400);
  }

  const assignment = await assignmentRepo.findAssignmentById(id);
  if (!assignment) {
    throwError("Bài tập không tồn tại", 404);
  }

  const isAuthorized = await checkClassTeacherOwnership(assignment.classId, userId, userRole);
  if (!isAuthorized) {
    throwError("Bạn không có quyền sửa bài tập này!", 403);
  }

  let newAttachments = assignment.attachments || [];
  const uploaded = await uploadFiles(files);
  if (uploaded.length > 0) {
    newAttachments = [...newAttachments, ...uploaded];
  }

  if (title) assignment.title = title;
  if (description !== undefined) assignment.description = description;
  if (deadline) assignment.deadline = deadline;
  if (lessonId !== undefined) assignment.lessonId = lessonId;
  assignment.attachments = newAttachments;

  await assignment.save();
  return assignment;
};

export const deleteAssignmentService = async ({ id, userId, userRole }) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throwError("ID bài tập không hợp lệ!", 400);
  }

  const assignment = await assignmentRepo.findAssignmentById(id);
  if (!assignment) {
    throwError("Bài tập không tồn tại", 404);
  }

  const isAuthorized = await checkClassTeacherOwnership(assignment.classId, userId, userRole);
  if (!isAuthorized) {
    throwError("Bạn không có quyền xóa bài tập này!", 403);
  }

  await assignmentRepo.softDeleteAssignment(id, userId);
};

export const getAssignmentByIdService = async (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throwError("Bài tập không tồn tại!", 404);
  }

  const assignment = await assignmentRepo.findAssignmentByIdPopulated(id);
  if (!assignment) {
    throwError("Bài tập không tồn tại", 404);
  }
  return assignment;
};

export const getAssignmentsByClassService = async ({ classId, page, limit }) => {
  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return { assignments: [], pagination: null };
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);
  const skip = (pageNum - 1) * limitNum;

  const [assignments, total] = await Promise.all([
    assignmentRepo.findAssignmentsByClass(classId, { skip, limit: limitNum }),
    assignmentRepo.countAssignmentsByClass(classId),
  ]);

  return {
    assignments,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

export const getSubmissionsByAssignmentService = async ({
  assignmentId,
  page,
  limit,
  userId,
  userRole,
}) => {
  if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
    return { submissions: [], pagination: null };
  }

  const assignment = await assignmentRepo.findAssignmentById(assignmentId);
  if (!assignment) {
    throwError("Bài tập không tồn tại!", 404);
  }

  const isAuthorized = await checkClassTeacherOwnership(assignment.classId, userId, userRole);
  if (!isAuthorized) {
    throwError("Bạn không có quyền xem bài nộp của bài tập này!", 403);
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);
  const skip = (pageNum - 1) * limitNum;

  const [submissions, total] = await Promise.all([
    assignmentRepo.findSubmissionsByAssignmentPaginated(assignmentId, { skip, limit: limitNum }),
    assignmentRepo.countSubmissionsByAssignment(assignmentId),
  ]);

  return {
    submissions,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

export const getMySubmissionService = async ({ assignmentId, studentId }) => {
  if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
    throwError("INVALID_ID", 400);
  }

  const submission = await assignmentRepo.findSubmissionByAssignmentAndStudent(
    assignmentId,
    studentId
  );
  if (!submission) {
    throwError("SUBMISSION_NOT_FOUND", 404);
  }
  return submission;
};

export const submitAssignmentService = async ({ assignmentId, content, files, studentId }) => {
  let newAttachments = [];
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      throwError("ID bài tập không hợp lệ!", 400);
    }

    const assignment = await assignmentRepo.findAssignmentById(assignmentId, { session });
    if (!assignment || assignment.isDeleted) {
      throwError("Bài tập không tồn tại hoặc đã bị xóa!", 404);
    }

    let submission = await assignmentRepo.findSubmissionByAssignmentAndStudentWithDeleted(
      assignmentId,
      studentId,
      { session }
    );

    const now = new Date();
    const isLate = now > new Date(assignment.deadline);

    if (
      submission &&
      ((submission.grade !== null && submission.grade !== undefined) ||
        submission.status === "graded")
    ) {
      throwError("Bài nộp đã được Giáo viên chấm điểm. Bạn không thể nộp lại bài nữa!", 409);
    }

    if (submission && submission.status !== "withdrawn" && isLate) {
      throwError("Bài tập đã quá hạn deadline. Bạn không thể chỉnh sửa hoặc nộp lại bài!", 400);
    }

    newAttachments = await uploadFiles(files);

    const status = isLate ? "late" : submission ? "resubmitted" : "submitted";

    if (submission) {
      const oldAttachments = submission.attachments;

      if (content !== undefined) submission.content = content;
      if (newAttachments.length > 0) submission.attachments = newAttachments;
      submission.status = status;
      submission.resubmittedAt = now;
      submission.isDeleted = false;
      submission.grade = null;
      submission.feedback = "";
      submission.gradedAt = null;

      await submission.save({ session });
      await session.commitTransaction();

      if (newAttachments.length > 0 && oldAttachments && oldAttachments.length > 0) {
        const deletePromises = oldAttachments
          .filter((file) => file && file.publicId)
          .map((file) => cloudinary.uploader.destroy(file.publicId).catch(() => null));
        Promise.all(deletePromises).catch(() => null);
      }

      return { submission, isNew: false };
    }

    submission = assignmentRepo.createSubmission({
      assignmentId,
      studentId,
      classId: assignment.classId,
      content: content || "",
      attachments: newAttachments,
      status,
    });

    await submission.save({ session });
    await session.commitTransaction();
    return { submission, isNew: true };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (newAttachments.length > 0) {
      const rollbackPromises = newAttachments
        .filter((file) => file && file.publicId)
        .map((file) => cloudinary.uploader.destroy(file.publicId).catch(() => null));
      await Promise.all(rollbackPromises);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

export const cancelSubmissionService = async ({ assignmentId, studentId }) => {
  if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
    throwError("ID bài tập không hợp lệ!", 400);
  }

  const assignment = await assignmentRepo.findAssignmentById(assignmentId);
  if (!assignment || assignment.isDeleted) {
    throwError("Bài tập không tồn tại hoặc đã bị xóa!", 404);
  }

  const now = new Date();
  if (now > new Date(assignment.deadline)) {
    throwError("Bài tập đã quá hạn deadline. Bạn không thể hủy bài nộp nữa!", 400);
  }

  const submission = await assignmentRepo.findSubmissionByAssignmentAndStudentWithDeleted(
    assignmentId,
    studentId
  );
  if (!submission || submission.status === "withdrawn") {
    throwError("Không tìm thấy bài nộp hợp lệ để hủy!", 404);
  }

  if (
    (submission.grade !== null && submission.grade !== undefined) ||
    submission.status === "graded"
  ) {
    throwError("Bài nộp đã được Giáo viên chấm điểm. Bạn không thể hủy bài nộp!", 409);
  }

  if (submission.attachments && submission.attachments.length > 0) {
    const deletePromises = submission.attachments
      .filter((file) => file && file.publicId)
      .map((file) => cloudinary.uploader.destroy(file.publicId).catch(() => null));
    await Promise.all(deletePromises);
  }

  submission.status = "withdrawn";
  submission.withdrawnAt = now;
  submission.attachments = [];
  submission.content = "";
  await submission.save();

  return submission;
};
