import { computeStudentGrade } from "./src/modules/grade/gradeCalculator.js";

const studentId = "student1";

const assignments = [
  { _id: "a1", title: "Max 10", maxScore: 10 },
  { _id: "a2", title: "Max 100", maxScore: 100 },
  { _id: "a3", title: "Max 20", maxScore: 20 },
  { _id: "a4", title: "Chưa chấm", maxScore: 100 },
  { _id: "a5", title: "Thiếu maxScore" } // No maxScore
];

const submissions = [
  { _id: "sub1", studentId: "student1", assignmentId: "a1", grade: 8 },
  { _id: "sub2", studentId: "student1", assignmentId: "a2", grade: 85 },
  { _id: "sub3", studentId: "student1", assignmentId: "a3", grade: 15 },
  { _id: "sub4", studentId: "student1", assignmentId: "a4", grade: null },
  { _id: "sub5", studentId: "student1", assignmentId: "a5", grade: 9 }
];

const gradingWeight = { assignment: 20 };
const exams = [];
const attempts = [];
const manualGrades = [];
const user = { _id: "teacher1" };

const result = computeStudentGrade({
  studentId,
  user,
  manualGrades,
  submissions,
  attempts,
  exams,
  assignments,
  gradingWeight
});

console.log("=== KẾT QUẢ COMPUTE STUDENT GRADE ===");
console.log("GPA Tổng Kết (avgGPA):", result.avgGPA);

console.log("\nChi tiết từng bài (gradeMap):");
console.log("Kịch bản 1 (Max 10, chấm 8):", result.grades["assign-a1"].score, "(lưu nguyên gốc)");
console.log("Kịch bản 2 (Max 100, chấm 85):", result.grades["assign-a2"].score);
console.log("Kịch bản 3 (Max 20, chấm 15):", result.grades["assign-a3"].score);
console.log("Kịch bản 4 (Chưa chấm):", result.grades["assign-a4"]);
console.log("Kịch bản 5 (Thiếu maxScore, chấm 9):", result.grades["assign-a5"].score);

console.log("\nTính trung bình (tính tay theo thang 10): (8 + 8.5 + 7.5 + 9) / 4 = 8.25");
console.log("Hệ thống tính GPA:", result.avgGPA);
