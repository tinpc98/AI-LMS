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
import type { Lesson } from "../lesson/lesson.types";
import type { IAssignment } from "../../interface/assignmentInterface";

export interface ClassDetailData {
  classInfo: IClass | null;
  lessons: Lesson[];
  assignments: IAssignment[];
}

/**
 * Các hình dạng phản hồi khác nhau mà API đang trả về. Đây là nợ kỹ thuật của tầng API chứ
 * không phải thiết kế: getClassById bọc trong data.data, getLessonsByClass thì lúc
 * data.lessons lúc lessons, getAssignmentsByClass lúc là mảng lúc là data.
 */
const unwrapClass = (res: unknown): IClass | null => {
  const body = (res as { data?: { data?: IClass } & IClass })?.data;
  return body?.data ?? (body as IClass) ?? null;
};

const unwrapLessons = (res: unknown): Lesson[] => {
  const r = res as { data?: { lessons?: Lesson[] }; lessons?: Lesson[] };
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
