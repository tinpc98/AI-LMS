// Lọc và sắp xếp danh sách lớp của học sinh.
//
// Tách khỏi useStudentClasses thành hàm thuần vì đây là phần DUY NHẤT trong hook chứa quy
// tắc nghiệp vụ — 4 tầng lọc và 4 kiểu sắp xếp. Nằm trong hook thì muốn kiểm nó phải dựng
// React, mock API, chờ effect; tách ra thì kiểm bằng một lời gọi hàm.
//
// Đây cũng là ranh giới để React Query lo phần lấy dữ liệu mà không đụng gì tới nghiệp vụ.
import type { IStudentClass, StudentClassFilterOptions } from "../../../types/studentClass";

export const DEFAULT_FILTERS: StudentClassFilterOptions = {
  search: "",
  status: "ALL",
  semester: "ALL",
  subject: "ALL",
  sortBy: "name_asc",
};

/** Gom các giá trị khác nhau của một trường để đổ vào ô chọn. Bỏ qua giá trị rỗng. */
export const collectDistinct = (
  classes: IStudentClass[],
  field: "subject" | "semester"
): string[] => {
  const set = new Set<string>();
  for (const item of classes) {
    const value = item[field];
    if (value) set.add(value);
  }
  return Array.from(set);
};

const matchesSearch = (item: IStudentClass, query: string): boolean => {
  const q = query.toLowerCase().trim();
  if (!q) return true;
  return (
    item.className.toLowerCase().includes(q) ||
    !!item.classCode?.toLowerCase().includes(q) ||
    !!item.subject?.toLowerCase().includes(q)
  );
};

const compareBy = (sortBy: StudentClassFilterOptions["sortBy"]) => {
  const toTime = (value?: string) => new Date(value || 0).getTime();
  return (a: IStudentClass, b: IStudentClass): number => {
    switch (sortBy) {
      // localeCompare với locale "vi" để "Đ" đứng đúng chỗ trong bảng chữ cái tiếng Việt.
      case "name_asc":
        return a.className.localeCompare(b.className, "vi");
      case "name_desc":
        return b.className.localeCompare(a.className, "vi");
      case "date_asc":
        return toTime(a.startDate) - toTime(b.startDate);
      case "date_desc":
        return toTime(b.startDate) - toTime(a.startDate);
      default:
        return 0;
    }
  };
};

/**
 * Trả về danh sách MỚI đã lọc và sắp xếp. Không đụng tới mảng đầu vào — dữ liệu gốc thuộc
 * quyền quản lý của React Query, sắp xếp tại chỗ sẽ làm hỏng cache dùng chung.
 */
export const filterAndSortClasses = (
  classes: IStudentClass[],
  filters: StudentClassFilterOptions
): IStudentClass[] =>
  classes
    .filter(
      (item) =>
        matchesSearch(item, filters.search) &&
        (filters.status === "ALL" || item.status === filters.status) &&
        (filters.semester === "ALL" || item.semester === filters.semester) &&
        (filters.subject === "ALL" || item.subject === filters.subject)
    )
    .sort(compareBy(filters.sortBy));
