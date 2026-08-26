import mongoose from "mongoose";
import Attendance from "./attendance.model.js";
import { Class as classModel } from "#modules/class/index.js";
import { ClassEnrollment } from "#modules/classEnrollment/index.js";
import ClassSession from "../classSession/classSession.model.js";

class AttendanceService {
  async getClassSessions(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const sessions = await ClassSession.find({ classId, isDeleted: false })
      .sort({ scheduledStartAt: 1 })
      .lean();

    const attendanceRecords = await Attendance.find({ classId }).lean();

    return sessions.map((session) => {
      const records = attendanceRecords.filter(
        (r) => r.sessionId?.toString() === session._id.toString()
      );
      const hasRecords = records.length > 0;

      const presentCount = records.filter((r) => r.status === "PRESENT").length;
      const absentCount = records.filter((r) => r.status === "ABSENT").length;
      const lateCount = records.filter((r) => r.status === "LATE").length;
      const excusedCount = records.filter((r) => r.status === "EXCUSED").length;

      return {
        id: session._id,
        classId: session.classId,
        date: session.scheduledStartAt.toISOString().split("T")[0],
        startTime: session.scheduledStartAt,
        endTime: session.scheduledEndAt,
        status: session.status,
        sessionNumber: session.sessionNumber,
        title: session.title,
        hasRecords,
        stats: {
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          excused: excusedCount,
          total: records.length,
        },
      };
    });
  }

  // Lấy dữ liệu ma trận điểm danh (History Matrix)
  async getAttendanceMatrix(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const classData = await classModel.findById(classId).lean();

    if (!classData) {
      throw new Error("Lớp học không tồn tại!");
    }

    const sessions = await this.getClassSessions(classId);
    const sessionMap = {};
    sessions.forEach((s) => {
      sessionMap[s.id.toString()] = s.date;
    });

    const records = await Attendance.find({ classId }).lean();
    const recordsMap = {};
    records.forEach((r) => {
      const studentId = r.studentId.toString();
      const sessionIdStr = r.sessionId ? r.sessionId.toString() : "";
      const dateStr =
        sessionMap[sessionIdStr] || (r.createdAt ? r.createdAt.toISOString().split("T")[0] : "");

      if (!recordsMap[studentId]) recordsMap[studentId] = {};
      if (dateStr) {
        recordsMap[studentId][dateStr] = r;
      }
    });

    const activeEnrollments = await ClassEnrollment.find({ classId, status: "ACTIVE" })
      .populate("studentId", "fullName email avatar")
      .lean();

    const students = activeEnrollments
      .map((enrollment) => {
        const stu = enrollment.studentId || {};
        return {
          _id: stu._id,
          fullName: stu.fullName || "Học sinh",
          email: stu.email || "",
          avatar: stu.avatar || "",
        };
      })
      .filter((s) => s._id);

    return {
      sessions,
      students,
      records: recordsMap,
    };
  }

  // Điểm danh hàng loạt
  async markAttendance({ sessionId, classId, records, teacherId }) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new Error("ID buổi học (sessionId) không hợp lệ!");
    }

    const session = await ClassSession.findById(sessionId).lean();
    if (!session) {
      throw new Error("Buổi học không tồn tại!");
    }

    const currentServerTime = new Date();

    // Time-Lock: Điểm danh phải được thực hiện trong vòng 24h sau khi session kết thúc
    const maxConfirmTime = new Date(session.scheduledEndAt.getTime() + 24 * 60 * 60 * 1000);
    if (currentServerTime > maxConfirmTime) {
      const error = new Error(
        "Đã quá 24h kể từ khi buổi học kết thúc, không thể thay đổi điểm danh!"
      );
      error.status = 403;
      throw error;
    }

    const validRecords = records.filter(
      (record) => record && record.studentId && mongoose.Types.ObjectId.isValid(record.studentId)
    );

    if (validRecords.length === 0) {
      const error = new Error("Danh sách điểm danh không chứa ID học sinh hợp lệ!");
      error.status = 400;
      throw error;
    }

    // Lấy danh sách studentId thực sự có Enrollment ACTIVE
    const activeEnrollments = await ClassEnrollment.find({
      classId,
      status: "ACTIVE",
    })
      .select("studentId")
      .lean();

    const activeStudentIds = new Set(activeEnrollments.map((e) => e.studentId.toString()));

    const filteredRecords = validRecords.filter((record) =>
      activeStudentIds.has(record.studentId.toString())
    );

    if (filteredRecords.length === 0) {
      const error = new Error(
        "Không có học sinh nào trong danh sách hợp lệ và đang học trong lớp này!"
      );
      error.status = 400;
      throw error;
    }

    const operations = filteredRecords.map((record) => ({
      updateOne: {
        filter: {
          sessionId,
          studentId: record.studentId,
        },
        update: {
          $set: {
            classId,
            status: record.status || "PRESENT",
            note: record.note || "",
            confirmedBy: teacherId,
            confirmedAt: currentServerTime,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(operations);

    return await Attendance.find({ sessionId })
      .populate("studentId", "fullName email avatar")
      .populate("confirmedBy", "fullName email");
  }

  // Xác nhận điểm danh
  async confirmAttendance({ sessionId, teacherId }) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new Error("ID buổi học không hợp lệ!");
    }

    const session = await ClassSession.findById(sessionId).lean();
    if (!session) {
      throw new Error("Buổi học không tồn tại!");
    }

    const currentServerTime = new Date();
    const maxConfirmTime = new Date(session.scheduledEndAt.getTime() + 24 * 60 * 60 * 1000);
    if (currentServerTime > maxConfirmTime) {
      const error = new Error(
        "Đã quá 24h kể từ khi buổi học kết thúc, không thể xác nhận điểm danh!"
      );
      error.status = 403;
      throw error;
    }

    const activeEnrollments = await ClassEnrollment.find({
      classId: session.classId,
      status: "ACTIVE",
    }).lean();

    const activeStudentIds = activeEnrollments.map((e) => e.studentId.toString());

    const existingRecords = await Attendance.find({ sessionId }).lean();
    const existingRecordMap = {};
    existingRecords.forEach((r) => {
      existingRecordMap[r.studentId.toString()] = r;
    });

    const operations = [];

    for (const studentIdStr of activeStudentIds) {
      const record = existingRecordMap[studentIdStr];
      if (!record || record.status === "DRAFT") {
        operations.push({
          updateOne: {
            filter: { sessionId, studentId: new mongoose.Types.ObjectId(studentIdStr) },
            update: {
              $set: {
                classId: session.classId,
                status: "ABSENT",
                confirmedBy: teacherId,
                confirmedAt: currentServerTime,
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (operations.length > 0) {
      await Attendance.bulkWrite(operations);
    }

    return { success: true, message: "Đã xác nhận điểm danh buổi học" };
  }

  // Cập nhật 1 bản ghi điểm danh
  async updateAttendance(id, { status, note }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const error = new Error("ID điểm danh không hợp lệ!");
      error.status = 400;
      throw error;
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      const error = new Error("Bản ghi điểm danh không tồn tại!");
      error.status = 404;
      throw error;
    }

    // BUG ĐÃ SỬA: updateAttendance (route PUT /:id, sửa 1 bản ghi lẻ) không có time-lock, trong
    // khi markAttendance/confirmAttendance đều chặn sau 24h kể từ khi buổi học kết thúc — giáo
    // viên có thể lách khóa 24h bằng cách sửa từng bản ghi thay vì điểm danh hàng loạt. Áp cùng
    // quy tắc time-lock ở đây để nhất quán.
    const session = await ClassSession.findById(attendance.sessionId).lean();
    if (session?.scheduledEndAt) {
      const maxConfirmTime = new Date(session.scheduledEndAt.getTime() + 24 * 60 * 60 * 1000);
      if (new Date() > maxConfirmTime) {
        const error = new Error(
          "Đã quá 24h kể từ khi buổi học kết thúc, không thể thay đổi điểm danh!"
        );
        error.status = 403;
        throw error;
      }
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

      // Find sessions on that date first
      const sessions = await ClassSession.find({
        classId,
        scheduledStartAt: { $gte: attendanceDate, $lt: nextDay },
      })
        .select("_id")
        .lean();

      const sessionIds = sessions.map((s) => s._id);
      query.sessionId = { $in: sessionIds };
    }

    return await Attendance.find(query)
      .populate("studentId", "fullName email avatar")
      .populate("sessionId", "scheduledStartAt title sessionNumber")
      .sort({ createdAt: -1 })
      .lean();
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
      .populate("sessionId", "scheduledStartAt title sessionNumber status")
      .sort({ createdAt: -1 })
      .lean();
  }

  // Thống kê tỷ lệ điểm danh theo lớp
  async getAttendanceStats(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return { total: 0, present: 0, absent: 0, late: 0, excused: 0, presentRate: 0 };
    }

    // BUG ĐÃ SỬA: khi sinh lịch buổi học, hệ thống tạo sẵn bản ghi Attendance status="DRAFT"
    // cho MỌI buổi TƯƠNG LAI của mọi học sinh — trước đây không lọc DRAFT ra khỏi mẫu số, nên
    // lớp mới học vài buổi trong tổng số buổi cả kỳ bị tính tỷ lệ chuyên cần rất thấp dù học
    // sinh có mặt đủ những buổi ĐÃ diễn ra.
    const records = await Attendance.find({ classId, status: { $ne: "DRAFT" } }).lean();
    const total = records.length;

    const stats = {
      total,
      present: records.filter((r) => r.status === "PRESENT").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      excused: records.filter((r) => r.status === "EXCUSED").length,
    };

    stats.presentRate = total > 0 ? ((stats.present / total) * 100).toFixed(1) : 0;
    return stats;
  }
}

export default new AttendanceService();
