// File: src/repositories/assignment.repository.js
// Chứa toàn bộ query Mongoose cho Assignment + Submission — không chứa business logic,
// không phụ thuộc req/res. Tách ra từ assignment.controller.js (PR-08).
import Assignment from "../models/assignment.model.js";
import Submission from "../models/submission.model.js";

export const findAssignmentById = (id, { session } = {}) => {
  const query = Assignment.findById(id);
  return session ? query.session(session) : query;
};

export const findAssignmentByIdPopulated = (id) =>
  Assignment.findById(id)
    .populate("teacherId", "fullName email avatar")
    .populate("classId", "className classCode")
    .lean();

export const findAssignmentsByClass = (classId, { skip, limit }) =>
  Assignment.find({ classId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();

export const countAssignmentsByClass = (classId) => Assignment.countDocuments({ classId });

export const createAssignment = (data) => new Assignment(data);

export const softDeleteAssignment = (id, userId) => Assignment.softDelete(id, userId);

export const findSubmissionById = (id, { session } = {}) => {
  const query = Submission.findById(id);
  return session ? query.session(session) : query;
};

export const findSubmissionByAssignmentAndStudent = (assignmentId, studentId) =>
  Submission.findOne({ assignmentId, studentId }).lean();

export const findSubmissionByAssignmentAndStudentWithDeleted = (
  assignmentId,
  studentId,
  { session } = {}
) => {
  const query = Submission.findOne({ assignmentId, studentId }).withDeleted();
  return session ? query.session(session) : query;
};

export const findSubmissionsByAssignmentPaginated = (assignmentId, { skip, limit }) =>
  Submission.find({ assignmentId })
    .populate("studentId", "fullName email avatar")
    .populate("gradedBy", "fullName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

export const countSubmissionsByAssignment = (assignmentId) =>
  Submission.countDocuments({ assignmentId });

export const createSubmission = (data) => new Submission(data);
