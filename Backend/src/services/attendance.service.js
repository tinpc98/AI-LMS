import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";
import classModel from "../models/class.model.js";

const dayNamesMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

class AttendanceService {
  // Sinh danh sách các buổi học ảo dựa trên lịch học của lớp
  async getClassSessions(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }
    const classData = await classModel.findById(classId).lean();
    if (!classData) {
      throw new Error("Lớp học không tồn tại!");
    }

    const { startDate, endDate, schedule } = classData;
    if (!startDate || !endDate || !schedule || !Array.isArray(schedule.days) || schedule.days.length === 0) {
      return [];
    }

    const targetDays = schedule.days.map((d) => dayNamesMap[d]);

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return [];
    }

    const existingRecords = await Attendance.find({ classId }).lean();
    const recordsByDate = {};
    existingRecords.forEach(r => {
      const dateStr = r.date.toISOString().split("T")[0];
      if (!recordsByDate[dateStr]) recordsByDate[dateStr] = [];
      recordsByDate[dateStr].push(r);
    });

    const sessions = [];
    const currentServerTime = new Date();
    
    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const loopEnd = new Date(end);
    loopEnd.setHours(23, 59, 59, 999);

    while (current <= loopEnd) {
      if (targetDays.includes(current.getDay())) {
        const dateStr = current.toISOString().split("T")[0];
        const startTimeStr = schedule.startTime || "00:00";
        const endTimeStr = schedule.endTime || "23:59";
        
        // Parse time assuming local time GMT+7
        const sessionStart = new Date(`${dateStr}T${startTimeStr}:00+07:00`);
        const sessionEnd = new Date(`${dateStr}T${endTimeStr}:00+07:00`);

        let status = "Upcoming";
        const hasRecords = !!recordsByDate[dateStr] && recordsByDate[dateStr].length > 0;
        
        if (currentServerTime > sessionEnd) {
          status = "Closed";
        } else if (currentServerTime >= sessionStart && currentServerTime <= sessionEnd) {
          status = hasRecords ? "Saved" : "Open";
        }
        
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        let excusedCount = 0;

        if (hasRecords) {
           presentCount = recordsByDate[dateStr].filter(r => r.status === "Present").length;
           absentCount = recordsByDate[dateStr].filter(r => r.status === "Absent").length;
           lateCount = recordsByDate[dateStr].filter(r => r.status === "Late").length;
           excusedCount = recordsByDate[dateStr].filter(r => r.status === "Excused").length;
        }

        sessions.push({
          id: `${classId}_${dateStr}`,
          classId,
          date: dateStr,
          dayOfWeek: current.getDay(),
          startTime: startTimeStr,
          endTime: endTimeStr,
          status,
          hasRecords,
          stats: {
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            excused: excusedCount,
            total: presentCount + absentCount + lateCount + excusedCount
          }
        });
      }
      current.setDate(current.getDate() + 1);
    }

    return sessions;
  }

  // Lấy dữ liệu ma trận điểm danh (History Matrix)
  async getAttendanceMatrix(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const classData = await classModel.findById(classId)
      .populate("students.studentId", "fullName email avatar")
      .lean();
      
    if (!classData) {
      throw new Error("Lớp học không tồn tại!");
    }

    // Lấy danh sách các buổi học ảo
    const sessions = await this.getClassSessions(classId);
    // Chỉ lấy các session có date <= ngày hiện tại (không hiện tương lai quá nhiều nếu không cần)
    // Nhưng để đồng nhất, ta có thể trả về tất cả sessions

    // Lấy toàn bộ bản ghi điểm danh
    const records = await Attendance.find({ classId }).lean();
    const recordsMap = {};
    records.forEach(r => {
      const studentId = r.studentId.toString();
      const dateStr = r.date.toISOString().split("T")[0];
      if (!recordsMap[studentId]) recordsMap[studentId] = {};
      recordsMap[studentId][dateStr] = r;
    });

    const students = (classData.students || []).map(s => {
      const stu = s.studentId || {};
      return {
        _id: stu._id,
        fullName: stu.fullName || "Học sinh",
        email: stu.email || "",
        avatar: stu.avatar || ""
      };
    }).filter(s => s._id);

    return {
      sessions,
      students,
      records: recordsMap
    };
  }

  // Điểm danh hàng loạt có Time-Lock server-side
  async markAttendance({ classId, date, records, teacherId }) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const classData = await classModel.findById(classId).lean();
    if (!classData) {
      throw new Error("Lớp học không tồn tại!");
    }

    const { schedule } = classData;
    if (!schedule || !schedule.startTime || !schedule.endTime) {
      const error = new Error("Lớp học chưa được thiết lập lịch học hợp lệ!");
      error.status = 400;
      throw error;
    }

    const currentServerTime = new Date();
    // Validate Time-Lock
    const sessionStart = new Date(`${date}T${schedule.startTime}:00+07:00`);
    const sessionEnd = new Date(`${date}T${schedule.endTime}:00+07:00`);

    if (currentServerTime < sessionStart) {
      const error = new Error("Buổi học chưa bắt đầu, không thể điểm danh!");
      error.status = 403;
      throw error;
    }

    if (currentServerTime > sessionEnd) {
      const error = new Error("Thời gian điểm danh cho buổi học này đã kết thúc!");
      error.status = 403;
      throw error;
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const validRecords = records.filter(
      (record) => record && record.studentId && mongoose.Types.ObjectId.isValid(record.studentId)
    );

    if (validRecords.length === 0) {
      const error = new Error("Danh sách điểm danh không chứa ID học sinh hợp lệ!");
      error.status = 400;
      throw error;
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
      .sort({ date: -1 })
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
      .sort({ date: -1 })
      .lean();
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
