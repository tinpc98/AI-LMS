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

/**
 * Một mục "sắp diễn ra" cho mỗi ngày trong lịch học của lớp.
 *
 * KHÔNG đặt scheduledStart và countdownText: chúng đòi hỏi một mốc thời gian cụ thể mà ở đây
 * không có. Để trống thì LiveSessionCard hiện lịch học thay vì một giờ bịa.
 */
export const buildUpcomingFromSchedule = (
  schedule: ClassSchedule | undefined,
  classId: string | undefined,
  teacherName: string
): IExtendedLiveSession[] => {
  const days = schedule?.days;
  if (!Array.isArray(days) || days.length === 0) return [];

  return days.map((day, idx) => ({
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
