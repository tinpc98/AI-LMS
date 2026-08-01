// Bảng điểm của học sinh trong một lớp.
//
// CHUYỂN SANG REACT QUERY (Wave 5, nhóm A). Quy tắc nghiệp vụ đã tách sang
// studentGrade.logic.ts; ở đây chỉ còn phần React.
//
// SỬA HAI BUG:
//
// 1. Nuốt lỗi. Bản cũ dùng `.catch((err) => console.error(...))`, nên API hỏng thì học sinh
//    thấy bảng điểm TRỐNG và không có lời giải thích — trông y hệt "giáo viên chưa chấm".
//    Lỗi giờ được trả ra ngoài để màn hình tự quyết định cách báo.
//
// 2. Phụ thuộc useMemo thiếu. Bản cũ tính stats với deps [gradeItems] nhưng bên trong lại
//    đọc studentGradesData?.avgGPA. Khi máy chủ trả GPA mới mà danh sách đầu điểm không đổi,
//    useMemo giữ nguyên kết quả cũ — học sinh nhìn thấy ĐIỂM TRUNG BÌNH CŨ. Sai kiểu này
//    không bao giờ lộ ra khi bấm thử, chỉ lộ khi dữ liệu thay đổi đúng cách. Nay studentData
//    là tham số tường minh của computeGradeStats nên deps phải liệt kê nó.
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import gradeApi from "../../../api/gradeApi";
import { queryKeys } from "../../../shared/api/queryKeys";
import type { StudentGradeFilterOptions } from "../../../types/studentGrade";
import {
  DEFAULT_GRADE_FILTERS,
  buildGradeItems,
  computeGradeStats,
  filterAndSortGrades,
} from "../studentGrade.logic";

const FALLBACK_ERROR = "Không thể tải bảng điểm.";

export function useStudentGrades(classId?: string) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.class.grades(classId),
    queryFn: async () => {
      const res = await gradeApi.getGradesByStudent("me", classId!);
      return {
        definitions: res.gradeItems || [],
        // API trả về mảng học sinh; gọi với "me" thì chỉ có một phần tử là chính mình.
        studentData: res.students?.[0] ?? null,
      };
    },
    enabled: !!classId,
  });

  const [filters, setFilters] = useState<StudentGradeFilterOptions>(DEFAULT_GRADE_FILTERS);

  // Phụ thuộc thẳng vào `data` chứ KHÔNG tách ra hai biến trung gian kiểu
  // `data?.definitions ?? []`: khi chưa có dữ liệu, mỗi lần render sẽ sinh một mảng rỗng MỚI,
  // useMemo thấy phụ thuộc đổi và tính lại vô ích — đúng cái bẫy vừa sửa ở trên, chỉ đổi
  // hình dạng.
  const studentData = data?.studentData ?? null;

  const gradeItems = useMemo(
    () => buildGradeItems(data?.definitions ?? [], studentData),
    [data?.definitions, studentData]
  );
  const stats = useMemo(
    () => computeGradeStats(gradeItems, studentData),
    [gradeItems, studentData]
  );
  const filteredGradeItems = useMemo(
    () => filterAndSortGrades(gradeItems, filters),
    [gradeItems, filters]
  );

  const updateFilter = useCallback(
    <K extends keyof StudentGradeFilterOptions>(key: K, value: StudentGradeFilterOptions[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => updateFilter("searchQuery", value),
    [updateFilter]
  );
  const handleCategoryFilterChange = useCallback(
    (value: StudentGradeFilterOptions["categoryFilter"]) => updateFilter("categoryFilter", value),
    [updateFilter]
  );
  const handleStatusFilterChange = useCallback(
    (value: StudentGradeFilterOptions["statusFilter"]) => updateFilter("statusFilter", value),
    [updateFilter]
  );
  const handleSortChange = useCallback(
    (value: StudentGradeFilterOptions["sortBy"]) => updateFilter("sortBy", value),
    [updateFilter]
  );

  const serverMessage = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;

  return {
    loading: isLoading,
    error: error ? serverMessage || FALLBACK_ERROR : null,
    filters,
    stats,
    gradeItems,
    filteredGradeItems,
    refetch,
    handleSearchChange,
    handleCategoryFilterChange,
    handleStatusFilterChange,
    handleSortChange,
  };
}

export default useStudentGrades;
