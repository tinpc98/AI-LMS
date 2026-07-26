import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import classModel from "../models/class.model.js";

class AttendanceService {
  // Điểm danh hàng loạt hoặc đơn lẻ cho một lớp học vào 1 ngày
  async markAttendance({ classId, date, records, teacherId }) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const classExists = await classModel.findById(classId);
    if (!classExists) {
      throw new Error("Lớp học không tồn tại!");
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const validRecords = records.filter(
      (record) => record && record.studentId && mongoose.Types.ObjectId.isValid(record.studentId)
    );

    if (validRecords.length === 0) {
      throw new Error("Danh sách điểm danh không chứa ID học sinh hợp lệ!");
    }

    const operations = validRecords.map((record) => ({
      updateOne: {
        filter: {
          classId,
          studentId: record.studentId,
          date: attendanceDate,
        },
        update: {
          $set: {
            teacherId,
            status: record.status || "Present",
            note: record.note || "",
            createdBy: teacherId,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);

    return await Attendance.find({ classId, date: attendanceDate })
      .populate("studentId", "fullName email avatar")
      .populate("teacherId", "fullName email");
  }

  // Cập nhật 1 bản ghi điểm danh
  async updateAttendance(id, { status, note }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error("ID điểm danh không hợp lệ!");
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      throw new Error("Bản ghi điểm danh không tồn tại!");
    }

    if (status) attendance.status = status;
    if (note !== undefined) attendance.note = note;

    return await attendance.save();
  }

  // Lấy danh sách điểm danh theo lớp
  async getAttendanceByClass(classId, date) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return [];
    }

    const query = { classId };
    if (date) {
      const attendanceDate = new Date(date);
      attendanceDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(attendanceDate);
      nextDay.setDate(nextDay.getDate() + 1);

      query.date = { $gte: attendanceDate, $lt: nextDay };
    }

    return await Attendance.find(query)
      .populate("studentId", "fullName email avatar")
      .sort({ date: -1 });
  }

  // Lấy lịch sử điểm danh của học sinh
  async getAttendanceByStudent(studentId, classId) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return [];
    }

    const query = { studentId };
    if (classId && mongoose.Types.ObjectId.isValid(classId)) {
      query.classId = classId;
    }

    return await Attendance.find(query)
      .populate("classId", "className classCode")
      .sort({ date: -1 });
  }

  // Thống kê tỷ lệ điểm danh theo lớp
  async getAttendanceStats(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return { total: 0, present: 0, absent: 0, late: 0, excused: 0, presentRate: 0 };
    }

    const records = await Attendance.find({ classId });
    const total = records.length;

    const stats = {
      total,
      present: records.filter((r) => r.status === "Present").length,
      absent: records.filter((r) => r.status === "Absent").length,
      late: records.filter((r) => r.status === "Late").length,
      excused: records.filter((r) => r.status === "Excused").length,
    };

    stats.presentRate = total > 0 ? ((stats.present / total) * 100).toFixed(1) : 0;
    return stats;
  }
}

export default new AttendanceService();
