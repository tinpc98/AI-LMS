// Quy tắc nghiệp vụ của bảng điểm học sinh: phân loại đầu điểm, tính GPA, lọc/sắp xếp.
//
// Tách khỏi useStudentGrades vì đây là phần đáng bảo vệ nhất — nó tính ĐIỂM TRUNG BÌNH hiển
// thị cho học sinh. Nằm trong hook thì không kiểm được nếu không dựng React, nên trước Wave 5
// công thức GPA chưa có một test nào.
import type { IGradeItemDef, IStudentGradeData } from "../../api/gradeApi";
import type {
  IGradeItem,
  StudentGradeFilterOptions,
  StudentGradeStats,
  GradeCategory,
} from "../../types/studentGrade";

export const DEFAULT_GRADE_FILTERS: StudentGradeFilterOptions = {
  searchQuery: "",
  categoryFilter: "all",
  statusFilter: "all",
  sortBy: "highest",
};

/**
 * Suy loại đầu điểm từ chuỗi category tự do của giáo viên.
 *
 * Backend không ràng buộc giá trị này, nên phải đoán bằng từ khoá — và phải nhận cả tiếng Anh
 * lẫn tiếng Việt vì dữ liệu thật có cả hai.
 */
export const classifyCategory = (raw?: string): GradeCategory => {
  const s = (raw || "").toLowerCase();
  if (s.includes("quiz")) return "Quiz";
  if (s.includes("exam") || s.includes("midterm") || s.includes("final")) return "Exam";
  if (s.includes("attendance") || s.includes("chuyên cần")) return "Attendance";
  if (s === "assignment") return "Assignment";
  return "Other";
};

/** Ghép định nghĩa đầu điểm của lớp với điểm thực tế của học sinh này. */
export const buildGradeItems = (
  definitions: IGradeItemDef[],
  studentData: IStudentGradeData | null
): IGradeItem[] => {
  if (!studentData) return [];
  const scores = studentData.grades || {};

  return definitions.map((item) => {
    const match = scores[item._id];
    // Phân biệt "chưa chấm" với "được 0 điểm": cả hai đều falsy nên không dùng `|| null`.
    const score = match?.score !== undefined && match?.score !== null ? match.score : null;

    return {
      _id: item._id,
      title: item.title,
      category: classifyCategory(item.category),
      score,
      maxScore: item.maxScore || 10,
      weight: item.weight || 10,
      status: score !== null ? "Graded" : "Not Submitted",
      gradedBy: "Giảng viên",
      feedback: match?.feedback,
    };
  });
};

export const computeGradeStats = (
  gradeItems: IGradeItem[],
  studentData: IStudentGradeData | null
): StudentGradeStats => {
  let totalScoreWeighted = 0;
  let totalWeightScored = 0;
  let gradedCount = 0;
  let assignSum = 0;
  let assignCount = 0;
  let examSum = 0;
  let examCount = 0;

  for (const item of gradeItems) {
    if (item.status !== "Graded" || item.score === null) continue;

    gradedCount += 1;
    totalScoreWeighted += item.score * item.weight;
    totalWeightScored += item.weight;

    if (item.category === "Assignment") {
      assignSum += item.score;
      assignCount += 1;
    } else if (item.category === "Exam" || item.category === "Quiz") {
      examSum += item.score;
      examCount += 1;
    }
  }

  const round1 = (n: number) => Number(n.toFixed(1));
  // Chỉ chia cho trọng số của những đầu điểm ĐÃ CHẤM. Chia cho tổng trọng số của cả lớp sẽ
  // kéo điểm xuống oan mỗi khi giáo viên chưa chấm xong.
  const gpa = totalWeightScored > 0 ? round1(totalScoreWeighted / totalWeightScored) : null;

  const overallProgress = Math.min(
    100,
    Math.round(
      ((gradedCount + (gradeItems.length - gradedCount) * 0.3) / Math.max(1, gradeItems.length)) *
        100
    )
  );

  return {
    // Số máy chủ tính được ưu tiên hơn số tính tại máy khách.
    gpa: studentData?.avgGPA || gpa,
    // Backend chưa có API tính ĐTB lớp học / chuyên cần so với lớp — trả null (UI hiện "--")
    // thay vì số suy diễn, để không hiển thị một con số trông như thật nhưng không phản ánh
    // dữ liệu thực tế nào.
    classAvgGpa: null,
    attendanceRate: null,
    gradedCount,
    assignmentAvg: assignCount > 0 ? round1(assignSum / assignCount) : null,
    examAvg: examCount > 0 ? round1(examSum / examCount) : null,
    overallProgress,
  };
};

/** Trả về mảng MỚI. Dữ liệu gốc nằm trong cache React Query, không được sắp xếp tại chỗ. */
export const filterAndSortGrades = (
  gradeItems: IGradeItem[],
  filters: StudentGradeFilterOptions
): IGradeItem[] => {
  const q = filters.searchQuery.toLowerCase().trim();

  return gradeItems
    .filter(
      (g) =>
        (!q || g.title.toLowerCase().includes(q)) &&
        (filters.categoryFilter === "all" || g.category === filters.categoryFilter) &&
        (filters.statusFilter === "all" || g.status === filters.statusFilter)
    )
    .sort((a, b) => {
      switch (filters.sortBy) {
        // Chưa chấm coi như 0 điểm khi sắp xếp — nên chúng dồn xuống cuối ở chiều giảm dần.
        case "highest":
          return (b.score || 0) - (a.score || 0);
        case "lowest":
          return (a.score || 0) - (b.score || 0);
        case "gradedAt":
          return (
            (b.gradedAt ? new Date(b.gradedAt).getTime() : 0) -
            (a.gradedAt ? new Date(a.gradedAt).getTime() : 0)
          );
        case "name_asc":
          return a.title.localeCompare(b.title, "vi");
        default:
          return 0;
      }
    });
};
