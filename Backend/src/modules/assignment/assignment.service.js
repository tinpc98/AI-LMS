// File: src/services/assignment.service.js
// Business logic cho Assignment/Submission
import mongoose from "mongoose";
import storageService from "#shared/services/storage.service.js";
import { checkClassTeacherOwnership } from "#modules/class";
import * as assignmentRepo from "./assignment.repository.js";
import { ErrorCode } from "#shared/errors/errorCodes.js";
import { sanitizeRichText } from "#shared/utils/htmlSanitizer.js";

const throwError = (message, status, errorCode) => {
  const error = new Error(message);
  error.status = status;
  if (errorCode) error.errorCode = errorCode;
  throw error;
};

export const decodeOriginalName = (name) => {
  if (!name || typeof name !== "string") return "";
  // Nếu chuỗi đã chứa ký tự Unicode vượt quá 255 (ví dụ: 'đ', 'ế', 'ơ'), đã là UTF-8 hợp lệ
  const hasHighUnicode = Array.from(name).some((char) => char.charCodeAt(0) > 255);
  if (hasHighUnicode) {
    return name;
  }
  try {
    const decoded = Buffer.from(name, "latin1").toString("utf8");
    // Nếu giải mã sinh ra ký tự không hợp lệ (\uFFFD), giữ nguyên chuỗi ban đầu
    return decoded.includes("\uFFFD") ? name : decoded;
  } catch {
    return name;
  }
};

export const signAttachmentUrls = (attachments) => {
  if (!attachments || !Array.isArray(attachments)) return [];
  return attachments.map((att) => {
    const attObj = att.toObject ? att.toObject() : { ...att };
    if (!attObj.publicId) return attObj;

    let resourceType = attObj.resourceType || "raw";
    let storageType = "authenticated";
    let format = attObj.format || "";

    // Xử lý các file legacy trong folder AI_LMS_Assignments (chưa qua storageService)
    if (typeof attObj.publicId === "string" && attObj.publicId.startsWith("AI_LMS_Assignments/")) {
      if (!attObj.publicId.includes("doc_")) {
        storageType = "upload";
        const name = attObj.name || "";
        if (name.toLowerCase().endsWith(".pdf") || format === "pdf") {
          resourceType = "image";
          format = "pdf";
        }
      }
    }

    try {
      const { signedUrl } = storageService.getSignedUrl(attObj.publicId, {
        resourceType,
        storageType,
        format,
        durationSeconds: 7200,
      });
      return {
        ...attObj,
        url: signedUrl || attObj.url,
      };
    } catch {
      return attObj;
    }
  });
};

export const signAssignmentAttachments = (assignment) => {
  if (!assignment) return assignment;
  const obj = assignment.toObject ? assignment.toObject() : { ...assignment };
  if (obj.attachments && obj.attachments.length > 0) {
    obj.attachments = signAttachmentUrls(obj.attachments);
  }
  return obj;
};

export const signSubmissionAttachments = (submission) => {
  if (!submission) return submission;
  const obj = submission.toObject ? submission.toObject() : { ...submission };
  if (obj.attachments && obj.attachments.length > 0) {
    obj.attachments = signAttachmentUrls(obj.attachments);
  }
  return obj;
};

const uploadFiles = async (files) => {
  if (!files || files.length === 0) return [];
  return Promise.all(
    files.map(async (file) => {
      const decodedName = decodeOriginalName(file.originalname);
      const ext =
        decodedName && decodedName.includes(".")
          ? decodedName.substring(decodedName.lastIndexOf(".") + 1).toLowerCase()
          : "";
      const result = await storageService.uploadFile(file.buffer, decodedName, {
        folder: "AI_LMS_Assignments",
        resourceType: "raw",
      });
      const { signedUrl } = storageService.getSignedUrl(result.publicId, {
        resourceType: result.resourceType || "raw",
        storageType: "authenticated",
        format: result.format || ext,
      });
      return {
        name: decodedName,
        url: signedUrl,
        publicId: result.publicId,
        format: result.format || ext || null,
        bytes: result.bytes || 0,
        resourceType: result.resourceType || "raw",
      };
    })
  );
};

/**
 * 1. Tạo bài tập mới
 */
export const createAssignmentService = async ({
  title,
  description,
  submissionMode = "file",
  maxScore = 10,
  questions,
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

  // Parse & Sanitize câu hỏi (nếu có)
  let parsedQuestions = [];
  if (questions) {
    const rawQuestions = typeof questions === "string" ? JSON.parse(questions) : questions;
    if (Array.isArray(rawQuestions)) {
      parsedQuestions = rawQuestions.map((q, idx) => ({
        order: Number(q.order) || idx + 1,
        content: sanitizeRichText(q.content || ""),
        required: q.required !== false,
      }));
    }
  }

  const attachments = await uploadFiles(files);

  const newAssignment = assignmentRepo.createAssignment({
    title: title.trim(),
    description: description ? description.trim() : "",
    submissionMode: ["file", "link", "direct", "any"].includes(submissionMode)
      ? submissionMode
      : "file",
    maxScore: Number(maxScore) || 10,
    questions: parsedQuestions,
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
  return signAssignmentAttachments(newAssignment);
};

/**
 * 2. Giáo viên chấm điểm và nhận xét
 */
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

    const max = assignment.maxScore || 10;
    if (grade > max) {
      throwError(`Điểm không được vượt quá ${max}`, 400);
    }

    const isAuthorized = await checkClassTeacherOwnership(assignment.classId, userId, userRole);
    if (!isAuthorized) {
      throwError("Bạn không có quyền chấm bài nộp của lớp học này!", 403);
    }

    submission.grade = grade;
    submission.feedback = feedback ? feedback.trim() : "";
    if (aiFeedback !== undefined) submission.aiFeedback = aiFeedback ? aiFeedback.trim() : "";
    submission.gradedBy = userId;
    submission.gradedAt = new Date();
    submission.status = "graded";

    await submission.save({ session });
    await session.commitTransaction();
    return signSubmissionAttachments(submission);
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * 3. Cập nhật bài tập
 */
export const updateAssignmentService = async ({
  id,
  title,
  description,
  submissionMode,
  maxScore,
  questions,
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

  // Kiểm tra số lượng bài nộp thực tế nếu có thay đổi submissionMode hoặc questions
  if (submissionMode) {
    const submissionCount = await assignmentRepo.countActualSubmissionsByAssignment(id);
    if (submissionCount > 0 && submissionMode !== assignment.submissionMode) {
      throwError(
        "Bài tập đã có sinh viên nộp bài. Không thể thay đổi hình thức nộp bài!",
        400
      );
    }
  }

  let newAttachments = assignment.attachments || [];
  const uploaded = await uploadFiles(files);
  if (uploaded.length > 0) {
    newAttachments = [...newAttachments, ...uploaded];
  }

  if (title) assignment.title = title.trim();
  if (description !== undefined) assignment.description = description ? description.trim() : "";
  if (deadline) assignment.deadline = deadline;
  if (lessonId !== undefined) assignment.lessonId = lessonId;
  if (maxScore !== undefined) assignment.maxScore = Number(maxScore) || 10;
  assignment.attachments = newAttachments;

  if (submissionMode && submissionCount === 0) {
    if (["file", "link", "direct", "any"].includes(submissionMode)) {
      assignment.submissionMode = submissionMode;
    }
  }

  if (questions !== undefined) {
    const rawQuestions = typeof questions === "string" ? JSON.parse(questions) : questions;
    if (Array.isArray(rawQuestions)) {
      assignment.questions = rawQuestions.map((q, idx) => ({
        _id: q._id || new mongoose.Types.ObjectId(),
        order: Number(q.order) || idx + 1,
        content: sanitizeRichText(q.content || ""),
        required: q.required !== false,
      }));
    }
  }

  await assignment.save();
  return signAssignmentAttachments(assignment);
};

/**
 * 4. Xóa bài tập
 */
export const deleteAssignmentService = async ({ id, userId, userRole }) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throwError("ID bài tập không hợp lệ!", 400);
  }

  const assignment = await assignmentRepo.findAssignmentById(id);
  if (!assignment) {
    throwError("Bài tập không tồn tại", 404);
  }

  await assignmentRepo.softDeleteAssignment(id, userId);
};

/**
 * 5. Lấy chi tiết 1 bài tập
 */
export const getAssignmentByIdService = async (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throwError("ID bài tập không hợp lệ!", 400, ErrorCode.INVALID_ID);
  }

  const assignment = await assignmentRepo.findAssignmentByIdPopulated(id);
  if (!assignment) {
    throwError("Bài tập không tồn tại", 404);
  }
  return signAssignmentAttachments(assignment);
};

/**
 * 6. Lấy danh sách bài tập theo lớp
 */
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

  const assignmentsWithGradedStatus = await Promise.all(
    assignments.map(async (assignment) => {
      const gradedCount = await assignmentRepo.countSubmissionsByAssignmentAndGrade(assignment._id);
      return {
        ...signAssignmentAttachments(assignment),
        hasGradedSubmissions: gradedCount > 0,
      };
    })
  );

  return {
    assignments: assignmentsWithGradedStatus,
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

/**
 * 7. Lấy danh sách bài nộp của bài tập (Chỉ Giáo viên / Admin, loại bỏ bản nháp)
 */
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

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 100);
  const skip = (pageNum - 1) * limitNum;

  const [submissions, total] = await Promise.all([
    assignmentRepo.findSubmissionsByAssignmentPaginated(assignmentId, { skip, limit: limitNum }),
    assignmentRepo.countSubmissionsByAssignment(assignmentId),
  ]);

  return {
    submissions: submissions.map(signSubmissionAttachments),
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  };
};

/**
 * 8. Lấy bài nộp cá nhân của học sinh
 */
export const getMySubmissionService = async ({ assignmentId, studentId }) => {
  if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
    throwError("ID bài tập không hợp lệ!", 400, ErrorCode.INVALID_ID);
  }

  const submission = await assignmentRepo.findSubmissionByAssignmentAndStudent(
    assignmentId,
    studentId
  );
  if (!submission) {
    throwError("Bạn chưa nộp bài tập này.", 404, ErrorCode.SUBMISSION_NOT_FOUND);
  }
  return signSubmissionAttachments(submission);
};

/**
 * 9. Lưu bản nháp (Draft) cho học sinh
 */
export const saveDraftService = async ({
  assignmentId,
  content,
  submissionType,
  linkUrl,
  answers,
  studentId,
}) => {
  if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
    throwError("ID bài tập không hợp lệ!", 400, ErrorCode.INVALID_ID);
  }

  const assignment = await assignmentRepo.findAssignmentById(assignmentId);
  if (!assignment || assignment.isDeleted) {
    throwError("Bài tập không tồn tại hoặc đã bị xóa!", 404, ErrorCode.ASSIGNMENT_NOT_FOUND);
  }

  let submission = await assignmentRepo.findSubmissionByAssignmentAndStudentWithDeleted(
    assignmentId,
    studentId
  );

  // Parse & Sanitize answers
  let parsedAnswers = [];
  if (answers) {
    const rawAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;
    if (Array.isArray(rawAnswers)) {
      parsedAnswers = rawAnswers.map((ans) => ({
        questionId: ans.questionId,
        content: sanitizeRichText(ans.content || ""),
      }));
    }
  }

  const sanitizedContent = content ? sanitizeRichText(content) : "";

  // Nếu bài đã nộp chính thức hoặc đã chấm điểm, không chuyển trạng thái thành draft
  if (submission && submission.status !== "draft" && submission.status !== "withdrawn") {
    return {
      submission: signSubmissionAttachments(submission),
      message: "Bài tập đã được nộp chính thức.",
      savedAt: new Date(),
    };
  }

  if (submission) {
    submission.content = sanitizedContent;
    submission.submissionType = submissionType || assignment.submissionMode || "file";
    submission.linkUrl = linkUrl ? linkUrl.trim() : null;
    submission.answers = parsedAnswers;
    submission.status = "draft";
    submission.isDeleted = false;
    await submission.save();
    return { submission: signSubmissionAttachments(submission), savedAt: new Date() };
  }

  submission = assignmentRepo.createSubmission({
    assignmentId,
    studentId,
    classId: assignment.classId,
    content: sanitizedContent,
    submissionType: submissionType || assignment.submissionMode || "file",
    linkUrl: linkUrl ? linkUrl.trim() : null,
    answers: parsedAnswers,
    status: "draft",
  });

  await submission.save();
  return { submission: signSubmissionAttachments(submission), savedAt: new Date() };
};

/**
 * 10. Học sinh nộp bài hoặc nộp lại bài
 */
export const submitAssignmentService = async ({
  assignmentId,
  content,
  files,
  submissionType,
  linkUrl,
  answers,
  studentId,
}) => {
  let newAttachments = [];
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    if (!assignmentId || !mongoose.Types.ObjectId.isValid(assignmentId)) {
      throwError("ID bài tập không hợp lệ!", 400);
    }

    const assignment = await assignmentRepo.findAssignmentById(assignmentId, { session });
    if (!assignment || assignment.isDeleted) {
      throwError("Bài tập không tồn tại hoặc đã bị xóa!", 404, ErrorCode.ASSIGNMENT_NOT_FOUND);
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
      throwError(
        "Bài nộp đã được Giáo viên chấm điểm. Bạn không thể nộp lại bài nữa!",
        409,
        ErrorCode.SUBMISSION_ALREADY_GRADED
      );
    }

    // Chặn nộp bài quá hạn
    if (isLate) {
      throwError(
        "Bài tập đã quá hạn nộp. Hệ thống không nhận bài sau thời hạn giáo viên đặt ra.",
        400,
        ErrorCode.ASSIGNMENT_PAST_DEADLINE
      );
    }

    // Xác định submissionType
    const mode = assignment.submissionMode || "file";
    let actualType = submissionType || "file";
    if (mode !== "any") {
      actualType = mode;
    }

    // Parse & Sanitize answers & content
    let parsedAnswers = [];
    if (answers) {
      const rawAnswers = typeof answers === "string" ? JSON.parse(answers) : answers;
      if (Array.isArray(rawAnswers)) {
        parsedAnswers = rawAnswers.map((ans) => ({
          questionId: ans.questionId,
          content: sanitizeRichText(ans.content || ""),
        }));
      }
    }

    const sanitizedContent = content ? sanitizeRichText(content) : "";

    // Validate theo mode
    if (actualType === "link") {
      if (!linkUrl || !/^https?:\/\/.+/i.test(linkUrl.trim())) {
        throwError("Vui lòng cung cấp đường dẫn liên kết hợp lệ (bắt đầu bằng http:// hoặc https://)!", 400);
      }
    } else if (actualType === "direct") {
      if (assignment.questions && assignment.questions.length > 0) {
        for (const q of assignment.questions) {
          if (q.required) {
            const studentAns = parsedAnswers.find(
              (a) => a.questionId?.toString() === q._id?.toString()
            );
            if (!studentAns || !studentAns.content || !studentAns.content.trim() || studentAns.content === "<p></p>") {
              throwError(`Vui lòng hoàn thành câu hỏi bắt buộc (Câu ${q.order})!`, 400);
            }
          }
        }
      } else {
        if (!sanitizedContent || !sanitizedContent.trim() || sanitizedContent === "<p></p>") {
          throwError("Vui lòng nhập nội dung bài làm trước khi nộp!", 400);
        }
      }
    }

    newAttachments = await uploadFiles(files);

    const isResubmitting = submission && submission.status !== "draft" && submission.status !== "withdrawn";
    const status = isResubmitting ? "resubmitted" : "submitted";

    if (submission) {
      const oldAttachments = submission.attachments;

      submission.content = sanitizedContent;
      submission.submissionType = actualType;
      submission.linkUrl = actualType === "link" ? linkUrl.trim() : null;
      submission.answers = parsedAnswers;
      if (newAttachments.length > 0) submission.attachments = newAttachments;
      submission.status = status;
      submission.resubmittedAt = isResubmitting ? now : submission.resubmittedAt;
      submission.isDeleted = false;
      submission.grade = null;
      submission.feedback = "";
      submission.gradedAt = null;

      await submission.save({ session });
      await session.commitTransaction();

      if (newAttachments.length > 0 && oldAttachments && oldAttachments.length > 0) {
        const deletePromises = oldAttachments
          .filter((file) => file && file.publicId)
          .map((file) =>
            storageService
              .deleteFile(file.publicId, {
                resourceType: file.resourceType || "raw",
                storageType: file.publicId?.includes("doc_") ? "authenticated" : "upload",
              })
              .catch(() => null)
          );
        Promise.all(deletePromises).catch(() => null);
      }

      return { submission: signSubmissionAttachments(submission), isNew: false };
    }

    console.log("DEBUG: assignment before createSubmission:", assignment);
    console.log("DEBUG: is assignment undefined?", typeof assignment === 'undefined');
    
    submission = assignmentRepo.createSubmission({
      assignmentId,
      studentId,
      classId: assignment.classId,
      content: sanitizedContent,
      submissionType: actualType,
      linkUrl: actualType === "link" ? linkUrl.trim() : null,
      answers: parsedAnswers,
      attachments: newAttachments,
      status,
    });

    await submission.save({ session });
    await session.commitTransaction();
    return { submission: signSubmissionAttachments(submission), isNew: true };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (newAttachments.length > 0) {
      const rollbackPromises = newAttachments
        .filter((file) => file && file.publicId)
        .map((file) =>
          storageService
            .deleteFile(file.publicId, {
              resourceType: file.resourceType || "raw",
              storageType: "authenticated",
            })
            .catch(() => null)
        );
      await Promise.all(rollbackPromises);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * 11. Hủy nộp bài
 */
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
    throwError(
      "Bài nộp đã được Giáo viên chấm điểm. Bạn không thể hủy bài nộp!",
      409,
      ErrorCode.SUBMISSION_ALREADY_GRADED
    );
  }

  if (submission.attachments && submission.attachments.length > 0) {
    const deletePromises = submission.attachments
      .filter((file) => file && file.publicId)
      .map((file) =>
        storageService
          .deleteFile(file.publicId, {
            resourceType: file.resourceType || "raw",
            storageType: file.publicId?.includes("doc_") ? "authenticated" : "upload",
          })
          .catch(() => null)
      );
    await Promise.all(deletePromises);
  }

  submission.status = "withdrawn";
  submission.withdrawnAt = now;
  submission.attachments = [];
  submission.content = "";
  submission.answers = [];
  submission.linkUrl = null;
  await submission.save();

  return signSubmissionAttachments(submission);
};
