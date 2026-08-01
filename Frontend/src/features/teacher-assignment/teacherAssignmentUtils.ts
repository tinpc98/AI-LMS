import type { ClassRecord, ConflictCheckResult } from "./teacherAssignment.types";

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
