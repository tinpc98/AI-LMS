// Quản lý Topic — TÍNH NĂNG MỚI theo đặc tả nghiệp vụ mục 2 (EduSpace-Dac-ta-nghiep-vu).
//
// Phạm vi MVP đã chốt: CRUD Topic, sắp thứ tự kéo thả, chặn xóa (BR-2.1..BR-2.5, BR-2.9).
// CỐ Ý CHƯA làm: sequential_mode / mở khóa Topic tuần tự (BR-2.6..BR-2.8) và Course Template —
// đặc tả đánh dấu "Hoãn", để dành giai đoạn sau.
import mongoose from "mongoose";
import Topic from "./topic.model.js";
import { Course } from "#modules/course";
import { Lesson } from "#modules/lesson";
import { Assignment } from "#modules/assignment";
import { Exam } from "#modules/exam";
import { Question } from "#modules/question";
// LƯU Ý: import THẲNG model thay vì qua barrel #modules/performance — barrel đó re-export
// performance.service.js, mà performance.service.js lại import Topic, tạo vòng phụ thuộc
// thật (topic -> performance -> topic), bị chặn bởi rule no-circular (severity error) của
// dependency-cruiser. Model thuần không kéo theo service nên phá vòng này an toàn.
import StudentPerformance from "../performance/studentPerformance.model.js";
import Weakness from "../performance/weakness.model.js";
import PerformanceEvidence from "../performance/performanceEvidence.model.js";
import { NotFoundError, BusinessRuleError, AuthorizationError } from "#shared/utils/appError.js";

/**
 * Giáo viên chủ nhiệm khóa học (Course.createdBy) hoặc Admin mới được thao tác Topic của
 * khóa đó — cùng một chuỗi kiểm tra Topic -> Course -> createdBy đã bị lặp lại 3 nơi khác
 * nhau trước đây (lesson.controller.js, assignment.controller.js, assignment.service.js).
 */
export const checkTopicOwnership = async (courseIdOrTopic, userId, role) => {
  if ((role || "").toLowerCase() === "admin") return true;

  let courseId = courseIdOrTopic;
  if (courseIdOrTopic && typeof courseIdOrTopic === "object") {
    courseId = courseIdOrTopic.courseId;
  }
  if (!courseId) return false;

  const course = await Course.findById(courseId).select("createdBy").lean();
  if (!course) return false;

  return course.createdBy.toString() === userId.toString();
};

const assertCourseOwnership = async (courseId, userId, role) => {
  const course = await Course.findById(courseId);
  if (!course) throw new NotFoundError("Không tìm thấy khóa học.");
  if ((role || "").toLowerCase() !== "admin" && course.createdBy.toString() !== userId.toString()) {
    throw new AuthorizationError("Bạn không có quyền quản lý Topic của khóa học này.");
  }
  return course;
};

const getTopicOr404 = async (topicId) => {
  if (!mongoose.Types.ObjectId.isValid(topicId)) {
    throw new NotFoundError("ID Topic không hợp lệ.");
  }
  const topic = await Topic.findById(topicId);
  if (!topic) throw new NotFoundError("Không tìm thấy Topic.");
  return topic;
};

export const createTopicService = async ({ courseId, name, description }, userId, role) => {
  await assertCourseOwnership(courseId, userId, role);

  // order mặc định = xếp sau cùng trong khóa học hiện tại (BR-2.9: đổi thứ tự sau này không
  // ảnh hưởng tới order lúc tạo).
  const count = await Topic.countDocuments({ courseId });

  const topic = await Topic.create({
    name,
    description: description || "",
    courseId,
    order: count,
    status: "DRAFT",
    createdBy: userId,
  });
  return topic;
};

/**
 * Danh sách Topic của 1 khóa học, sắp theo order.
 * Học sinh (includeArchived=false) không thấy Topic ARCHIVED (BR-2.4: ARCHIVED ẩn với học sinh).
 */
export const getTopicsByCourseService = async (courseId, { includeArchived = false } = {}) => {
  const query = { courseId };
  if (!includeArchived) {
    query.status = { $ne: "ARCHIVED" };
  }
  return Topic.find(query).sort({ order: 1 }).lean();
};

export const getTopicByIdService = async (topicId) => {
  return getTopicOr404(topicId);
};

export const updateTopicService = async (topicId, { name, description }, userId, role) => {
  const topic = await getTopicOr404(topicId);
  await assertCourseOwnership(topic.courseId, userId, role);

  if (name !== undefined) topic.name = name;
  if (description !== undefined) topic.description = description;
  topic.updatedBy = userId;
  await topic.save();
  return topic;
};

export const publishTopicService = async (topicId, userId, role) => {
  const topic = await getTopicOr404(topicId);
  await assertCourseOwnership(topic.courseId, userId, role);

  if (topic.status !== "DRAFT") {
    throw new BusinessRuleError(
      `Chỉ Topic đang DRAFT mới publish được (hiện tại: ${topic.status}).`
    );
  }
  topic.status = "PUBLISHED";
  topic.updatedBy = userId;
  await topic.save();
  return topic;
};

export const archiveTopicService = async (topicId, userId, role) => {
  const topic = await getTopicOr404(topicId);
  await assertCourseOwnership(topic.courseId, userId, role);

  if (topic.status === "ARCHIVED") {
    throw new BusinessRuleError("Topic đã ở trạng thái ARCHIVED.");
  }
  topic.status = "ARCHIVED";
  topic.updatedBy = userId;
  await topic.save();
  return topic;
};

/**
 * Sắp lại thứ tự Topic trong 1 khóa học (kéo thả) — nhận danh sách topicId theo thứ tự mới,
 * ghi order = vị trí trong mảng. BR-2.9: chỉ đổi order, không đụng trạng thái hoàn thành nào.
 */
export const reorderTopicsService = async (courseId, orderedTopicIds, userId, role) => {
  await assertCourseOwnership(courseId, userId, role);

  const topics = await Topic.find({ courseId }).select("_id").lean();
  const validIds = new Set(topics.map((t) => t._id.toString()));

  if (
    orderedTopicIds.length !== validIds.size ||
    !orderedTopicIds.every((id) => validIds.has(id.toString()))
  ) {
    throw new BusinessRuleError("Danh sách thứ tự không khớp với các Topic hiện có của khóa học.");
  }

  await Promise.all(
    orderedTopicIds.map((id, index) => Topic.updateOne({ _id: id }, { order: index }))
  );

  return getTopicsByCourseService(courseId, { includeArchived: true });
};

/**
 * Xóa Topic — BR-2.2/BR-2.3: chặn xóa nếu còn item (Lesson/Assignment/Exam/Question) đang
 * hoạt động; chặn xóa (chỉ cho archive) nếu đã có dữ liệu học sinh (StudentPerformance/
 * Weakness/PerformanceEvidence) dù item đã bị xóa hết — dữ liệu điểm/tiến độ phải giữ nguyên
 * lịch sử, không được để mồ côi khi Topic biến mất khỏi DB.
 */
export const deleteTopicService = async (topicId, userId, role) => {
  const topic = await getTopicOr404(topicId);
  await assertCourseOwnership(topic.courseId, userId, role);

  const [lessonCount, assignmentCount, examCount, questionCount] = await Promise.all([
    Lesson.countDocuments({ topicId }),
    Assignment.countDocuments({ topicId }),
    Exam.countDocuments({ topicId }),
    Question.countDocuments({ topicId }),
  ]);

  if (lessonCount + assignmentCount + examCount + questionCount > 0) {
    throw new BusinessRuleError(
      "Topic còn chứa bài giảng/bài tập/đề thi/câu hỏi — không thể xóa. Hãy chuyển hoặc xóa các mục đó trước."
    );
  }

  const [perfCount, weaknessCount, evidenceCount] = await Promise.all([
    StudentPerformance.countDocuments({ topicId }),
    Weakness.countDocuments({ topicId }),
    PerformanceEvidence.countDocuments({ topicId }),
  ]);

  if (perfCount + weaknessCount + evidenceCount > 0) {
    throw new BusinessRuleError(
      "Topic đã phát sinh dữ liệu học tập của học sinh — không thể xóa để giữ toàn vẹn lịch sử điểm/tiến độ. Hãy archive thay vì xóa."
    );
  }

  await topic.softDelete(userId);
  return topic;
};

export default {
  checkTopicOwnership,
  createTopicService,
  getTopicsByCourseService,
  getTopicByIdService,
  updateTopicService,
  publishTopicService,
  archiveTopicService,
  reorderTopicsService,
  deleteTopicService,
};
