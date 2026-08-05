// Suy danh sách buổi học sắp tới từ lịch học THẬT của lớp.
//
// PHÁT HIỆN KHI SỬA (Wave 5): bản cũ trong useStudentLive kiểm tra
// `Array.isArray(classInfo.schedule)`, nhưng model Class ở backend khai báo schedule là một
// OBJECT — `{ days: string[], startTime, endTime }`, không phải mảng. Nghĩa là điều kiện đó
// LUÔN SAI và danh sách buổi sắp tới LUÔN RỖNG. Trạng thái "Sắp diễn ra" của LiveSessionCard
// chưa từng hiện ra với ai.
//
// Bản cũ còn đọc sched.dayOfWeek và sched.time — hai trường không tồn tại ở đâu cả — rồi bịa
// giờ bắt đầu bằng `now + (idx+1) * 3 giờ` và đồng hồ đếm ngược tương ứng. May là nó chưa
// từng chạy; nếu chạy thì học sinh đã canh giờ theo một con số hoàn toàn bịa.
//
// Bản này đọc đúng schema thật và KHÔNG bịa thời gian: chỉ hiện lại lịch học của lớp
// ("Thứ Hai · 08:00 - 10:30"). Giờ bắt đầu cụ thể của từng buổi phải do máy chủ tạo buổi học
// mới có; chừng nào chưa có thì không hiển thị gì thay vì đoán.
import type { IExtendedLiveSession } from "../../types/studentLive";

export interface ClassSchedule {
  days?: string[];
  startTime?: string;
  endTime?: string;
}

/** Tên thứ trong tuần theo enum của backend. */
const DAY_LABEL: Record<string, string> = {
  Monday: "Thứ Hai",
  Tuesday: "Thứ Ba",
  Wednesday: "Thứ Tư",
  Thursday: "Thứ Năm",
  Friday: "Thứ Sáu",
  Saturday: "Thứ Bảy",
  Sunday: "Chủ Nhật",
};

export const formatDay = (day: string): string => DAY_LABEL[day] ?? day;

/** "Thứ Hai · 08:00 - 10:30", hoặc chỉ tên thứ nếu lớp chưa đặt giờ. */
export const formatScheduleText = (day: string, schedule: ClassSchedule): string => {
  const label = formatDay(day);
  const { startTime, endTime } = schedule;
  return startTime && endTime ? `${label} · ${startTime} - ${endTime}` : label;
};

const DAY_TO_NUMBER: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
};

export interface NextSessionInfo {
  dayName: string;
  dateStr: string;
  isToday: boolean;
  isTomorrow: boolean;
  formattedText: string;
  timeText: string;
  allDaysText: string;
}

/**
 * Tìm buổi học tiếp theo gần nhất từ ngày giờ hiện tại dựa vào schedule.days và schedule.startTime/endTime
 */
export const getNextSessionInfo = (
  schedule: ClassSchedule | undefined,
  now: Date = new Date()
): NextSessionInfo | null => {
  const days = schedule?.days;
  if (!Array.isArray(days) || days.length === 0) return null;

  const validDays = days.filter((d) => DAY_TO_NUMBER[d] !== undefined);
  if (validDays.length === 0) return null;

  const allDaysText = validDays.map(formatDay).join(", ");
  const currentDayNum = now.getDay();
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTimeStr = `${String(currentHours).padStart(2, "0")}:${String(currentMinutes).padStart(2, "0")}`;

  const hasTime = schedule?.startTime && schedule?.endTime;
  const timeText = hasTime ? `${schedule?.startTime} - ${schedule?.endTime}` : "Thời gian theo thông báo";

  // Tìm trong vòng 7 ngày tới (offset 0 -> 6)
  for (let offset = 0; offset < 7; offset++) {
    const candidateDate = new Date(now);
    candidateDate.setDate(now.getDate() + offset);
    const candidateDayNum = candidateDate.getDay();

    const matchingDay = validDays.find((d) => DAY_TO_NUMBER[d] === candidateDayNum);
    if (!matchingDay) continue;

    // Nếu là hôm nay, kiểm tra xem giờ học đã trôi qua chưa
    if (offset === 0 && schedule?.endTime) {
      if (currentTimeStr > schedule.endTime) {
        // Buổi hôm nay đã kết thúc, tìm buổi tiếp theo ở ngày sau
        continue;
      }
    }

    const dayName = formatDay(matchingDay);
    const d = String(candidateDate.getDate()).padStart(2, "0");
    const m = String(candidateDate.getMonth() + 1).padStart(2, "0");
    const dateStr = `${d}/${m}`;

    let formattedText = `${dayName} (${dateStr})`;
    if (offset === 0) formattedText = `Hôm nay (${dateStr})`;
    else if (offset === 1) formattedText = `Ngày mai (${dateStr})`;

    return {
      dayName,
      dateStr,
      isToday: offset === 0,
      isTomorrow: offset === 1,
      formattedText,
      timeText,
      allDaysText,
    };
  }

  // Fallback nếu không khớp điều kiện trên
  const firstDay = validDays[0];
  return {
    dayName: formatDay(firstDay),
    dateStr: "",
    isToday: false,
    isTomorrow: false,
    formattedText: formatDay(firstDay),
    timeText,
    allDaysText,
  };
};

/**
 * Một mục "sắp diễn ra" cho mỗi ngày trong lịch học của lớp, sắp xếp theo buổi học gần nhất trước.
 */
export const buildUpcomingFromSchedule = (
  schedule: ClassSchedule | undefined,
  classId: string | undefined,
  teacherName: string
): IExtendedLiveSession[] => {
  const days = schedule?.days;
  if (!Array.isArray(days) || days.length === 0) return [];

  const validDays = days.filter((d) => DAY_TO_NUMBER[d] !== undefined);
  if (validDays.length === 0) return [];

  return validDays.map((day, idx) => ({
    _id: `schedule-${day}`,
    id: `schedule-${day}`,
    classId: classId || "",
    roomName: "",
    meetingRoomId: "",
    sessionNumber: idx + 1,
    title: `Buổi học theo lịch: ${formatDay(day)}`,
    createdBy: "",
    status: "Upcoming",
    isLiveNow: false,
    platform: "Jitsi Meet",
    teacherName,
    scheduleText: formatScheduleText(day, schedule ?? {}),
  })) as IExtendedLiveSession[];
};
