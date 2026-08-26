import mongoose, { Schema, model } from "mongoose";
import softDeletePlugin from "#shared/plugins/softDelete.plugin.js";

const attendanceSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "ClassSession",
      required: [true, "ID buổi học (Session) là bắt buộc"],
    },
    classId: {
      type: Schema.Types.ObjectId,
      ref: "Class",
      required: [true, "ID lớp học là bắt buộc"],
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "ID học sinh được điểm danh là bắt buộc"],
    },
    // TÍNH NĂNG MỚI: thêm PARTIAL (đặc tả nghiệp vụ mục 7.1) — vùng xám giữa PRESENT/ABSENT,
    // không tính XP điểm danh, không tính vào badge Chuyên cần, nhưng vẫn hiển thị thật thay vì
    // ép về 1 trong 2 cực.
    status: {
      type: String,
      enum: ["DRAFT", "PRESENT", "ABSENT", "LATE", "PARTIAL", "EXCUSED"],
      default: "DRAFT",
      required: [true, "Trạng thái điểm danh là bắt buộc"],
    },
    // BR-7.5: auto_status lưu riêng kết quả công thức tự động tính ra — KHÔNG bao giờ bị ghi đè
    // bởi sửa tay, để sau này biết công thức tự động từng cho ra gì (chốt sổ hiển thị/dùng cho
    // XP/badge vẫn là field `status` phía trên).
    autoStatus: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LATE", "PARTIAL", null],
      default: null,
    },
    evidence: {
      // TÍNH NĂNG MỚI: lưu TỪNG khoảng join-leave (không phải 1 tổng số giây cộng dồn) — đây là
      // cách DUY NHẤT tính đúng "hợp nhất" (union) thời gian khi 1 học sinh vào lại nhiều lần
      // hoặc mở 2 thiết bị cùng lúc (BR-7.1): cộng dồn (kiểu cũ) sẽ đếm trùng phần thời gian 2
      // thiết bị cùng online; union thì không. leaveAt=null nghĩa là phiên đó chưa đóng (còn
      // đang online, hoặc mất kết nối đột ngột chưa kịp ghi leave).
      sessions: {
        type: [
          {
            joinAt: { type: Date, required: true },
            leaveAt: { type: Date, default: null },
            _id: false,
          },
        ],
        default: [],
      },
      // Số lần vào lại (không tính lần vào đầu tiên) — chỉ để giáo viên tham khảo, không dùng
      // trong công thức tính trạng thái.
      rejoinCount: { type: Number, default: 0 },
    },
    // Các giá trị dưới đây là kết quả TÍNH SẴN (cache) tại thời điểm chốt sổ tự động
    // (attendance.service.js#finalizeSessionAttendanceService) từ evidence.sessions — không
    // phải nguồn sự thật, chỉ để hiển thị nhanh mà không phải tính lại mỗi lần đọc.
    attendedSeconds: { type: Number, default: null },
    attendedRatio: { type: Number, default: null }, // 0-100
    firstJoinDelaySeconds: { type: Number, default: null },
    finalizedAt: { type: Date, default: null },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // BR-7.6: giáo viên sửa tay điểm danh phải nhập lý do, có ghi log — lưu cả lịch sử (không
    // chỉ lần sửa cuối) để biết có giáo viên nào sửa tay bất thường nhiều không (đặc tả 7.3).
    editLog: {
      type: [
        {
          editedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
          editedAt: { type: Date, default: Date.now },
          reason: { type: String, required: true, trim: true },
          fromStatus: { type: String },
          toStatus: { type: String },
          _id: false,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Single Source of Truth for Unique Attendance
attendanceSchema.index(
  { sessionId: 1, studentId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
attendanceSchema.index({ classId: 1, studentId: 1 });

attendanceSchema.plugin(softDeletePlugin);

const Attendance = model("Attendance", attendanceSchema);
export default Attendance;
