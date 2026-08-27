import mongoose from "mongoose";
import Announcement from "./announcement.model.js";
import { Class as classModel } from "#modules/class";
import { ClassEnrollment } from "#modules/classEnrollment";

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

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      query.courseId = courseId;
    }

    const requestedClassId = classId && mongoose.Types.ObjectId.isValid(classId) ? classId : null;

    if (normalizedRole === "admin") {
      if (scope) query.scope = scope;
      if (requestedClassId) query.classId = requestedClassId;
    } else if (normalizedRole === "student" || normalizedRole === "teacher") {
      // BUG ĐÃ SỬA (IDOR): trước đây chỉ tính "lớp của chính người gọi" khi KHÔNG truyền
      // classId — truyền classId bất kỳ qua query string sẽ bỏ qua hoàn toàn bước kiểm sở
      // hữu, cho phép xem thông báo của lớp bất kỳ. Giờ LUÔN tính trước tập lớp thật của
      // người gọi, rồi giao (intersect) với classId được yêu cầu thay vì tin thẳng client.
      let myClassIds;
      if (normalizedRole === "student") {
        const myEnrollments = await ClassEnrollment.find({ studentId: userId, status: "ACTIVE" })
          .select("classId")
          .lean();
        myClassIds = myEnrollments.map((e) => e.classId);
      } else {
        const myClasses = await classModel.find({ teacherId: userId }).select("_id").lean();
        myClassIds = myClasses.map((c) => c._id);
      }

      if (requestedClassId) {
        const isOwnClass = myClassIds.some((id) => String(id) === String(requestedClassId));
        if (isOwnClass) {
          query.classId = requestedClassId;
          query.scope = "Class";
        } else {
          // Không thuộc lớp này — trả về rỗng thay vì lộ dữ liệu (sentinel ObjectId không
          // khớp bất kỳ document thật nào, an toàn hơn báo lỗi tiết lộ lớp có tồn tại hay không).
          query._id = new mongoose.Types.ObjectId();
        }
      } else {
        const orConditions = [
          { scope: "System" },
          { scope: "Class", classId: { $in: myClassIds } },
        ];
        if (normalizedRole === "teacher") orConditions.push({ createdBy: userId });
        query.$or = orConditions;
        if (scope) query.scope = scope;
      }
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

  // BUG ĐÃ SỬA: trước đây hàm này KHÔNG kiểm quyền gì cả — bất kỳ ai đăng nhập biết/đoán được
  // ID (dễ lộ từ chính response của getAnnouncements ở lớp khác) đều xem được nội dung thông
  // báo riêng của lớp mình không thuộc về. Giờ nhận thêm userId/userRole, áp lại đúng quy tắc
  // phạm vi như getAnnouncements.
  async getAnnouncementById(id, userId, userRole) {
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

    const normalizedRole = (userRole || "").toLowerCase();
    if (normalizedRole !== "admin" && announcement.scope === "Class") {
      const classIdOfAnnouncement = announcement.classId?._id || announcement.classId;
      let allowed = false;
      if (normalizedRole === "student") {
        allowed = !!(await ClassEnrollment.exists({
          studentId: userId,
          classId: classIdOfAnnouncement,
          status: "ACTIVE",
        }));
      } else if (normalizedRole === "teacher") {
        allowed =
          String(announcement.createdBy?._id || announcement.createdBy) === String(userId) ||
          !!(await classModel.exists({ _id: classIdOfAnnouncement, teacherId: userId }));
      }
      if (!allowed) {
        const error = new Error("Bạn không có quyền xem thông báo này!");
        error.status = 403;
        throw error;
      }
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

    // BUG ĐÃ SỬA: trước đây scope/classId được ghi thẳng không kiểm lại gì — giáo viên sở hữu
    // 1 thông báo hợp lệ (lớp mình dạy) có thể tự sửa thành scope:"System" (broadcast toàn hệ
    // thống) hoặc đổi classId sang lớp mình KHÔNG dạy, vượt hẳn quyền hạn đã kiểm ở
    // createAnnouncement. Re-check y hệt logic tạo mới bất cứ khi nào scope/classId thay đổi.
    const nextScope = scope !== undefined ? scope : announcement.scope;
    const nextClassId = classId !== undefined ? classId : announcement.classId;
    if (scope !== undefined || classId !== undefined) {
      if (nextScope === "System" && normalizedRole !== "admin") {
        const error = new Error(
          "Chỉ Quản trị viên (Admin) mới có quyền tạo thông báo toàn hệ thống!"
        );
        error.status = 403;
        throw error;
      }
      if (nextScope === "Class" && nextClassId) {
        if (!mongoose.Types.ObjectId.isValid(nextClassId)) {
          const error = new Error("Lớp học không tồn tại!");
          error.status = 400;
          throw error;
        }
        const classExists = await classModel.findById(nextClassId);
        if (!classExists) {
          const error = new Error("Lớp học không tồn tại!");
          error.status = 404;
          throw error;
        }
        if (
          normalizedRole === "teacher" &&
          classExists.teacherId?.toString() !== userId.toString()
        ) {
          const error = new Error("Bạn chỉ có thể đăng thông báo cho các lớp được phân công!");
          error.status = 403;
          throw error;
        }
      }
    }

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
