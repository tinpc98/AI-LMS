// Chi tiết lớp học (góc nhìn học sinh).
//
// CHUYỂN SANG REACT QUERY (Wave 5, nhóm A của react-hooks/set-state-in-effect).
//
// Bản cũ cầm 6 ô state và gọi 4 nhóm API trong một useEffect. Phần ghép dữ liệu đã tách sang
// classDetail.service.ts; ở đây chỉ còn phần React.
//
// ĐÃ BỎ setSubmittedAssignmentIds khỏi giá trị trả về. Nó phơi setState của một ô state ra
// ngoài cho nơi gọi tự sửa — nhưng grep toàn bộ src cho thấy KHÔNG AI dùng. Với React Query
// thì việc này còn sai về nguyên tắc: đó là dữ liệu máy chủ, sửa cục bộ sẽ bị ghi đè ngay lần
// đồng bộ kế tiếp mà không báo gì. Muốn cập nhật thì gọi refetch.
import { useQuery } from "@tanstack/react-query";
import { fetchClassDetail } from "../classDetail.service";
import { queryKeys } from "../../../shared/api/queryKeys";
import type { IClass } from "../../../interface/ClassInterface";
import type { ILesson } from "../../../interface/lessonInterface";
import type { IAssignment } from "../../../interface/assignmentInterface";

interface UseClassDetailReturn {
  classInfo: IClass | null;
  lessons: ILesson[];
  assignments: IAssignment[];
  submittedAssignmentIds: string[];
  submissionsMap: Record<string, any>;
  isLoading: boolean;
  errorMsg: string;
  refetch: () => void;
}

const FALLBACK_ERROR = "Không thể tải thông tin lớp học.";

export const useClassDetail = (classId?: string): UseClassDetailReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.class.detail(classId),
    queryFn: () => fetchClassDetail(classId!),
    // Không có classId thì không có gì để hỏi. Bản cũ dùng `if (!classId) return` giữa chừng
    // effect, để lại isLoading=true vĩnh viễn — trang quay vòng mãi không dừng.
    enabled: !!classId,
  });

  const serverMessage = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;

  return {
    classInfo: data?.classInfo ?? null,
    lessons: data?.lessons ?? [],
    assignments: data?.assignments ?? [],
    submittedAssignmentIds: data?.submittedAssignmentIds ?? [],
    submissionsMap: data?.submissionsMap ?? {},
    // `isLoading` của React Query là false khi query bị tắt (enabled: false) — đúng với ý
    // "không có gì đang chạy", và cũng là chỗ sửa được bệnh quay vòng vĩnh viễn nói trên.
    isLoading,
    errorMsg: error ? serverMessage || FALLBACK_ERROR : "",
    refetch,
  };
};

export default useClassDetail;
