import mongoose from "mongoose";
import announcementService from "./announcement.service.js";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import notificationService from "#modules/notification/notification.service.js";
import { Class as classModel } from "#modules/class/index.js";

export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, scope, classId, courseId, attachments } = req.body;
    if (!title || !content) {
      return sendError(res, "Tiêu đề và nội dung thông báo là bắt buộc", 400);
    }

    if (classId && !mongoose.Types.ObjectId.isValid(classId)) {
      return sendError(res, "ID lớp học không hợp lệ!", 400);
    }

    const createdBy = req.user.id || req.user._id;
    const userRole = (req.user.role || "").toLowerCase();

    const result = await announcementService.createAnnouncement({
      title,
      content,
      scope,
      classId,
      courseId,
      attachments,
      createdBy,
      userRole,
    });

    // Tạo notification realtime cho toàn bộ sinh viên trong lớp
    if (scope === "Class" && classId) {
      const classInfo = await classModel.findById(classId).populate("teacherId", "fullName email avatar").lean();
      if (classInfo) {
        const io = req.app.get("io");
        // Không await để không block response
        notificationService.notifyClassAnnouncementCreated({
          announcement: result,
          classInfo: classInfo,
          teacherInfo: classInfo.teacherId,
          io: io,
        }).catch(err => {
          console.error("[AnnouncementController] Lỗi khi tạo notification:", err);
        });
      }
    }

    return sendSuccess(res, "Tạo thông báo thành công", result, null, 201);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi tạo thông báo", 400);
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const { scope, classId, courseId, search, page, limit } = req.query;
    const userId = req.user.id || req.user._id;
    const userRole = (req.user.role || "").toLowerCase();

    const { items, pagination } = await announcementService.getAnnouncements({
      scope,
      classId,
      courseId,
      search,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      userId,
      userRole,
    });

    return sendSuccess(res, "Lấy danh sách thông báo thành công", items, pagination);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy danh sách thông báo", 500);
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Thông báo không tồn tại!", 404);
    }

    const result = await announcementService.getAnnouncementById(id);
    return sendSuccess(res, "Lấy chi tiết thông báo thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi lấy chi tiết thông báo", 404);
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Thông báo không tồn tại!", 404);
    }

    const userId = req.user.id || req.user._id;
    const userRole = (req.user.role || "").toLowerCase();

    const result = await announcementService.updateAnnouncement(id, req.body, userId, userRole);
    return sendSuccess(res, "Cập nhật thông báo thành công", result);
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi cập nhật thông báo", error.status || 500);
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, "Thông báo không tồn tại!", 404);
    }

    const userId = req.user.id || req.user._id;
    const userRole = (req.user.role || "").toLowerCase();

    await announcementService.deleteAnnouncement(id, userId, userRole);
    return sendSuccess(res, "Xóa thông báo thành công");
  } catch (error) {
    return sendError(res, error.message || "Lỗi khi xóa thông báo", error.status || 500);
  }
};
