// Gom dữ liệu cho màn hình chi tiết lớp học của học sinh.
//
// Tách khỏi useClassDetail để hook chỉ còn lo phần React, còn phần "gọi API nào, ghép ra sao"
// nằm ở đây và kiểm được bằng mock API thuần, không cần dựng component.
import { classApi } from "../../api/classApi";
import { lessonApi } from "../../api/lessonApi";
import assignmentApi from "../../api/assignmentApi";
import announcementApi from "../../api/announcementApi";
import { getCurrentUserId } from "../../shared/utils/authToken";
import type { IClass } from "../../interface/ClassInterface";
import type { ILesson } from "../../interface/lessonInterface";
import type { IAssignment } from "../../interface/assignmentInterface";

export interface ClassDetailData {
  classInfo: IClass | null;
  lessons: ILesson[];
  assignments: IAssignment[];
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

export const fetchClassDetail = async (classId: string): Promise<ClassDetailData> => {
  const [classRes, lessonRes, assignmentRes, announcementsRes] = await Promise.all([
    classApi.getClassById(classId),
    lessonApi.getLessonsByClass(classId).catch(() => ({ data: { lessons: [] } })),
    assignmentApi.getAssignmentsByClass(classId).catch(() => []),
    announcementApi.getAnnouncementsByClass(classId).catch(() => []),
  ]);

  const assignments = unwrapAssignments(assignmentRes);

  const classInfo = unwrapClass(classRes);
  if (classInfo) {
    (classInfo as any).announcements = announcementsRes;
  }

  return {
    classInfo,
    lessons: unwrapLessons(lessonRes),
    assignments,
  };
};
