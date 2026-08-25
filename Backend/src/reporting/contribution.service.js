// Tổng hợp đóng góp của một giáo viên: giờ dạy, số buổi, số lớp, số học viên — mảnh còn
// thiếu để trả lời câu hỏi cốt lõi của EduSpace ("giá trị cho đi có đo được không", xem gap
// analysis mục R08/R09). Trước đây không có truy vấn nào tổng hợp theo teacherId dù dữ liệu
// nguồn (TeacherAttendance.checkedInAt/checkedOutAt, ClassSession, ClassEnrollment) đã đủ.
//
// Đặt ở reporting/ vì đây là tầng đọc tổng hợp, không sở hữu dữ liệu — xem reporting/README.md.
import mongoose from "mongoose";
import { TeacherAttendance } from "#modules/teacherAttendance";
import { ClassEnrollment } from "#modules/classEnrollment";

const toObjectId = (value) =>
  value instanceof mongoose.Types.ObjectId ? value : new mongoose.Types.ObjectId(String(value));

/**
 * @param {string} teacherId
 * @param {{ from?: Date, to?: Date }} [range] - lọc theo checkedInAt, để trống = trọn đời.
 */
export const getTeacherContributionSummary = async (teacherId, range = {}) => {
  const tid = toObjectId(teacherId);

  const filter = {
    teacherId: tid,
    status: "CONFIRMED",
    isDeleted: false,
    checkedInAt: { $ne: null },
    checkedOutAt: { $ne: null },
  };
  if (range.from || range.to) {
    filter.checkedInAt = {
      ...filter.checkedInAt,
      ...(range.from && { $gte: range.from }),
      ...(range.to && { $lte: range.to }),
    };
  }

  const confirmedSessions = await TeacherAttendance.find(filter)
    .select("classId checkedInAt checkedOutAt")
    .lean();

  const totalHours = confirmedSessions.reduce((sum, record) => {
    const durationMs = new Date(record.checkedOutAt) - new Date(record.checkedInAt);
    return sum + Math.max(0, durationMs) / (1000 * 60 * 60);
  }, 0);

  const classIds = [...new Set(confirmedSessions.map((r) => String(r.classId)))];

  const totalStudents = classIds.length
    ? (
        await ClassEnrollment.distinct("studentId", {
          classId: { $in: classIds },
          status: "ACTIVE",
        })
      ).length
    : 0;

  return {
    teacherId: String(teacherId),
    totalHours: Math.round(totalHours * 100) / 100,
    totalSessions: confirmedSessions.length,
    totalClasses: classIds.length,
    totalStudents,
    periodFrom: range.from || null,
    periodTo: range.to || null,
  };
};
