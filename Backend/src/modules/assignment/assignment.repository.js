import Assignment from "./assignment.model.js";
import AssignmentAttempt from "./assignmentAttempt.model.js";

// === ASSIGNMENT ===
export const findAssignmentById = (id, { session } = {}) => {
  const query = Assignment.findById(id).populate("questions.questionId");
  return session ? query.session(session) : query;
};

export const findAssignmentsByTopic = (topicId, status) => {
  const filter = { topicId };
  if (status) filter.status = status;
  return Assignment.find(filter).sort({ createdAt: -1 }).lean();
};

// Assignment thuộc topicId (không thuộc classId trực tiếp) — caller phải tự resolve danh
// sách assignmentId của một lớp trước (vd qua resolveClassContentIds ở #modules/class).
export const findAssignmentsByIds = (assignmentIds, status) => {
  if (!assignmentIds || assignmentIds.length === 0) return Promise.resolve([]);
  const filter = { _id: { $in: assignmentIds } };
  if (status) filter.status = status;
  return Assignment.find(filter)
    .select("title description status topicId createdAt")
    .sort({ createdAt: -1 })
    .lean();
};

export const createAssignment = (data) => new Assignment(data);

export const softDeleteAssignment = (id, userId) => Assignment.softDelete(id, userId);

// === ATTEMPT ===
export const findAttemptById = (id, { session } = {}) => {
  const query = AssignmentAttempt.findById(id);
  return session ? query.session(session) : query;
};

export const findAttemptsByStudentAndAssignment = (studentId, assignmentId) =>
  AssignmentAttempt.find({ studentId, assignmentId }).sort({ attemptNumber: -1 }).lean();

export const countAttempts = (studentId, assignmentId) =>
  AssignmentAttempt.countDocuments({ studentId, assignmentId });

export const findInProgressAttempt = (studentId, assignmentId) =>
  AssignmentAttempt.findOne({ studentId, assignmentId, status: "IN_PROGRESS" });

export const createAttempt = (data) => new AssignmentAttempt(data);
