import { asyncHandler } from "#shared/utils/asyncHandler.js";
import * as topicService from "./topic.service.js";

export const createTopic = asyncHandler(async (req, res) => {
  const { courseId, name, description } = req.body;
  const userId = req.user.id || req.user._id;

  if (!courseId || !name) {
    return res.status(400).json({ success: false, message: "Thiếu courseId hoặc name" });
  }

  const topic = await topicService.createTopicService(
    { courseId, name, description },
    userId,
    req.user?.role
  );
  return res.status(201).json({ success: true, message: "Tạo Topic thành công", data: topic });
});

export const getTopicsByCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const role = (req.user?.role || "").toLowerCase();
  // Chỉ giáo viên/admin mới xem được cả Topic ARCHIVED — học sinh luôn thấy danh sách đã lọc
  // (BR-2.4), bất kể có truyền query includeArchived hay không.
  const includeArchived =
    (role === "teacher" || role === "admin") && req.query.includeArchived === "true";

  const topics = await topicService.getTopicsByCourseService(courseId, { includeArchived });
  return res.status(200).json({ success: true, data: topics });
});

export const getTopicById = asyncHandler(async (req, res) => {
  const topic = await topicService.getTopicByIdService(req.params.id);
  return res.status(200).json({ success: true, data: topic });
});

export const updateTopic = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user.id || req.user._id;

  const topic = await topicService.updateTopicService(
    req.params.id,
    { name, description },
    userId,
    req.user?.role
  );
  return res.status(200).json({ success: true, message: "Cập nhật Topic thành công", data: topic });
});

export const publishTopic = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const topic = await topicService.publishTopicService(req.params.id, userId, req.user?.role);
  return res.status(200).json({ success: true, message: "Đã publish Topic", data: topic });
});

export const archiveTopic = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const topic = await topicService.archiveTopicService(req.params.id, userId, req.user?.role);
  return res.status(200).json({ success: true, message: "Đã archive Topic", data: topic });
});

export const reorderTopics = asyncHandler(async (req, res) => {
  const { courseId, orderedTopicIds } = req.body;
  const userId = req.user.id || req.user._id;

  if (!courseId || !Array.isArray(orderedTopicIds)) {
    return res.status(400).json({ success: false, message: "Thiếu courseId hoặc orderedTopicIds" });
  }

  const topics = await topicService.reorderTopicsService(
    courseId,
    orderedTopicIds,
    userId,
    req.user?.role
  );
  return res.status(200).json({ success: true, message: "Đã cập nhật thứ tự", data: topics });
});

export const deleteTopic = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user._id;
  await topicService.deleteTopicService(req.params.id, userId, req.user?.role);
  return res.status(200).json({ success: true, message: "Đã xóa Topic" });
});
