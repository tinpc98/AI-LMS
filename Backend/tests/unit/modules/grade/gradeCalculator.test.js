// Unit test cho module tính toán điểm THUẦN (PR-09) — không mock Mongoose/DB,
// vì gradeCalculator.js không phụ thuộc framework, chỉ nhận/trả plain object.
import { describe, it, expect } from "vitest";
import {
  buildGradeItems,
  computeWeightedGPA,
  computeStudentGrade,
  calculateGradeMatrix,
} from "../../../../src/modules/grade/gradeCalculator.js";

describe("buildGradeItems", () => {
  it("luôn có 3 cột manual mặc định (Attendance/Midterm/Final) kể cả khi chưa có điểm nào", () => {
    const items = buildGradeItems({
      gradingWeight: null,
      manualGrades: [],
      assignments: [],
      exams: [],
    });
    expect(items.map((i) => i.category)).toEqual(["Attendance", "Midterm", "Final"]);
  });

  it("thêm cột manual phát sinh từ DB (vd 'Other') không trùng lặp với mặc định", () => {
    const items = buildGradeItems({
      gradingWeight: null,
      manualGrades: [{ category: "Other" }, { category: "Attendance" }],
      assignments: [],
      exams: [],
    });
    const categories = items.map((i) => i.category);
    expect(categories.filter((c) => c === "Attendance")).toHaveLength(1);
    expect(categories).toContain("Other");
  });

  it("cột assignment/exam lấy weight từ gradingWeight của lớp, fallback về mặc định nếu không có", () => {
    const items = buildGradeItems({
      gradingWeight: { assignment: 25, midterm: 35 },
      manualGrades: [],
      assignments: [{ _id: "a1", title: "BT1" }],
      exams: [{ _id: "e1", title: "Thi", maxScore: 10 }],
    });
    const assignItem = items.find((i) => i.type === "Assignment");
    const examItem = items.find((i) => i.type === "Exam");
    expect(assignItem.weight).toBe(25);
    expect(examItem.weight).toBe(35);
  });

  it("exam maxScore mặc định là 10 nếu không khai báo", () => {
    const items = buildGradeItems({
      gradingWeight: null,
      manualGrades: [],
      assignments: [],
      exams: [{ _id: "e1", title: "Thi" }],
    });
    expect(items.find((i) => i.type === "Exam").maxScore).toBe(10);
  });
});

describe("computeWeightedGPA", () => {
  const emptyCat = () => ({
    Attendance: { sum: 0, count: 0 },
    Assignment: { sum: 0, count: 0 },
    Midterm: { sum: 0, count: 0 },
    Final: { sum: 0, count: 0 },
    Exam: { sum: 0, count: 0 },
    Other: { sum: 0, count: 0 },
  });

  it("không có điểm nào → avgGPA null, totalWeight 0", () => {
    const result = computeWeightedGPA(emptyCat(), null);
    expect(result).toEqual({ avgGPA: null, totalWeight: 0 });
  });

  it("dùng trọng số mặc định 10/20/30/40 khi lớp không cấu hình gradingWeight", () => {
    const cat = emptyCat();
    cat.Attendance = { sum: 10, count: 1 };
    const result = computeWeightedGPA(cat, null);
    expect(result).toEqual({ avgGPA: 1, totalWeight: 10 }); // 10 * 10% = 1
  });

  it("có Exam nhưng không có Midterm/Final thủ công → Exam average áp dụng cho cả 2 trọng số", () => {
    const cat = emptyCat();
    cat.Exam = { sum: 16, count: 2 }; // avg = 8
    const result = computeWeightedGPA(cat, {
      attendance: 10,
      assignment: 20,
      midterm: 30,
      final: 40,
    });
    // avg=8, (midterm+final)=70% → 8*0.7=5.6
    expect(result).toEqual({ avgGPA: 5.6, totalWeight: 70 });
  });

  it("có Midterm thủ công VÀ Exam cùng lúc → Exam KHÔNG được cộng thêm (tránh double-count)", () => {
    const cat = emptyCat();
    cat.Midterm = { sum: 6, count: 1 };
    cat.Exam = { sum: 16, count: 2 };
    const result = computeWeightedGPA(cat, {
      attendance: 10,
      assignment: 20,
      midterm: 30,
      final: 40,
    });
    // Chỉ Midterm được tính: 6*0.3=1.8, totalWeight chỉ 30 (Exam bị bỏ qua vì đã có Midterm)
    expect(result).toEqual({ avgGPA: 1.8, totalWeight: 30 });
  });

  it("kết quả GPA được làm tròn 2 chữ số thập phân", () => {
    const cat = emptyCat();
    cat.Attendance = { sum: 7, count: 3 }; // avg = 2.333...
    const result = computeWeightedGPA(cat, {
      attendance: 100,
      assignment: 0,
      midterm: 0,
      final: 0,
    });
    expect(result.avgGPA).toBe(2.33);
  });
});

describe("computeStudentGrade", () => {
  it("chỉ tính điểm của đúng học sinh được truyền vào, bỏ qua điểm của học sinh khác", () => {
    const result = computeStudentGrade({
      studentId: "s1",
      user: { fullName: "A" },
      manualGrades: [
        { studentId: "s1", category: "Attendance", score: 10, feedback: "" },
        { studentId: "s2", category: "Attendance", score: 0, feedback: "" },
      ],
      submissions: [],
      attempts: [],
      exams: [],
      gradingWeight: null,
    });
    expect(result.avgGPA).toBe(1);
    expect(Object.keys(result.grades)).toEqual(["manual-Attendance"]);
  });

  it("category không nằm trong catScores đã biết (vd category lạ) không làm crash, chỉ không được cộng vào GPA", () => {
    const result = computeStudentGrade({
      studentId: "s1",
      user: {},
      manualGrades: [{ studentId: "s1", category: "KhongTonTai", score: 5, feedback: "" }],
      submissions: [],
      attempts: [],
      exams: [],
      gradingWeight: null,
    });
    expect(result.grades["manual-KhongTonTai"]).toMatchObject({ score: 5 });
    expect(result.avgGPA).toBeNull();
  });

  it("chuẩn hóa điểm thi (exam attempt) về thang 10 dựa trên maxScore của đề thi", () => {
    const result = computeStudentGrade({
      studentId: "s1",
      user: {},
      manualGrades: [],
      submissions: [],
      attempts: [{ studentId: "s1", examId: "e1", totalScore: 25, _id: "att1" }],
      exams: [{ _id: "e1", maxScore: 50 }],
      gradingWeight: { attendance: 0, assignment: 0, midterm: 50, final: 50 },
    });
    // normalizedScore = 25/50*10 = 5 → áp dụng cho midterm+final (100%) → GPA = 5
    expect(result.avgGPA).toBe(5);
    expect(result.grades["exam-e1"]).toMatchObject({ score: 25 });
  });

  it("user không có trong userMap (đã bị xóa) → student trả về object rỗng, không throw", () => {
    const result = computeStudentGrade({
      studentId: "s1",
      user: undefined,
      manualGrades: [],
      submissions: [],
      attempts: [],
      exams: [],
      gradingWeight: null,
    });
    expect(result.student).toEqual({});
  });
});

describe("calculateGradeMatrix", () => {
  it("kết hợp buildGradeItems + computeStudentGrade cho toàn bộ danh sách học sinh", () => {
    const userMap = new Map([
      ["s1", { fullName: "A" }],
      ["s2", { fullName: "B" }],
    ]);
    const result = calculateGradeMatrix({
      students: [{ studentId: "s1" }, { studentId: "s2" }],
      userMap,
      gradingWeight: null,
      manualGrades: [{ studentId: "s1", category: "Attendance", score: 10, feedback: "" }],
      assignments: [],
      exams: [],
      submissions: [],
      attempts: [],
    });

    expect(result.students).toHaveLength(2);
    expect(result.students.find((s) => s.student.fullName === "A").avgGPA).toBe(1);
    expect(result.students.find((s) => s.student.fullName === "B").avgGPA).toBeNull();
    expect(result.weights).toBeNull();
  });

  it("danh sách học sinh rỗng → trả về students rỗng nhưng gradeItems vẫn có 3 cột manual mặc định", () => {
    const result = calculateGradeMatrix({
      students: [],
      userMap: new Map(),
      gradingWeight: null,
      manualGrades: [],
      assignments: [],
      exams: [],
      submissions: [],
      attempts: [],
    });
    expect(result.students).toEqual([]);
    expect(result.gradeItems).toHaveLength(3);
  });
});
