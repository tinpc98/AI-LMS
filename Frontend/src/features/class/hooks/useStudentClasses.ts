// Danh sách lớp của học sinh.
//
// CHUYỂN SANG REACT QUERY (Wave 5, nhóm A của react-hooks/set-state-in-effect).
//
// Bản cũ tự cầm ba ô state classes/loading/error rồi gọi API trong useEffect. Ngoài chuyện
// vi phạm quy tắc lint, cách đó có mấy điểm yếu thật:
//   - Mỗi lần vào lại trang là một lần gọi API, dù dữ liệu vừa lấy xong một giây trước.
//   - Không có cách nào để chỗ khác làm mới danh sách này sau khi ghi dữ liệu.
//   - Vòng đời request tự viết tay: không huỷ khi rời trang, dễ sinh cảnh báo cập nhật state
//     trên component đã gỡ, và hai request chồng nhau thì cái về sau thắng chứ không phải
//     cái mới nhất.
//
// React Query lo hết phần đó. Phần nghiệp vụ (lọc, sắp xếp) đã tách sang studentClassFilter
// để kiểm được mà không cần dựng React.
//
// HỢP ĐỒNG TRẢ VỀ GIỮ NGUYÊN để StudentMyClassesPage không phải sửa gì: `loading` là boolean,
// `error` là chuỗi tiếng Việt hoặc null (không phải object Error).
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import studentClassApi from "../../../api/studentClassApi";
import type { StudentClassFilterOptions } from "../../../types/studentClass";
import { classQueryKeys } from "../class.queryKeys";
import {
  DEFAULT_FILTERS,
  collectDistinct,
  filterAndSortClasses,
} from "../utils/studentClassFilter";

const FALLBACK_ERROR = "Không thể tải danh sách lớp học!";

/** Lấy thông điệp lỗi mà máy chủ gửi kèm; không có thì dùng câu mặc định. */
const toErrorMessage = (error: unknown): string => {
  const serverMessage = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  return serverMessage || FALLBACK_ERROR;
};

export function useStudentClasses() {
  const {
    data: classes = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: classQueryKeys.myClasses,
    queryFn: studentClassApi.fetchMyClasses,
  });

  const [filters, setFilters] = useState<StudentClassFilterOptions>(DEFAULT_FILTERS);

  const availableSubjects = useMemo(() => collectDistinct(classes, "subject"), [classes]);
  const availableSemesters = useMemo(() => collectDistinct(classes, "semester"), [classes]);
  const filteredClasses = useMemo(() => filterAndSortClasses(classes, filters), [classes, filters]);

  const updateFilter = useCallback(
    <K extends keyof StudentClassFilterOptions>(key: K, value: StudentClassFilterOptions[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    []
  );

  const setSearch = useCallback((search: string) => updateFilter("search", search), [updateFilter]);
  const setStatusFilter = useCallback(
    (status: string) => updateFilter("status", status),
    [updateFilter]
  );
  const setSemesterFilter = useCallback(
    (semester: string) => updateFilter("semester", semester),
    [updateFilter]
  );
  const setSubjectFilter = useCallback(
    (subject: string) => updateFilter("subject", subject),
    [updateFilter]
  );
  const setSortBy = useCallback(
    (sortBy: StudentClassFilterOptions["sortBy"]) => updateFilter("sortBy", sortBy),
    [updateFilter]
  );
  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  return {
    classes,
    filteredClasses,
    loading: isLoading,
    error: error ? toErrorMessage(error) : null,
    filters,
    availableSubjects,
    availableSemesters,
    setSearch,
    setStatusFilter,
    setSemesterFilter,
    setSubjectFilter,
    setSortBy,
    resetFilters,
    refetch,
  };
}

export default useStudentClasses;
