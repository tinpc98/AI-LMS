// Chốt công thức tính điểm trung bình hiển thị cho học sinh.
//
// Trước Wave 5 công thức này nằm trong useStudentGrades nên không kiểm được nếu không dựng
// React — nghĩa là con số quan trọng nhất màn hình chưa từng có test nào.
import { describe, it, expect } from "vitest";
import {
  DEFAULT_GRADE_FILTERS,
  buildGradeItems,
  classifyCategory,
  computeGradeStats,
  filterAndSortGrades,
} from "../src/features/grade/studentGrade.logic";
import type { IGradeItemDef, IStudentGradeData } from "../src/api/gradeApi";
import type { IGradeItem } from "../src/types/studentGrade";

const dinhNghia = (over: Partial<IGradeItemDef>): IGradeItemDef =>
  ({
    _id: "g1",
    title: "Đầu điểm",
    category: "assignment",
    maxScore: 10,
    weight: 10,
    ...over,
  }) as IGradeItemDef;

const hocSinh = (grades: Record<string, unknown>, avgGPA?: number): IStudentGradeData =>
  ({ grades, avgGPA }) as IStudentGradeData;

const muc = (over: Partial<IGradeItem>): IGradeItem =>
  ({
    _id: "x",
    title: "Mục",
    category: "Assignment",
    score: 8,
    maxScore: 10,
    weight: 10,
    status: "Graded",
    ...over,
  }) as IGradeItem;

describe("classifyCategory", () => {
  it.each([
    ["quiz 1", "Quiz"],
    ["Midterm Exam", "Exam"],
    ["final", "Exam"],
    ["attendance", "Attendance"],
    ["chuyên cần", "Attendance"], // dữ liệu thật có cả tiếng Việt
    ["assignment", "Assignment"],
    ["gì đó lạ", "Other"],
    [undefined, "Other"],
  ])("%s -> %s", (input, expected) => {
    expect(classifyCategory(input as string | undefined)).toBe(expected);
  });
});

describe("buildGradeItems", () => {
  it("chưa có dữ liệu học sinh thì trả mảng rỗng", () => {
    expect(buildGradeItems([dinhNghia({})], null)).toEqual([]);
  });

  it("PHÂN BIỆT 'được 0 điểm' với 'chưa chấm'", () => {
    // Cả hai đều falsy nên `score || null` sẽ gộp nhầm chúng, biến điểm 0 thành "chưa chấm"
    // và làm sai luôn GPA. Đây là cái bẫy dễ mắc nhất khi dọn đoạn này.
    const items = buildGradeItems(
      [dinhNghia({ _id: "a" }), dinhNghia({ _id: "b" })],
      hocSinh({ a: { score: 0 } })
    );

    expect(items[0]).toMatchObject({ score: 0, status: "Graded" });
    expect(items[1]).toMatchObject({ score: null, status: "Not Submitted" });
  });

  it("thiếu maxScore/weight thì dùng mặc định 10", () => {
    const [item] = buildGradeItems(
      [dinhNghia({ maxScore: undefined, weight: undefined })],
      hocSinh({})
    );
    expect(item).toMatchObject({ maxScore: 10, weight: 10 });
  });

  it("giữ lại nhận xét của giáo viên", () => {
    const [item] = buildGradeItems(
      [dinhNghia({ _id: "a" })],
      hocSinh({ a: { score: 9, feedback: "Làm tốt" } })
    );
    expect(item.feedback).toBe("Làm tốt");
  });
});

describe("computeGradeStats — GPA", () => {
  it("trung bình có trọng số, không phải trung bình cộng", () => {
    // (9*30 + 6*10) / (30+10) = 330/40 = 8,25 -> 8,3
    const stats = computeGradeStats(
      [muc({ score: 9, weight: 30 }), muc({ score: 6, weight: 10 })],
      null
    );
    expect(stats.gpa).toBe(8.3);
  });

  it("CHỈ chia cho trọng số của đầu điểm ĐÃ CHẤM", () => {
    // Nếu chia cho tổng trọng số cả lớp thì GPA sẽ là 9*10/60 = 1,5 — học sinh giỏi bỗng
    // thành yếu chỉ vì giáo viên chưa chấm xong. Chốt lại để không ai "sửa cho đúng công
    // thức trường học" mà làm hỏng.
    const stats = computeGradeStats(
      [muc({ score: 9, weight: 10 }), muc({ score: null, status: "Not Submitted", weight: 50 })],
      null
    );
    expect(stats.gpa).toBe(9);
    expect(stats.gradedCount).toBe(1);
  });

  it("chưa có đầu điểm nào được chấm thì GPA là null, không phải 0", () => {
    // 0 nghĩa là "được 0 điểm"; null nghĩa là "chưa có gì để tính". Màn hình hiển thị khác nhau.
    const stats = computeGradeStats([muc({ score: null, status: "Not Submitted" })], null);
    expect(stats.gpa).toBeNull();
  });

  it("ưu tiên GPA do máy chủ tính", () => {
    const stats = computeGradeStats([muc({ score: 5, weight: 10 })], hocSinh({}, 7.5));
    expect(stats.gpa).toBe(7.5);
  });

  it("tính trung bình riêng cho bài tập và cho thi/quiz", () => {
    const stats = computeGradeStats(
      [
        muc({ score: 8, category: "Assignment" }),
        muc({ score: 6, category: "Assignment" }),
        muc({ score: 9, category: "Exam" }),
        muc({ score: 7, category: "Quiz" }),
      ],
      null
    );
    expect(stats.assignmentAvg).toBe(7);
    expect(stats.examAvg).toBe(8);
  });

  it("không có bài tập nào được chấm thì trung bình là null", () => {
    const stats = computeGradeStats([muc({ score: 9, category: "Exam" })], null);
    expect(stats.assignmentAvg).toBeNull();
    expect(stats.examAvg).toBe(9);
  });

  it("bảng điểm rỗng không làm sập, không chia cho 0", () => {
    const stats = computeGradeStats([], null);
    expect(stats.gpa).toBeNull();
    expect(stats.gradedCount).toBe(0);
    expect(Number.isFinite(stats.overallProgress)).toBe(true);
  });
});

describe("filterAndSortGrades", () => {
  const duLieu = [
    muc({ _id: "1", title: "Bài tập 1", score: 6, category: "Assignment" }),
    muc({ _id: "2", title: "Kiểm tra giữa kỳ", score: 9, category: "Exam" }),
    muc({ _id: "3", title: "Quiz nhanh", score: null, status: "Not Submitted", category: "Quiz" }),
  ];

  it("mặc định xếp điểm cao trước; chưa chấm dồn xuống cuối", () => {
    const kq = filterAndSortGrades(duLieu, DEFAULT_GRADE_FILTERS);
    expect(kq.map((g) => g._id)).toEqual(["2", "1", "3"]);
  });

  it("xếp theo tên dùng thứ tự tiếng Việt", () => {
    const kq = filterAndSortGrades(duLieu, { ...DEFAULT_GRADE_FILTERS, sortBy: "name_asc" });
    expect(kq.map((g) => g.title)).toEqual(["Bài tập 1", "Kiểm tra giữa kỳ", "Quiz nhanh"]);
  });

  it("lọc theo loại và theo trạng thái", () => {
    expect(
      filterAndSortGrades(duLieu, { ...DEFAULT_GRADE_FILTERS, categoryFilter: "Exam" })
    ).toHaveLength(1);
    expect(
      filterAndSortGrades(duLieu, { ...DEFAULT_GRADE_FILTERS, statusFilter: "Not Submitted" })
    ).toHaveLength(1);
  });

  it("tìm kiếm theo tiêu đề, không phân biệt hoa thường", () => {
    const kq = filterAndSortGrades(duLieu, { ...DEFAULT_GRADE_FILTERS, searchQuery: "quiz" });
    expect(kq.map((g) => g._id)).toEqual(["3"]);
  });

  it("không đụng vào mảng đầu vào — nó là dữ liệu trong cache dùng chung", () => {
    const truoc = duLieu.map((g) => g._id);
    filterAndSortGrades(duLieu, { ...DEFAULT_GRADE_FILTERS, sortBy: "lowest" });
    expect(duLieu.map((g) => g._id)).toEqual(truoc);
  });
});
