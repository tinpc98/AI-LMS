import Announcement from "../models/announcement.model.js";
import classModel from "../models/class.model.js";

class AnnouncementService {
  async createAnnouncement({ title, content, scope, classId, courseId, attachments, createdBy, userRole }) {
    if (scope === "Class" && classId) {
      const classExists = await classModel.findById(classId);
      if (!classExists) {
        throw new Error("Lớp học không tồn tại!");
      }
      if (userRole === "Teacher" && classExists.teacherId?.toString() !== createdBy) {
        throw new Error("Bạn chỉ có thể đăng thông báo cho các lớp được phân công!");
      }
    }

    if (scope === "System" && userRole !== "Admin") {
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

  async getAnnouncements({ scope, classId, courseId, search, page = 1, limit = 10, userId, userRole }) {
    const query = {};

    if (scope) {
      query.scope = scope;
    }

    if (classId) {
      query.classId = classId;
    }

    if (courseId) {
      query.courseId = courseId;
    }

    // Nếu người dùng là Học sinh/Giáo viên và không chỉ định classId, chỉ lấy các thông báo phù hợp
    if (userRole === "Student" && !classId) {
      const myClasses = await classModel.find({ "students.studentId": userId }).select("_id");
      const classIds = myClasses.map((c) => c._id);
      query.$or = [{ scope: "System" }, { scope: "Class", classId: { $in: classIds } }];
    } else if (userRole === "Teacher" && !classId && !scope) {
      const myClasses = await classModel.find({ teacherId: userId }).select("_id");
      const classIds = myClasses.map((c) => c._id);
      query.$or = [{ scope: "System" }, { scope: "Class", classId: { $in: classIds } }, { createdBy: userId }];
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
        .limit(limit),
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
    const announcement = await Announcement.findById(id)
      .populate("createdBy", "fullName email avatar role")
      .populate("classId", "className classCode")
      .populate("courseId", "courseName");

    if (!announcement) {
      throw new Error("Thông báo không tồn tại!");
    }
    return announcement;
  }

  async updateAnnouncement(id, updateData, userId, userRole) {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new Error("Thông báo không tồn tại!");
    }

    if (userRole !== "Admin" && announcement.createdBy.toString() !== userId) {
      throw new Error("Bạn không có quyền chỉnh sửa thông báo này!");
    }

    Object.assign(announcement, updateData);
    return await announcement.save();
  }

  async deleteAnnouncement(id, userId, userRole) {
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      throw new Error("Thông báo không tồn tại!");
    }

    if (userRole !== "Admin" && announcement.createdBy.toString() !== userId) {
      throw new Error("Bạn không có quyền xóa thông báo này!");
    }

    await announcement.deleteOne();
    return true;
  }
}

export default new AnnouncementService();
