import ExcelJS from "exceljs";
import mongoose from "mongoose";
import classModel from "../models/class.model.js";
import Grade from "../models/grade.model.js";
import Attendance from "../models/attendance.model.js";

// ─────────────────────────────────────────────
// SHARED HELPER – Tạo style chuẩn cho workbook
// ─────────────────────────────────────────────

/**
 * Áp dụng style header chung cho 1 hàng worksheet.
 * @param {ExcelJS.Row} row
 */
const styleHeaderRow = (row) => {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F4E79" }, // xanh navy đậm
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
  row.height = 24;
};

/**
 * Áp dụng border nhẹ cho các hàng dữ liệu.
 * @param {ExcelJS.Row} row
 * @param {number} rowIndex - Chỉ số hàng (để xen kẽ màu nền)
 */
const styleDataRow = (row, rowIndex) => {
  const isEven = rowIndex % 2 === 0;
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.border = {
      top: { style: "hair" },
      left: { style: "hair" },
      bottom: { style: "hair" },
      right: { style: "hair" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isEven ? "FFF2F7FF" : "FFFFFFFF" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });
  row.height = 18;
};

/**
 * Tạo dòng tiêu đề báo cáo (merged cell đầu trang).
 * @param {ExcelJS.Worksheet} ws
 * @param {string} title
 * @param {number} colCount - Số cột để merge
 */
const addReportTitle = (ws, title, colCount) => {
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = ws.getCell("A1");
  titleCell.value = title;
  titleCell.font = { bold: true, size: 14, color: { argb: "FF1F4E79" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 30;

  ws.mergeCells(2, 1, 2, colCount);
  const dateCell = ws.getCell("A2");
  dateCell.value = `Xuất ngày: ${new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;
  dateCell.font = { italic: true, size: 10, color: { argb: "FF666666" } };
  dateCell.alignment = { horizontal: "center" };
  ws.getRow(2).height = 18;
};

// ─────────────────────────────────────────────
// GRADES EXPORT SERVICE
// ─────────────────────────────────────────────

/**
 * Lấy dữ liệu bảng điểm của một lớp học và trả về Excel buffer.
 *
 * Dữ liệu mỗi hàng: STT | Họ tên | Email | Chuyên cần | Bài tập | Giữa kỳ | Cuối kỳ | Khác | GPA
 *
 * @param {string} classId - MongoDB ObjectId của lớp học
 * @returns {Promise<{ buffer: Buffer, className: string }>}
 */
export const buildGradesExcel = async (classId) => {
  // 1. Lấy thông tin lớp (bao gồm danh sách học sinh đã enroll)
  const targetClass = await classModel
    .findById(classId)
    .populate("students.studentId", "fullName email")
    .populate("courseId", "courseName")
    .lean();

  if (!targetClass) {
    throw new Error("Lớp học không tồn tại!");
  }

  // 2. Lọc chỉ lấy học sinh hợp lệ (không bị xóa mềm, có thông tin)
  const enrolledStudents = (targetClass.students || [])
    .filter((s) => s.studentId && !s.studentId.isDeleted)
    .map((s) => s.studentId);

  // 3. Lấy tất cả bản ghi điểm của cả lớp – 1 query duy nhất, sau đó nhóm theo studentId
  const allGrades = await Grade.find({ classId, isDeleted: false }).lean();

  // Nhóm điểm theo studentId để tra cứu O(1)
  const gradeMap = {};
  allGrades.forEach((g) => {
    const sid = g.studentId.toString();
    if (!gradeMap[sid]) gradeMap[sid] = {};
    gradeMap[sid][g.category] = g.score;
  });

  // 4. Lấy tỷ trọng điểm của lớp
  const weights = targetClass.gradingWeight || {
    attendance: 10,
    assignment: 20,
    midterm: 30,
    final: 40,
  };

  /**
   * Tính GPA theo công thức tỷ trọng.
   * @param {Object} studentGrades - { Attendance, Assignment, Midterm, Final, Other }
   */
  const calcGPA = (studentGrades) => {
    const categoryWeightMap = {
      Attendance: weights.attendance,
      Assignment: weights.assignment,
      Midterm: weights.midterm,
      Final: weights.final,
    };
    let weightedSum = 0;
    let totalWeight = 0;
    Object.entries(categoryWeightMap).forEach(([cat, w]) => {
      if (studentGrades[cat] !== undefined && w > 0) {
        weightedSum += studentGrades[cat] * (w / 100);
        totalWeight += w;
      }
    });
    return totalWeight > 0 ? parseFloat(weightedSum.toFixed(2)) : "N/A";
  };

  // 5. Tạo workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI-LMS System";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Bảng Điểm", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  // Định nghĩa cột
  const columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Họ và Tên", key: "fullName", width: 28 },
    { header: "Email", key: "email", width: 30 },
    { header: `Chuyên cần\n(${weights.attendance}%)`, key: "attendance", width: 14 },
    { header: `Bài tập\n(${weights.assignment}%)`, key: "assignment", width: 12 },
    { header: `Giữa kỳ\n(${weights.midterm}%)`, key: "midterm", width: 12 },
    { header: `Cuối kỳ\n(${weights.final}%)`, key: "final", width: 12 },
    { header: "Khác", key: "other", width: 10 },
    { header: "GPA", key: "gpa", width: 10 },
  ];

  // Dòng 1-2: Tiêu đề báo cáo
  addReportTitle(
    ws,
    `BẢNG ĐIỂM LỚP: ${targetClass.className?.toUpperCase()} – ${targetClass.courseId?.courseName || ""}`,
    columns.length
  );

  // Dòng 3: Header cột
  ws.columns = columns;
  const headerRow = ws.getRow(3);
  headerRow.values = columns.map((c) => c.header);
  styleHeaderRow(headerRow);

  // Dòng 4+: Dữ liệu
  enrolledStudents.forEach((student, index) => {
    const sid = student._id.toString();
    const grades = gradeMap[sid] || {};
    const gpa = calcGPA(grades);

    const dataRow = ws.addRow({
      stt: index + 1,
      fullName: student.fullName || "—",
      email: student.email || "—",
      attendance: grades["Attendance"] ?? "—",
      assignment: grades["Assignment"] ?? "—",
      midterm: grades["Midterm"] ?? "—",
      final: grades["Final"] ?? "—",
      other: grades["Other"] ?? "—",
      gpa,
    });

    // Highlight GPA: xanh ≥ 7, vàng 5-7, đỏ < 5
    const gpaCell = dataRow.getCell("gpa");
    if (typeof gpa === "number") {
      if (gpa >= 7) {
        gpaCell.font = { bold: true, color: { argb: "FF1A7F2E" } };
      } else if (gpa >= 5) {
        gpaCell.font = { bold: true, color: { argb: "FFB8860B" } };
      } else {
        gpaCell.font = { bold: true, color: { argb: "FFCC0000" } };
      }
    }

    styleDataRow(dataRow, index);
  });

  // Dòng tổng kết
  const summaryRow = ws.addRow({
    stt: "",
    fullName: `Tổng học sinh: ${enrolledStudents.length}`,
    email: "",
  });
  summaryRow.getCell("fullName").font = { bold: true, italic: true };
  summaryRow.height = 18;

  // Đóng băng header
  ws.views = [{ state: "frozen", ySplit: 3 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, className: targetClass.className };
};

// ─────────────────────────────────────────────
// ATTENDANCE EXPORT SERVICE
// ─────────────────────────────────────────────

/**
 * Lấy dữ liệu điểm danh tổng hợp của một lớp học và trả về Excel buffer.
 *
 * Dữ liệu mỗi hàng: STT | Họ tên | Email | Tổng buổi | Có mặt | Vắng | Trễ | Nghỉ phép | Tỉ lệ (%)
 *
 * @param {string} classId - MongoDB ObjectId của lớp học
 * @returns {Promise<{ buffer: Buffer, className: string }>}
 */
export const buildAttendanceExcel = async (classId) => {
  // 1. Lấy thông tin lớp và học sinh song song với việc lấy điểm danh
  const [targetClass, allRecords] = await Promise.all([
    classModel
      .findById(classId)
      .populate("students.studentId", "fullName email")
      .lean(),
    Attendance.find({ classId, isDeleted: false }).lean(),
  ]);

  if (!targetClass) {
    throw new Error("Lớp học không tồn tại!");
  }

  // 2. Danh sách học sinh đã enroll
  const enrolledStudents = (targetClass.students || [])
    .filter((s) => s.studentId && !s.studentId.isDeleted)
    .map((s) => s.studentId);

  // 3. Nhóm bản ghi điểm danh theo studentId để tra cứu O(1)
  const attendanceMap = {};
  allRecords.forEach((rec) => {
    const sid = rec.studentId.toString();
    if (!attendanceMap[sid]) {
      attendanceMap[sid] = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    }
    if (attendanceMap[sid][rec.status] !== undefined) {
      attendanceMap[sid][rec.status]++;
    }
  });

  // Tổng số buổi duy nhất trong lớp (đếm số ngày có điểm danh)
  const uniqueDates = new Set(allRecords.map((r) => r.date?.toDateString())).size;

  // 4. Tạo workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AI-LMS System";
  workbook.created = new Date();

  const ws = workbook.addWorksheet("Điểm Danh", {
    pageSetup: { paperSize: 9, orientation: "landscape" },
  });

  const columns = [
    { header: "STT", key: "stt", width: 6 },
    { header: "Họ và Tên", key: "fullName", width: 28 },
    { header: "Email", key: "email", width: 30 },
    { header: "Tổng buổi", key: "total", width: 12 },
    { header: "✅ Có mặt", key: "present", width: 12 },
    { header: "❌ Vắng mặt", key: "absent", width: 12 },
    { header: "⏰ Đi trễ", key: "late", width: 12 },
    { header: "📋 Nghỉ phép", key: "excused", width: 13 },
    { header: "Tỉ lệ (%)", key: "rate", width: 13 },
  ];

  // Tiêu đề báo cáo (dòng 1-2)
  addReportTitle(
    ws,
    `BẢNG ĐIỂM DANH LỚP: ${targetClass.className?.toUpperCase()}  –  Tổng buổi học: ${uniqueDates}`,
    columns.length
  );

  // Header cột (dòng 3)
  ws.columns = columns;
  const headerRow = ws.getRow(3);
  headerRow.values = columns.map((c) => c.header);
  styleHeaderRow(headerRow);

  // Dữ liệu (dòng 4+)
  enrolledStudents.forEach((student, index) => {
    const sid = student._id.toString();
    const stats = attendanceMap[sid] || { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    // Tổng các buổi đã ghi nhận cho học sinh này (có thể khác uniqueDates nếu không ghi đủ)
    const totalRecorded = stats.Present + stats.Absent + stats.Late + stats.Excused;
    // Tỉ lệ tính trên tổng buổi lớp thực tế
    const base = uniqueDates > 0 ? uniqueDates : totalRecorded;
    const rate = base > 0 ? `${((stats.Present / base) * 100).toFixed(1)}%` : "N/A";

    const dataRow = ws.addRow({
      stt: index + 1,
      fullName: student.fullName || "—",
      email: student.email || "—",
      total: uniqueDates,
      present: stats.Present,
      absent: stats.Absent,
      late: stats.Late,
      excused: stats.Excused,
      rate,
    });

    // Highlight tỉ lệ: xanh ≥ 80%, vàng 60-80%, đỏ < 60%
    const rateCell = dataRow.getCell("rate");
    const numericRate = base > 0 ? (stats.Present / base) * 100 : -1;
    if (numericRate >= 80) {
      rateCell.font = { bold: true, color: { argb: "FF1A7F2E" } };
    } else if (numericRate >= 60) {
      rateCell.font = { bold: true, color: { argb: "FFB8860B" } };
    } else if (numericRate >= 0) {
      rateCell.font = { bold: true, color: { argb: "FFCC0000" } };
    }

    styleDataRow(dataRow, index);
  });

  // Dòng tổng kết
  const summaryRow = ws.addRow({
    stt: "",
    fullName: `Tổng học sinh: ${enrolledStudents.length}  |  Tổng buổi học: ${uniqueDates}`,
    email: "",
  });
  summaryRow.getCell("fullName").font = { bold: true, italic: true };
  summaryRow.height = 18;

  // Đóng băng header
  ws.views = [{ state: "frozen", ySplit: 3 }];

  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer, className: targetClass.className };
};

/**
 * Chuẩn hoá tên file để tránh ký tự đặc biệt gây lỗi Content-Disposition.
 * @param {string} name
 */
export const sanitizeFilename = (name = "") =>
  name.replace(/[^\w\s\-_.]/g, "").replace(/\s+/g, "_").trim() || "Class";
