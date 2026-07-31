// Characterization test cho GradeService.aggregateGradesMatrix TRƯỚC KHI tách phần tính toán
// thuần (pure calculation) ra khỏi phần fetch dữ liệu (PR-09).
// Mục đích: khóa lại hành vi hiện tại (công thức GPA theo trọng số, chuẩn hóa điểm thi,
// fallback trọng số mặc định) để sau khi tách, chạy lại NGUYÊN VẸN các test này và
// chứng minh không có thay đổi hành vi quan sát được.
import { describe, it, expect, afterEach, vi } from "vitest";
import gradeService from "../../src/modules/grade/grade.service.js";
import { Class as classModel } from "#modules/class";
import { User } from "#modules/auth";
import { Assignment } from "#modules/assignment";
import { Exam } from "#modules/exam";
import { Grade } from "#modules/grade";
import { Submission } from "#modules/assignment";
import { ExamAttempt } from "#modules/exam-attempt";

const CLASS_ID = "607f1f77bcf86cd799439111";
const STUDENT_1 = "607f1f77bcf86cd799439222";
const STUDENT_2 = "607f1f77bcf86cd799439233";

// Thenable mock mô phỏng chuỗi Mongoose Query (.lean()/.populate()/... trả về chính nó),
// khớp với convention mongooseQuery đã dùng trong assignmentController.test.js.
const mongooseQuery = (resolvedValue) => {
  const query = {
    lean: () => query,
    populate: () => query,
    sort: () => query,
    skip: () => query,
    limit: () => query,
    select: () => query,
    then: (resolve, reject) => Promise.resolve(resolvedValue).then(resolve, reject),
    catch: (reject) => Promise.resolve(resolvedValue).catch(reject),
  };
  return query;
};

const mockClassAndSubs = ({
  classDoc,
  users = [],
  assignments = [],
  exams = [],
  manualGrades = [],
  submissions = [],
  attempts = [],
}) => {
  vi.spyOn(classModel, "findById").mockReturnValue(mongooseQuery(classDoc));
  vi.spyOn(User, "find").mockReturnValue(mongooseQuery(users));
  vi.spyOn(Assignment, "find").mockReturnValue(mongooseQuery(assignments));
  vi.spyOn(Exam, "find").mockReturnValue(mongooseQuery(exams));
  vi.spyOn(Grade, "find").mockReturnValue(mongooseQuery(manualGrades));
  vi.spyOn(Submission, "find").mockReturnValue(mongooseQuery(submissions));
  vi.spyOn(ExamAttempt, "find").mockReturnValue(mongooseQuery(attempts));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("aggregateGradesMatrix — characterization", () => {
  it("Lớp không tồn tại → trả về danh sách rỗng", async () => {
    vi.spyOn(classModel, "findById").mockReturnValue(mongooseQuery(null));

    const result = await gradeService.aggregateGradesMatrix(CLASS_ID);
    expect(result).toEqual({ gradeItems: [], students: [] });
  });

  it("Chỉ có điểm thủ công (Attendance + Midterm), không có gradingWeight riêng → dùng trọng số mặc định 10/20/30/40", async () => {
    mockClassAndSubs({
      classDoc: {
        _id: CLASS_ID,
        students: [{ studentId: STUDENT_1, status: "Enrolled" }],
        gradingWeight: null,
      },
      users: [{ _id: STUDENT_1, fullName: "Học sinh A" }],
      manualGrades: [
        { _id: "g1", studentId: STUDENT_1, category: "Attendance", score: 8, feedback: "" },
        { _id: "g2", studentId: STUDENT_1, category: "Midterm", score: 6, feedback: "" },
      ],
    });

    const result = await gradeService.aggregateGradesMatrix(CLASS_ID);
    const s = result.students[0];

    // weightedSum = 8*(10/100) + 6*(30/100) = 0.8 + 1.8 = 2.6 ; totalWeight = 10+30 = 40
    expect(s.avgGPA).toBe(2.6);
    expect(s.totalWeight).toBe(40);
    expect(s.grades["manual-Attendance"]).toMatchObject({ score: 8 });
    expect(s.grades["manual-Midterm"]).toMatchObject({ score: 6 });
  });

  it("Có Assignment (Submission.grade) + Exam (ExamAttempt) → cộng vào catScores tương ứng và chuẩn hóa exam theo maxScore", async () => {
    mockClassAndSubs({
      classDoc: {
        _id: CLASS_ID,
        students: [{ studentId: STUDENT_1, status: "Enrolled" }],
        gradingWeight: { attendance: 10, assignment: 20, midterm: 30, final: 40 },
      },
      users: [{ _id: STUDENT_1, fullName: "Học sinh A" }],
      assignments: [{ _id: "a1", title: "BT1" }],
      exams: [{ _id: "e1", title: "Giữa kỳ", maxScore: 20, status: "Published" }],
      submissions: [
        { _id: "s1", assignmentId: "a1", studentId: STUDENT_1, grade: 9, feedback: "Tốt" },
      ],
      attempts: [
        { _id: "at1", examId: "e1", studentId: STUDENT_1, totalScore: 16, status: "GRADED" },
      ],
    });

    const result = await gradeService.aggregateGradesMatrix(CLASS_ID);
    const s = result.students[0];

    // Assignment: avg=9, weight 20% → 1.8
    // Exam (không có Midterm/Final thủ công) → normalizedScore = 16/20*10 = 8, áp dụng cho cả midterm+final weight (30+40=70%) → 8*0.7=5.6
    // weightedSum = 1.8 + 5.6 = 7.4 ; totalWeight = 20 + 70 = 90
    expect(s.avgGPA).toBe(7.4);
    expect(s.totalWeight).toBe(90);
    expect(s.grades["assign-a1"]).toMatchObject({ score: 9 });
    expect(s.grades["exam-e1"]).toMatchObject({ score: 16 });
  });

  it("Không có điểm nào cho học sinh → avgGPA = null, totalWeight = 0", async () => {
    mockClassAndSubs({
      classDoc: {
        _id: CLASS_ID,
        students: [{ studentId: STUDENT_1, status: "Enrolled" }],
        gradingWeight: null,
      },
      users: [{ _id: STUDENT_1, fullName: "Học sinh A" }],
    });

    const result = await gradeService.aggregateGradesMatrix(CLASS_ID);
    const s = result.students[0];
    expect(s.avgGPA).toBeNull();
    expect(s.totalWeight).toBe(0);
  });

  it("Nhiều học sinh — mỗi học sinh tính độc lập, không rò rỉ điểm giữa các học sinh", async () => {
    mockClassAndSubs({
      classDoc: {
        _id: CLASS_ID,
        students: [
          { studentId: STUDENT_1, status: "Enrolled" },
          { studentId: STUDENT_2, status: "Enrolled" },
        ],
        gradingWeight: null,
      },
      users: [
        { _id: STUDENT_1, fullName: "A" },
        { _id: STUDENT_2, fullName: "B" },
      ],
      manualGrades: [
        { _id: "g1", studentId: STUDENT_1, category: "Attendance", score: 10, feedback: "" },
      ],
    });

    const result = await gradeService.aggregateGradesMatrix(CLASS_ID);
    const s1 = result.students.find((s) => s.student._id === STUDENT_1);
    const s2 = result.students.find((s) => s.student._id === STUDENT_2);

    expect(s1.avgGPA).toBe(1); // 10 * (10/100)
    expect(s2.avgGPA).toBeNull();
    expect(s2.grades).toEqual({});
  });

  it("targetStudentId → chỉ giới hạn kết quả cho 1 học sinh", async () => {
    mockClassAndSubs({
      classDoc: {
        _id: CLASS_ID,
        students: [
          { studentId: STUDENT_1, status: "Enrolled" },
          { studentId: STUDENT_2, status: "Enrolled" },
        ],
        gradingWeight: null,
      },
      users: [{ _id: STUDENT_1, fullName: "A" }],
    });

    const result = await gradeService.aggregateGradesMatrix(CLASS_ID, STUDENT_1);
    expect(result.students).toHaveLength(1);
    expect(result.students[0].student._id).toBe(STUDENT_1);
  });

  it("Học sinh không ở trạng thái Enrolled (Dropped) bị loại khỏi bảng điểm", async () => {
    mockClassAndSubs({
      classDoc: {
        _id: CLASS_ID,
        students: [
          { studentId: STUDENT_1, status: "Enrolled" },
          { studentId: STUDENT_2, status: "Dropped" },
        ],
        gradingWeight: null,
      },
      users: [{ _id: STUDENT_1, fullName: "A" }],
    });

    const result = await gradeService.aggregateGradesMatrix(CLASS_ID);
    expect(result.students).toHaveLength(1);
    expect(result.students[0].student._id).toBe(STUDENT_1);
  });

  it("gradeItems bao gồm manual categories (mặc định + phát sinh từ DB), assignment, exam", async () => {
    mockClassAndSubs({
      classDoc: { _id: CLASS_ID, students: [], gradingWeight: null },
      manualGrades: [
        { _id: "g1", studentId: STUDENT_1, category: "Other", score: 5, feedback: "" },
      ],
      assignments: [{ _id: "a1", title: "BT1" }],
      exams: [{ _id: "e1", title: "Thi", maxScore: 10, status: "Published" }],
    });

    const result = await gradeService.aggregateGradesMatrix(CLASS_ID);
    const categories = result.gradeItems.map((gi) => gi.category);
    expect(categories).toEqual(
      expect.arrayContaining(["Attendance", "Midterm", "Final", "Other", "Assignment", "Exam"])
    );
  });
});
