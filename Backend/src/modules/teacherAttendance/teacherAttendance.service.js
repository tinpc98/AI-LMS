import mongoose from "mongoose";
import TeacherAttendance from "./teacherAttendance.model.js";
import ClassSession from "../classSession/classSession.model.js";

class TeacherAttendanceService {
  /**
   * Retrieves teacher attendance records for a specific teacher.
   */
  async getMyAttendance(teacherId, queryOptions = {}) {
    const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const filter = { teacherId, isDeleted: false };
    if (queryOptions.status) {
      filter.status = queryOptions.status;
    }
    if (queryOptions.classId) {
      filter.classId = queryOptions.classId;
    }

    const [items, totalItems] = await Promise.all([
      TeacherAttendance.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("sessionId", "title sessionNumber scheduledStartAt scheduledEndAt status onlineMeeting")
        .populate("classId", "name code mode")
        .lean(),
      TeacherAttendance.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Retrieves all teacher attendance records (Admin only).
   */
  async getAllAttendance(queryOptions = {}) {
    const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const filter = { isDeleted: false };
    if (queryOptions.status) {
      filter.status = queryOptions.status;
    }
    if (queryOptions.teacherId) {
      filter.teacherId = queryOptions.teacherId;
    }
    if (queryOptions.classId) {
      filter.classId = queryOptions.classId;
    }

    const [items, totalItems] = await Promise.all([
      TeacherAttendance.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("teacherId", "fullName name email")
        .populate("sessionId", "title sessionNumber scheduledStartAt scheduledEndAt status")
        .populate("classId", "name code")
        .lean(),
      TeacherAttendance.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Teacher confirms their own attendance after a session.
   */
  async confirmAttendance(attendanceId, teacherId) {
    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      throw new Error("ID điểm danh không hợp lệ");
    }

    const attendance = await TeacherAttendance.findOne({ _id: attendanceId, isDeleted: false }).populate("sessionId");
    if (!attendance) {
      throw new Error("Không tìm thấy dữ liệu điểm danh");
    }

    if (attendance.teacherId.toString() !== teacherId.toString()) {
      throw new Error("Bạn không có quyền xác nhận điểm danh của giáo viên khác");
    }

    if (attendance.lockedAt && new Date() > attendance.lockedAt) {
      throw new Error("Bản ghi này đã bị khóa, không thể xác nhận");
    }

    if (attendance.status === "CONFIRMED") {
      throw new Error("Điểm danh này đã được xác nhận");
    }

    const session = attendance.sessionId;
    if (!session || session.status === "CANCELLED") {
      throw new Error("Buổi học đã bị hủy hoặc không tồn tại, không thể xác nhận điểm danh");
    }

    if (session.status !== "COMPLETED") {
      throw new Error("Chỉ có thể xác nhận sau khi buổi học kết thúc (COMPLETED)");
    }

    // 24H Lock validation
    const sessionEndTime = session.actualEndAt || session.scheduledEndAt;
    const now = new Date();
    const hoursDiff = (now.getTime() - sessionEndTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      // Auto lock if over 24 hours
      attendance.lockedAt = now;
      await attendance.save();
      throw new Error("Đã quá 24h kể từ khi buổi học kết thúc, không thể tự xác nhận (Vui lòng liên hệ Admin)");
    }

    attendance.status = "CONFIRMED";
    attendance.confirmedAt = now;
    attendance.confirmedBy = teacherId;
    
    await attendance.save();
    return attendance;
  }

  /**
   * Admin overrides teacher attendance (e.g., marks absent or confirms late).
   */
  async overrideAttendance(attendanceId, adminId, payload) {
    if (!mongoose.Types.ObjectId.isValid(attendanceId)) {
      throw new Error("ID điểm danh không hợp lệ");
    }

    const attendance = await TeacherAttendance.findById(attendanceId);
    if (!attendance || attendance.isDeleted) {
      throw new Error("Không tìm thấy dữ liệu điểm danh");
    }

    if (!["PENDING", "CONFIRMED", "ABSENT"].includes(payload.status)) {
      throw new Error("Status không hợp lệ");
    }

    if (!payload.note || payload.note.trim() === "") {
      throw new Error("Vui lòng nhập lý do (note) khi override");
    }

    attendance.status = payload.status;
    attendance.note = `[Admin Override]: ${payload.note}`;
    attendance.confirmedAt = new Date();
    attendance.confirmedBy = adminId;
    
    // Optionally unlock it if admin is fixing it
    if (payload.unlock) {
      attendance.lockedAt = null;
    }

    await attendance.save();
    return attendance;
  }
}

export default new TeacherAttendanceService();
