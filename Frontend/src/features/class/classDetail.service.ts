// Gom dữ liệu cho màn hình chi tiết lớp học của học sinh.
//
// Tách khỏi useClassDetail để hook chỉ còn lo phần React, còn phần "gọi API nào, ghép ra sao"
// nằm ở đây và kiểm được bằng mock API thuần, không cần dựng component.
import { classApi } from "../../api/classApi";
import { lessonApi } from "../../api/lessonApi";
import assignmentApi from "../../api/assignmentApi";
import { getCurrentUserId } from "../../shared/utils/authToken";
import type { IClass } from "../../interface/ClassInterface";
import type { ILesson } from "../../interface/lessonInterface";
import type { IAssignment, ISubmission } from "../../interface/assignmentInterface";

export interface ClassDetailData {
  classInfo: IClass | null;
  lessons: ILesson[];
  assignments: IAssignment[];
  submittedAssignmentIds: string[];
  submissionsMap: Record<string, ISubmission>;
}

/**
 * Chỉ lấy bài giảng đã xuất bản, xếp theo thứ tự giáo viên đặt.
 *
 * Trả về mảng MỚI: dữ liệu gốc nằm trong cache React Query, sắp xếp tại chỗ sẽ đảo lộn danh
 * sách ở mọi component khác đang đọc cùng khoá.
 */
export const selectPublishedLessons = (lessons: ILesson[]): ILesson[] =>
  lessons.filter((l) => l.isPublished).sort((a, b) => (a.order || 0) - (b.order || 0));

/**
 * Các hình dạng phản hồi khác nhau mà API đang trả về. Đây là nợ kỹ thuật của tầng API chứ
 * không phải thiết kế: getClassById bọc trong data.data, getLessonsByClass thì lúc
 * data.lessons lúc lessons, getAssignmentsByClass lúc là mảng lúc là data.
 */
const unwrapClass = (res: unknown): IClass | null => {
  const body = (res as { data?: { data?: IClass } & IClass })?.data;
  return body?.data ?? (body as IClass) ?? null;
};

const unwrapLessons = (res: unknown): ILesson[] => {
  const r = res as { data?: { lessons?: ILesson[] }; lessons?: ILesson[] };
  return r?.data?.lessons ?? r?.lessons ?? [];
};

const unwrapAssignments = (res: unknown): IAssignment[] => {
  if (Array.isArray(res)) return res;
  return (res as { data?: IAssignment[] })?.data ?? [];
};

/**
 * Những bài tập mà học sinh này đã nộp (và chưa rút lại).
 *
 * LƯU Ý VỀ HIỆU NĂNG: gọi một request cho MỖI bài tập (N+1). Lớp có 30 bài tập là 30 request.
 * Giữ nguyên vì backend chưa có endpoint lấy hàng loạt — đã ghi nhận thành việc riêng chứ
 * không sửa lén ở đây. Ít nhất chúng chạy song song và lỗi lẻ được bỏ qua, nên một bài tập
 * hỏng không kéo sập cả trang.
 */
const fetchSubmissionsData = async (assignments: IAssignment[]): Promise<{ submittedIds: string[], submissionsMap: Record<string, ISubmission> }> => {
  const studentId = getCurrentUserId();
  if (!studentId || assignments.length === 0) return { submittedIds: [], submissionsMap: {} };

  const submissionsMap: Record<string, ISubmission> = {};
  const submittedIds: string[] = [];

  const results = await Promise.all(
    assignments.map(async (item) => {
      try {
        const submission = await assignmentApi.getMySubmission(item._id);
        if (submission) {
          submissionsMap[item._id] = submission;
          if (submission.status !== "withdrawn") {
            submittedIds.push(item._id);
          }
        }
      } catch {
        // bài tập chưa nộp trả 404 — đó là câu trả lời, không phải sự cố
      }
    })
  );

  return { submittedIds, submissionsMap };
};

export const fetchClassDetail = async (classId: string): Promise<ClassDetailData> => {
  // Bài giảng và bài tập hỏng thì vẫn hiện được phần còn lại của trang; riêng thông tin lớp
  // hỏng thì không còn gì để hiện, nên để lỗi nổi lên cho React Query bắt.
  const [classRes, lessonRes, assignmentRes] = await Promise.all([
    classApi.getClassById(classId),
    lessonApi.getLessonsByClass(classId).catch(() => ({ data: { lessons: [] } })),
    assignmentApi.getAssignmentsByClass(classId).catch(() => []),
  ]);

  const assignments = unwrapAssignments(assignmentRes);
  const { submittedIds, submissionsMap } = await fetchSubmissionsData(assignments);

  return {
    classInfo: unwrapClass(classRes),
    lessons: selectPublishedLessons(unwrapLessons(lessonRes)),
    assignments,
    submittedAssignmentIds: submittedIds,
    submissionsMap,
  };
};
