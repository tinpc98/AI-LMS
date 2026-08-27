import type {
  ClassRecord,
  ConflictCheckResult,
  AccountRecord,
  CourseRecord,
} from "./teacherAssignment.types";
import type { AvailabilitySchedule } from "../../interface/userInterface";

/**
 * Parses time string (e.g. "07:30" or "19:00") into minutes from midnight.
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [hoursStr, minutesStr] = timeStr.trim().split(":");
  const hours = parseInt(hoursStr, 10) || 0;
  const minutes = parseInt(minutesStr, 10) || 0;
  return hours * 60 + minutes;
};

/**
 * Checks if two time intervals [startA, endA] and [startB, endB] overlap.
 */
export const timeRangesOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean => {
  const minStartA = parseTimeToMinutes(startA);
  const minEndA = parseTimeToMinutes(endA);
  const minStartB = parseTimeToMinutes(startB);
  const minEndB = parseTimeToMinutes(endB);

  return minStartA < minEndB && minStartB < minEndA;
};

/**
 * Formats schedule days list.
 */
export const formatScheduleDays = (days: string[] = []): string => {
  if (!days || days.length === 0) return "—";
  return days.join(", ");
};

/**
 * Formats time range.
 */
export const formatScheduleTime = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) return "—";
  return `${startTime} - ${endTime}`;
};

/**
 * Calculates teaching load (number of assigned classes) for each teacher.
 */
export const calculateTeachingLoad = (classes: ClassRecord[]): Record<string, number> => {
  const loadMap: Record<string, number> = {};

  for (const c of classes) {
    if (c.teacherId) {
      loadMap[c.teacherId] = (loadMap[c.teacherId] || 0) + 1;
    }
  }

  return loadMap;
};

/**
 * Trả về tên môn học (Subject) của một Course, nếu backend đã populate subjectId.
 * Course.subjectId có thể là chuỗi id thô (chưa populate) — khi đó không đủ dữ liệu để
 * so khớp, trả về undefined thay vì đoán.
 */
export const getCourseSubjectName = (course?: CourseRecord): string | undefined => {
  const subject = course?.subjectId as unknown;
  if (subject && typeof subject === "object" && "name" in subject) {
    return (subject as { name?: string }).name;
  }
  return undefined;
};

/**
 * So khớp GẦN ĐÚNG (không phân biệt hoa/thường, cho phép chứa nhau) giữa tên môn học của
 * lớp và danh sách teachingSubjects giáo viên tự khai (text tự do, không ref tới Subject
 * catalog — xem docs/reviews gap analysis). Chỉ dùng để GỢI Ý sắp xếp thứ tự, không dùng
 * để ẩn giáo viên khỏi danh sách, vì so khớp text tự do có thể sai/thiếu.
 */
export const teacherMatchesSubject = (teacher: AccountRecord, subjectName?: string): boolean => {
  if (!subjectName || !teacher.teachingSubjects?.length) return false;
  const normalized = subjectName.trim().toLowerCase();
  if (!normalized) return false;
  return teacher.teachingSubjects.some((s) => {
    const value = (s || "").trim().toLowerCase();
    if (!value) return false;
    return value === normalized || value.includes(normalized) || normalized.includes(value);
  });
};

const DAY_SHORT_LABEL: Record<string, string> = {
  Monday: "T2",
  Tuesday: "T3",
  Wednesday: "T4",
  Thursday: "T5",
  Friday: "T6",
  Saturday: "T7",
  Sunday: "CN",
};

/**
 * Tóm tắt lịch rảnh giáo viên thành chuỗi ngắn, vd "T2, T4, T6" — dùng để hiển thị trong
 * danh sách chọn giáo viên khi xếp lớp.
 */
export const formatAvailabilitySummary = (schedule?: AvailabilitySchedule | null): string => {
  if (!schedule) return "Chưa cập nhật lịch rảnh";
  const availableDays = Object.entries(schedule)
    .filter(([, info]) => info?.available)
    .map(([day]) => DAY_SHORT_LABEL[day] || day);
  return availableDays.length > 0 ? availableDays.join(", ") : "Chưa cập nhật lịch rảnh";
};

export interface TeacherOptionData {
  value: string;
  searchValue: string;
  teacher: AccountRecord;
  load: number;
  matchesSubject: boolean;
}

/**
 * Gom dữ liệu hiển thị cho danh sách chọn giáo viên, ưu tiên (sắp trước) giáo viên có
 * chuyên môn khớp với môn học của lớp — vẫn giữ nguyên toàn bộ giáo viên trong danh sách,
 * chỉ đổi thứ tự, để admin luôn có toàn quyền chọn.
 */
export const buildTeacherOptionsData = (
  teachers: AccountRecord[],
  teachingLoadMap: Record<string, number>,
  subjectName?: string
): TeacherOptionData[] => {
  const data = teachers.map((teacher) => ({
    value: teacher.id,
    searchValue: `${teacher.fullName} ${teacher.email}`.toLowerCase(),
    teacher,
    load: teachingLoadMap[teacher.id] || 0,
    matchesSubject: teacherMatchesSubject(teacher, subjectName),
  }));

  return [...data].sort((a, b) => Number(b.matchesSubject) - Number(a.matchesSubject));
};

/**
 * Checks if candidate teacher has a schedule conflict with targetClass.
 */
export const checkScheduleConflict = (
  targetClass: ClassRecord,
  candidateTeacherId: string,
  allClasses: ClassRecord[]
): ConflictCheckResult => {
  if (!candidateTeacherId || !targetClass || !targetClass.schedule) {
    return { hasConflict: false };
  }

  const targetDays = targetClass.schedule.days.map((d) => d.toLowerCase().trim());

  // Find all other classes assigned to candidate teacher
  const teacherClasses = allClasses.filter(
    (c) => c.id !== targetClass.id && c.teacherId === candidateTeacherId
  );

  for (const otherClass of teacherClasses) {
    if (!otherClass.schedule) continue;

    const commonDays = otherClass.schedule.days.filter((day) =>
      targetDays.includes(day.toLowerCase().trim())
    );

    if (commonDays.length > 0) {
      const isOverlap = timeRangesOverlap(
        targetClass.schedule.startTime,
        targetClass.schedule.endTime,
        otherClass.schedule.startTime,
        otherClass.schedule.endTime
      );

      if (isOverlap) {
        return {
          hasConflict: true,
          conflictingClass: otherClass,
          commonDays,
          message: "Teacher already has another class at this time.",
        };
      }
    }
  }

  return { hasConflict: false };
};
