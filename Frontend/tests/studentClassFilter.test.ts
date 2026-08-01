// Chốt quy tắc lọc/sắp xếp danh sách lớp của học sinh.
//
// Trước Wave 5, 50 dòng logic này nằm lẫn trong useStudentClasses cùng với useState/useEffect
// gọi API, nên muốn kiểm phải dựng React và mock mạng — và vì thế nó chưa từng có test nào.
// Tách thành hàm thuần rồi thì kiểm bằng một lời gọi hàm.
import { describe, it, expect } from "vitest";
import {
  DEFAULT_FILTERS,
  collectDistinct,
  filterAndSortClasses,
} from "../src/features/class/utils/studentClassFilter";
import type { IStudentClass, StudentClassFilterOptions } from "../src/types/studentClass";

const lop = (over: Partial<IStudentClass>): IStudentClass =>
  ({
    _id: Math.random().toString(36).slice(2),
    className: "Lớp mặc định",
    status: "Active",
    ...over,
  }) as IStudentClass;

const withFilters = (over: Partial<StudentClassFilterOptions>): StudentClassFilterOptions => ({
  ...DEFAULT_FILTERS,
  ...over,
});

const danhSach: IStudentClass[] = [
  lop({
    className: "Toán 12A",
    classCode: "T12A",
    subject: "Toán",
    semester: "HK1",
    status: "Active",
    startDate: "2026-01-10",
  }),
  lop({
    className: "Đại số nâng cao",
    classCode: "DSNC",
    subject: "Toán",
    semester: "HK2",
    status: "Completed",
    startDate: "2026-03-01",
  }),
  lop({
    className: "Vật lý 11B",
    classCode: "L11B",
    subject: "Lý",
    semester: "HK1",
    status: "Active",
    startDate: "2026-02-15",
  }),
];

const ten = (list: IStudentClass[]) => list.map((c) => c.className);

describe("collectDistinct", () => {
  it("gom các giá trị khác nhau, không trùng lặp", () => {
    expect(collectDistinct(danhSach, "subject")).toEqual(["Toán", "Lý"]);
    expect(collectDistinct(danhSach, "semester")).toEqual(["HK1", "HK2"]);
  });

  it("bỏ qua giá trị rỗng và thiếu — ô chọn không được có mục trống", () => {
    const co = [lop({ subject: "Toán" }), lop({ subject: "" }), lop({ subject: undefined })];
    expect(collectDistinct(co, "subject")).toEqual(["Toán"]);
  });

  it("danh sách rỗng trả về mảng rỗng", () => {
    expect(collectDistinct([], "subject")).toEqual([]);
  });
});

describe("filterAndSortClasses — tìm kiếm", () => {
  it("khớp theo tên lớp, không phân biệt hoa thường", () => {
    const kq = filterAndSortClasses(danhSach, withFilters({ search: "vật lý" }));
    expect(ten(kq)).toEqual(["Vật lý 11B"]);
  });

  it("khớp cả theo mã lớp và theo môn", () => {
    expect(ten(filterAndSortClasses(danhSach, withFilters({ search: "DSNC" })))).toEqual([
      "Đại số nâng cao",
    ]);
    // "Toán" là môn của hai lớp, kể cả lớp mà tên không chứa chữ "Toán"
    expect(ten(filterAndSortClasses(danhSach, withFilters({ search: "toán" })))).toEqual([
      "Đại số nâng cao",
      "Toán 12A",
    ]);
  });

  it("chuỗi tìm kiếm chỉ có khoảng trắng thì coi như không lọc", () => {
    expect(filterAndSortClasses(danhSach, withFilters({ search: "   " }))).toHaveLength(3);
  });

  it("không khớp gì thì trả mảng rỗng, không phải toàn bộ", () => {
    expect(filterAndSortClasses(danhSach, withFilters({ search: "Hóa học" }))).toEqual([]);
  });
});

describe("filterAndSortClasses — bộ lọc", () => {
  it('"ALL" nghĩa là không lọc trường đó', () => {
    expect(filterAndSortClasses(danhSach, DEFAULT_FILTERS)).toHaveLength(3);
  });

  it("lọc theo trạng thái, học kỳ, môn", () => {
    expect(ten(filterAndSortClasses(danhSach, withFilters({ status: "Completed" })))).toEqual([
      "Đại số nâng cao",
    ]);
    expect(filterAndSortClasses(danhSach, withFilters({ semester: "HK1" }))).toHaveLength(2);
    expect(filterAndSortClasses(danhSach, withFilters({ subject: "Lý" }))).toHaveLength(1);
  });

  it("nhiều bộ lọc cùng lúc thì phải thoả TẤT CẢ", () => {
    const kq = filterAndSortClasses(
      danhSach,
      withFilters({ subject: "Toán", semester: "HK1", status: "Active" })
    );
    expect(ten(kq)).toEqual(["Toán 12A"]);
  });
});

describe("filterAndSortClasses — sắp xếp", () => {
  it("theo tên, dùng thứ tự chữ cái tiếng Việt", () => {
    // Chốt locale "vi": "Đ" phải đứng sau "D" và trước "E", không phải cuối bảng như khi so
    // sánh theo mã ký tự. Đây là lý do phải truyền "vi" vào localeCompare.
    expect(ten(filterAndSortClasses(danhSach, withFilters({ sortBy: "name_asc" })))).toEqual([
      "Đại số nâng cao",
      "Toán 12A",
      "Vật lý 11B",
    ]);
    expect(ten(filterAndSortClasses(danhSach, withFilters({ sortBy: "name_desc" })))).toEqual([
      "Vật lý 11B",
      "Toán 12A",
      "Đại số nâng cao",
    ]);
  });

  it("theo ngày bắt đầu, cả hai chiều", () => {
    expect(ten(filterAndSortClasses(danhSach, withFilters({ sortBy: "date_asc" })))).toEqual([
      "Toán 12A",
      "Vật lý 11B",
      "Đại số nâng cao",
    ]);
    expect(ten(filterAndSortClasses(danhSach, withFilters({ sortBy: "date_desc" })))).toEqual([
      "Đại số nâng cao",
      "Vật lý 11B",
      "Toán 12A",
    ]);
  });

  it("lớp thiếu ngày bắt đầu vẫn xếp được, không ném lỗi", () => {
    const co = [lop({ className: "B", startDate: "2026-01-01" }), lop({ className: "A" })];
    expect(ten(filterAndSortClasses(co, withFilters({ sortBy: "date_asc" })))).toEqual(["A", "B"]);
  });
});

describe("filterAndSortClasses — không được đụng vào dữ liệu gốc", () => {
  it("giữ nguyên thứ tự và nội dung mảng đầu vào", () => {
    // Quan trọng sau khi chuyển sang React Query: mảng đầu vào giờ là dữ liệu trong cache,
    // dùng chung cho mọi component. Sắp xếp tại chỗ sẽ âm thầm đảo lộn danh sách ở nơi khác.
    const goc = [...danhSach];
    const truoc = ten(danhSach);

    filterAndSortClasses(danhSach, withFilters({ sortBy: "name_desc" }));

    expect(ten(danhSach)).toEqual(truoc);
    expect(danhSach).toEqual(goc);
  });

  it("trả về mảng mới chứ không phải chính mảng cũ", () => {
    expect(filterAndSortClasses(danhSach, DEFAULT_FILTERS)).not.toBe(danhSach);
  });
});
