// Danh sách quản trị có phân trang + thùng rác.
//
// Ba trang AccountManagementPage, CourseManagementPage và ClassManagementPage có cùng một
// hình dạng: gọi API kèm bộ lọc, đổi tab thì đổi nguồn (đang dùng / thùng rác), sau mỗi thao
// tác thêm-sửa-xoá thì nạp lại. Trước Wave 5 mỗi trang chép lại nguyên đoạn đó bằng
// useState + useEffect.
//
// Gộp vì chúng thật sự trùng nhau chứ không phải chỉ "trông giống": cả ba service đều trả về
// đúng envelope ApiResponse<T[]> với cùng chữ ký (filters) => Promise. Nếu về sau một trang
// lệch đi, hãy tách nó ra chứ đừng thêm cờ điều kiện vào đây.
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { useEffect } from "react";
import { message } from "antd";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiListResponse<TRecord> {
  success: boolean;
  message?: string;
  data: TRecord[];
  pagination?: Pagination;
}

interface Options<TRecord, TFilters> {
  /** Tên tài nguyên, thành phần đầu của query key: "accounts" | "courses" | "classes". */
  resource: string;
  filters: TFilters;
  /** Đang xem thùng rác hay danh sách đang dùng. Nằm trong query key nên hai tab có cache riêng. */
  isTrash: boolean;
  fetchActive: (filters: TFilters) => Promise<ApiListResponse<TRecord>>;
  fetchTrash: (filters: TFilters) => Promise<ApiListResponse<TRecord>>;
  /** Thông báo hiện khi tải hỏng, giữ nguyên câu chữ của từng trang. */
  errorMessage: string;
}

const EMPTY_PAGINATION: Pagination = { page: 1, limit: 10, total: 0, totalPages: 0 };

export const useAdminListQuery = <TRecord, TFilters>({
  resource,
  filters,
  isTrash,
  fetchActive,
  fetchTrash,
  errorMessage,
}: Options<TRecord, TFilters>) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    // filters nằm trong key: đổi trang hay đổi bộ lọc là một truy vấn khác, và React Query
    // tự nhớ kết quả cũ — quay lại trang trước không phải chờ mạng lần nữa.
    queryKey: queryKeys.adminList.list(resource, isTrash, filters),
    queryFn: async () => {
      const response = await (isTrash ? fetchTrash : fetchActive)(filters);
      // Bản cũ viết `if (response.success) { ...set state... }` và KHÔNG có nhánh else, nghĩa
      // là success=false thì giữ nguyên danh sách cũ, không báo gì. Ở đây coi đó là lỗi:
      // hiện dữ liệu cũ mà không nói gì còn tệ hơn báo lỗi. (Trên thực tế nhánh này gần như
      // không xảy ra — axios đã ném lỗi với mọi mã trạng thái không phải 2xx.)
      if (!response.success) throw new Error(response.message || errorMessage);
      return response;
    },
  });

  // Giữ nguyên thông báo lỗi dạng toast của bản cũ. Ba trang này chưa có chỗ nào hiển thị lỗi
  // cố định trên giao diện, nên đổi sang Alert sẽ là thay đổi thiết kế chứ không phải sửa lỗi.
  useEffect(() => {
    if (error) message.error(errorMessage);
  }, [error, errorMessage]);

  return {
    records: data?.data ?? [],
    pagination: data?.pagination ?? EMPTY_PAGINATION,
    // isFetching chứ không phải isLoading: bản cũ bật cờ loading ở MỌI lần nạp lại, kể cả khi
    // đã có dữ liệu trên màn hình. isLoading chỉ đúng ở lần đầu tiên.
    loading: isLoading || isFetching,
    error,
    refetch,
  };
};
