// Module tính toán điểm số THUẦN (pure) — không phụ thuộc Mongoose/DB/HTTP.
// Tách từ GradeService.aggregateGradesMatrix (PR-09) để có thể unit test độc lập
// và giảm rủi ro khi sửa công thức tính GPA trong tương lai.
// Toàn bộ input là dữ liệu thuần (plain object/array) đã được fetch sẵn từ DB.

const DEFAULT_WEIGHTS = { attendance: 10, assignment: 20, midterm: 30, final: 40 };
const DEFAULT_MANUAL_CATEGORIES = ["Attendance", "Midterm", "Final"];

// Xây danh sách cột điểm (gradeItems) hiển thị trên ma trận điểm.
export const buildGradeItems = ({ gradingWeight, manualGrades, assignments, exams }) => {
  const gradeItems = [];

  const dbManualCats = manualGrades.map((g) => g.category);
  const manualCategories = [...new Set([...DEFAULT_MANUAL_CATEGORIES, ...dbManualCats])];

  manualCategories.forEach((cat) => {
    gradeItems.push({
      _id: `manual-${cat}`,
      title: cat,
      category: cat,
      maxScore: 10,
      weight: gradingWeight?.[cat.toLowerCase()] || 10,
      type: "Manual",
    });
  });

  assignments.forEach((a) => {
    gradeItems.push({
      _id: `assign-${a._id}`,
      title: a.title,
      category: "Assignment",
      maxScore: a.maxScore || 10,
      weight: gradingWeight?.assignment || 20,
      type: "Assignment",
      sourceId: a._id.toString(),
    });
  });

  exams.forEach((e) => {
    gradeItems.push({
      _id: `exam-${e._id}`,
      title: e.title,
      category: "Exam",
      maxScore: e.maxScore || 10,
      weight: gradingWeight?.midterm || 30,
      type: "Exam",
      sourceId: e._id.toString(),
    });
  });

  return gradeItems;
};

const emptyCatScores = () => ({
  Attendance: { sum: 0, count: 0 },
  Assignment: { sum: 0, count: 0 },
  Midterm: { sum: 0, count: 0 },
  Final: { sum: 0, count: 0 },
  Exam: { sum: 0, count: 0 },
  Other: { sum: 0, count: 0 },
});

// Tính GPA theo trọng số từ catScores đã gộp (sum/count theo từng category).
export const computeWeightedGPA = (catScores, gradingWeight) => {
  const weights = gradingWeight || DEFAULT_WEIGHTS;
  let weightedSum = 0;
  let totalWeight = 0;

  if (catScores.Attendance.count > 0) {
    weightedSum +=
      (catScores.Attendance.sum / catScores.Attendance.count) * (weights.attendance / 100);
    totalWeight += weights.attendance;
  }

  if (catScores.Assignment.count > 0) {
    weightedSum +=
      (catScores.Assignment.sum / catScores.Assignment.count) * (weights.assignment / 100);
    totalWeight += weights.assignment;
  }

  if (catScores.Midterm.count > 0) {
    weightedSum += (catScores.Midterm.sum / catScores.Midterm.count) * (weights.midterm / 100);
    totalWeight += weights.midterm;
  }
  if (catScores.Final.count > 0) {
    weightedSum += (catScores.Final.sum / catScores.Final.count) * (weights.final / 100);
    totalWeight += weights.final;
  }

  // Nếu có điểm Exam nhưng không có Midterm/Final thủ công, dùng điểm Exam trung bình
  // cho cả 2 trọng số Midterm và Final.
  if (catScores.Exam.count > 0 && catScores.Midterm.count === 0 && catScores.Final.count === 0) {
    const examAvg = catScores.Exam.sum / catScores.Exam.count;
    weightedSum += examAvg * ((weights.midterm + weights.final) / 100);
    totalWeight += weights.midterm + weights.final;
  }

  return {
    avgGPA: totalWeight > 0 ? parseFloat(weightedSum.toFixed(2)) : null,
    totalWeight,
  };
};

// Tính điểm của MỘT học sinh: gộp manual grades + submissions + exam attempts,
// rồi tính GPA theo trọng số của lớp.
export const computeStudentGrade = ({
  studentId,
  user,
  manualGrades,
  submissions,
  attempts,
  exams,
  assignments,
  gradingWeight,
}) => {
  const uId = studentId.toString();
  const gradesMap = {};
  const catScores = emptyCatScores();

  manualGrades
    .filter((g) => g.studentId.toString() === uId)
    .forEach((g) => {
      gradesMap[`manual-${g.category}`] = { score: g.score, feedback: g.feedback, rawId: g._id };
      if (catScores[g.category]) {
        catScores[g.category].sum += g.score;
        catScores[g.category].count++;
      }
    });

  submissions
    .filter((sub) => sub.studentId.toString() === uId)
    .forEach((sub) => {
      if (sub.grade === null || sub.grade === undefined) return;

      const max = assignments.find((a) => a._id.toString() === sub.assignmentId.toString())?.maxScore || 10;
      if (max <= 0) {
        console.warn(`Bỏ qua bài nộp ${sub._id} vì maxScore của bài tập = 0`);
        return;
      }

      const normalizedScore = (sub.grade / max) * 10;

      gradesMap[`assign-${sub.assignmentId}`] = {
        score: sub.grade,
        feedback: sub.feedback,
        rawId: sub._id,
      };
      catScores.Assignment.sum += normalizedScore;
      catScores.Assignment.count++;
    });

  attempts
    .filter((att) => att.studentId.toString() === uId)
    .forEach((att) => {
      // Chuẩn hóa điểm thi về thang 10 để tính GPA khi maxScore khác 10.
      const max = exams.find((e) => e._id.toString() === att.examId.toString())?.maxScore || 10;
      const normalizedScore = (att.totalScore / max) * 10;

      gradesMap[`exam-${att.examId}`] = { score: att.totalScore, feedback: "", rawId: att._id };
      catScores.Exam.sum += normalizedScore;
      catScores.Exam.count++;
    });

  const { avgGPA, totalWeight } = computeWeightedGPA(catScores, gradingWeight);

  return {
    student: user || {},
    grades: gradesMap,
    avgGPA,
    totalWeight,
  };
};

// Tính toàn bộ ma trận điểm cho một danh sách học sinh (đầu vào đã fetch sẵn từ DB).
export const calculateGradeMatrix = ({
  students,
  userMap,
  gradingWeight,
  manualGrades,
  assignments,
  exams,
  submissions,
  attempts,
}) => {
  const gradeItems = buildGradeItems({ gradingWeight, manualGrades, assignments, exams });

  const studentGradesList = students.map((s) => {
    const uId = s.studentId.toString();
    const user = userMap.get(uId) || {};
    return computeStudentGrade({
      studentId: s.studentId,
      user,
      manualGrades,
      submissions,
      attempts,
      exams,
      assignments,
      gradingWeight,
    });
  });

  return {
    gradeItems,
    students: studentGradesList,
    weights: gradingWeight,
  };
};
