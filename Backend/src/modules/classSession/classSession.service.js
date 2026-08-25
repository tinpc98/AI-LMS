import mongoose from "mongoose";
import ClassSession from "./classSession.model.js";
import Class from "../class/class.model.js";
import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";
import Attendance from "../attendance/attendance.model.js";

const dayNamesMap = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

class ClassSessionService {
  async generateSessions(classId) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const classData = await Class.findById(classId).lean();
    if (!classData) {
      throw new Error("Lớp học không tồn tại!");
    }

    const { startDate, endDate, schedule, teacherId, mode } = classData;
    if (
      !startDate ||
      !endDate ||
      !schedule ||
      !Array.isArray(schedule.days) ||
      schedule.days.length === 0
    ) {
      throw new Error("Lớp học chưa cấu hình ngày bắt đầu/kết thúc hoặc lịch học (days) hợp lệ.");
    }

    if (!teacherId) {
      throw new Error("Lớp học chưa được phân công giáo viên.");
    }

    const targetDays = schedule.days.map((d) => dayNamesMap[d]);

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Định dạng ngày bắt đầu hoặc kết thúc không hợp lệ.");
    }

    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const loopEnd = new Date(end);
    loopEnd.setHours(23, 59, 59, 999);

    const generatedSessions = [];

    // Lấy sessionNumber lớn nhất hiện tại
    const lastSession = await ClassSession.findOne({ classId })
      .sort({ sessionNumber: -1 })
      .lean();
    let nextSessionNumber = (lastSession?.sessionNumber || 0) + 1;

    const newSessionsData = [];

    while (current <= loopEnd) {
      if (targetDays.includes(current.getDay())) {
        const dateStr = current.toISOString().split("T")[0];
        const startTimeStr = schedule.startTime || "00:00";
        const endTimeStr = schedule.endTime || "23:59";

        // Parse time assuming local time GMT+7
        const sessionStart = new Date(`${dateStr}T${startTimeStr}:00+07:00`);
        const sessionEnd = new Date(`${dateStr}T${endTimeStr}:00+07:00`);

        newSessionsData.push({
          classId: classData._id,
          teacherId: classData.teacherId,
          sessionType: "REGULAR",
          scheduledStartAt: sessionStart,
          scheduledEndAt: sessionEnd,
          status: "SCHEDULED",
          physicalRoom: mode === "OFFLINE" ? classData.classRoom : "",
          title: `Buổi học ngày ${dateStr}`,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    let createdCount = 0;
    let skippedCount = 0;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Idempotent creation
      for (const sessionData of newSessionsData) {
        try {
          const existingSession = await ClassSession.findOne({
            classId: sessionData.classId,
            scheduledStartAt: sessionData.scheduledStartAt,
          }).session(session).lean();

          if (existingSession) {
            skippedCount++;
            continue;
          }

          sessionData.sessionNumber = nextSessionNumber++;
          const newSession = new ClassSession(sessionData);
          await newSession.save({ session });
          createdCount++;
          generatedSessions.push(newSession);
        } catch (err) {
          if (err.code === 11000) {
            skippedCount++; // Duplicate key error
          } else {
            throw err;
          }
        }
      }

      // Sau khi generate session, tự động sinh DRAFT Attendance cho học sinh đang ACTIVE và PENDING cho Teacher
      if (generatedSessions.length > 0) {
        await this.generateDraftAttendanceForSessions(generatedSessions, { session });
        await this.generateTeacherAttendanceForSessions(generatedSessions, { session });
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

    return {
      message: "Tạo lịch học thành công.",
      created: createdCount,
      skipped: skippedCount,
    };
  }

  async generateDraftAttendanceForSessions(sessions, { session } = {}) {
    if (!sessions || sessions.length === 0) return;

    const classId = sessions[0].classId;
    const activeEnrollments = await ClassEnrollment.find({
      classId,
      status: "ACTIVE",
    }).session(session).lean();

    if (activeEnrollments.length === 0) return;

    const attendanceRecordsToInsert = [];
    for (const session of sessions) {
      for (const enrollment of activeEnrollments) {
        attendanceRecordsToInsert.push({
          updateOne: {
            filter: { sessionId: session._id, studentId: enrollment.studentId },
            update: {
              $setOnInsert: {
                sessionId: session._id,
                classId: session.classId,
                studentId: enrollment.studentId,
                status: "DRAFT",
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (attendanceRecordsToInsert.length > 0) {
      await Attendance.bulkWrite(attendanceRecordsToInsert, { session });
    }
  }

  async generateTeacherAttendanceForSessions(sessions, { session } = {}) {
    if (!sessions || sessions.length === 0) return;

    const teacherAttendanceRecordsToInsert = sessions.map((session) => ({
      updateOne: {
        filter: { sessionId: session._id, teacherId: session.teacherId },
        update: {
          $setOnInsert: {
            sessionId: session._id,
            classId: session.classId,
            teacherId: session.teacherId,
            status: "PENDING",
          },
        },
        upsert: true,
      },
    }));

    if (teacherAttendanceRecordsToInsert.length > 0) {
      const { default: TeacherAttendance } = await import("../teacherAttendance/teacherAttendance.model.js");
      await TeacherAttendance.bulkWrite(teacherAttendanceRecordsToInsert, { session });
    }
  }

  async getClassSessions(classId, queryOptions = {}) {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      throw new Error("ID lớp học không hợp lệ!");
    }

    const page = Math.max(1, parseInt(queryOptions.page || 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(queryOptions.limit || 10, 10)));
    const skip = (page - 1) * limit;

    const filter = { classId, isDeleted: false };
    if (queryOptions.status) {
      filter.status = queryOptions.status;
    }

    const [items, totalItems] = await Promise.all([
      ClassSession.find(filter)
        .sort({ scheduledStartAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate("teacherId", "fullName name email")
        .lean(),
      ClassSession.countDocuments(filter),
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

  async getSessionDetail(sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new Error("ID Session không hợp lệ!");
    }

    const session = await ClassSession.findById(sessionId)
      .populate("teacherId", "fullName name email")
      .populate("classId", "name code mode")
      .lean();

    if (!session || session.isDeleted) {
      throw new Error("Buổi học không tồn tại hoặc đã bị xóa!");
    }

    return session;
  }
}

export default new ClassSessionService();
