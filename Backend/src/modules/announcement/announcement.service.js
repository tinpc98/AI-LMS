import mongoose from "mongoose";
import Announcement from "./announcement.model.js";
import { Class as classModel } from "#modules/class";

class AnnouncementService {
  async createAnnouncement({
    title,
    content,
    scope,
    classId,
    courseId,
    attachments,
    createdBy,
    userRole,
  }) {
    const normalizedRole = (userRole || "").toLowerCase();

    if (scope === "Class" && classId) {
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        throw new Error("Lớp học không tồn tại!");
      }
      const classExists = await classModel.findById(classId);
      if (!classExists) {
        throw new Error("Lớp học không tồn tại!");
      }
      if (
        normalizedRole === "teacher" &&
        classExists.teacherId?.toString() !== createdBy.toString()
      ) {
        throw new Error("Bạn chỉ có thể đăng thông báo cho các lớp được phân công!");
      }
    }

    if (scope === "System" && normalizedRole !== "admin") {
      throw new Error("Chỉ Quản trị viên (Admin) mới có quyền tạo thông báo toàn hệ thống!");
    }

    const announcement = new Announcement({
      title,
      content,
      scope: scope || "Class",
      classId: scope === "Class" ? classId : null,
      courseId: scope === "Course" ? courseId : null,
      attachments: attachments || [],
      createdBy,
    });

    return await announcement.save();
  }

  async getAnnouncements({
    scope,
    classId,
    courseId,
    search,
    page = 1,
    limit = 10,
    userId,
    userRole,
  }) {
    const query = {};
    const normalizedRole = (userRole || "").toLowerCase();

    if (scope) {
      query.scope = scope;
    }

    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.classId = classId;
    }

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      query.courseId = courseId;
    }

    if (normalizedRole === "student" && !classId) {
      const myClasses = await classModel
        .find({ "students.studentId": userId })
        .select("_id")
        .lean();
      const classIds = myClasses.map((c) => c._id);
      query.$or = [{ scope: "System" }, { scope: "Class", classId: { $in: classIds } }];
    } else if (normalizedRole === "teacher" && !classId && !scope) {
      const myClasses = await classModel.find({ teacherId: userId }).select("_id").lean();
      const classIds = myClasses.map((c) => c._id);
      query.$or = [
        { scope: "System" },
        { scope: "Class", classId: { $in: classIds } },
        { createdBy: userId },
      ];
    }

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Announcement.find(query)
        .populate("createdBy", "fullName email avatar role")
        .populate("classId", "className classCode")
        .populate("courseId", "courseName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAnnouncementById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("Thông báo không tồn tại!");
    }

    const announcement = await Announcement.findById(id)
      .populate("createdBy", "fullName email avatar role")
      .populate("classId", "className classCode")
      .populate("courseId", "courseName")
      .lean();

    if (!announcement) {
      throw new Error("Thông báo không tồn tại!");
    }
    return announcement;
  }

  async updateAnnouncement(id, updateData, userId, userRole) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Thông báo không tồn tại!");
      error.status = 404;
      throw error;
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      const error = new Error("Thông báo không tồn tại!");
      error.status = 404;
      throw error;
    }

    const normalizedRole = (userRole || "").toLowerCase();
    if (normalizedRole !== "admin" && announcement.createdBy?.toString() !== userId.toString()) {
      const error = new Error("Bạn không có quyền chỉnh sửa thông báo này!");
      error.status = 403;
      throw error;
    }

    // Whitelist rõ ràng: tránh Object.assign(announcement, updateData) ghi đè createdBy/isDeleted.
    const { title, content, scope, classId, courseId, attachments } = updateData;
    if (title !== undefined) announcement.title = title;
    if (content !== undefined) announcement.content = content;
    if (scope !== undefined) announcement.scope = scope;
    if (classId !== undefined) announcement.classId = classId;
    if (courseId !== undefined) announcement.courseId = courseId;
    if (attachments !== undefined) announcement.attachments = attachments;

    return await announcement.save();
  }

  async deleteAnnouncement(id, userId, userRole) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("Thông báo không tồn tại!");
      error.status = 404;
      throw error;
    }

    const announcement = await Announcement.findById(id);
    if (!announcement) {
      const error = new Error("Thông báo không tồn tại!");
      error.status = 404;
      throw error;
    }

    const normalizedRole = (userRole || "").toLowerCase();
    if (normalizedRole !== "admin" && announcement.createdBy?.toString() !== userId.toString()) {
      const error = new Error("Bạn không có quyền xóa thông báo này!");
      error.status = 403;
      throw error;
    }

    await announcement.softDelete(userId);
    return true;
  }
}

export default new AnnouncementService();
