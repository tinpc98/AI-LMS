// Chốt việc suy buổi học sắp tới từ lịch học của lớp.
//
// Test đầu tiên ở đây quan trọng hơn cả: nó chốt rằng hàm đọc ĐÚNG schema thật của backend
// (schedule là object { days, startTime, endTime }). Bản cũ kiểm tra Array.isArray(schedule)
// nên luôn rỗng — tính năng "Sắp diễn ra" chưa từng hiện ra với ai, và không có test nào bắt
// được vì cũng chẳng có test nào.
import { describe, it, expect } from "vitest";
import {
  buildUpcomingFromSchedule,
  formatDay,
  formatScheduleText,
} from "../src/features/live-session/upcomingSessions";

const schedule = {
  days: ["Monday", "Wednesday"],
  startTime: "08:00",
  endTime: "10:30",
};

describe("buildUpcomingFromSchedule — đọc đúng schema của backend", () => {
  it("schedule là OBJECT có mảng days, không phải mảng", () => {
    const kq = buildUpcomingFromSchedule(schedule, "c1", "Cô Lan");

    expect(kq).toHaveLength(2);
    expect(kq[0].title).toBe("Buổi học theo lịch: Thứ Hai");
    expect(kq[1].title).toBe("Buổi học theo lịch: Thứ Tư");
  });

  it("KHÔNG bịa giờ bắt đầu hay đồng hồ đếm ngược", () => {
    // Đây là điểm mấu chốt. Bản cũ đặt scheduledStart = now + (idx+1)*3 giờ và countdownText
    // "Còn 3 giờ 0 phút", bất kể lịch thật là thứ mấy. Học sinh có thể canh giờ theo đó.
    const kq = buildUpcomingFromSchedule(schedule, "c1", "Cô Lan");

    for (const item of kq) {
      expect(item.scheduledStart).toBeUndefined();
      expect(item.countdownText).toBeUndefined();
      expect(item.isStartingSoon).toBeUndefined();
    }
  });

  it("mang theo lịch học dạng chữ để màn hình hiện thay cho giờ suy đoán", () => {
    const kq = buildUpcomingFromSchedule(schedule, "c1", "Cô Lan");
    expect(kq[0].scheduleText).toBe("Thứ Hai · 08:00 - 10:30");
  });

  it("gắn đúng classId và tên giảng viên", () => {
    const kq = buildUpcomingFromSchedule(schedule, "c1", "Cô Lan");
    expect(kq[0]).toMatchObject({ classId: "c1", teacherName: "Cô Lan", status: "Upcoming" });
  });
});

describe("buildUpcomingFromSchedule — trường hợp biên", () => {
  it.each([
    ["không có schedule", undefined],
    ["schedule rỗng", {}],
    ["days rỗng", { days: [] }],
    ["days không phải mảng", { days: "Monday" as unknown as string[] }],
  ])("%s thì trả mảng rỗng, không ném lỗi", (_label, input) => {
    expect(buildUpcomingFromSchedule(input, "c1", "Cô Lan")).toEqual([]);
  });

  it("lớp chưa đặt giờ thì chỉ hiện tên thứ, không hiện dấu gạch trống", () => {
    const kq = buildUpcomingFromSchedule({ days: ["Friday"] }, "c1", "Cô Lan");
    expect(kq[0].scheduleText).toBe("Thứ Sáu");
  });
});

describe("formatDay / formatScheduleText", () => {
  it.each([
    ["Monday", "Thứ Hai"],
    ["Tuesday", "Thứ Ba"],
    ["Wednesday", "Thứ Tư"],
    ["Thursday", "Thứ Năm"],
    ["Friday", "Thứ Sáu"],
    ["Saturday", "Thứ Bảy"],
    ["Sunday", "Chủ Nhật"],
  ])("%s -> %s", (input, expected) => {
    expect(formatDay(input)).toBe(expected);
  });

  it("giá trị lạ thì giữ nguyên, không thành undefined", () => {
    expect(formatDay("Funday")).toBe("Funday");
  });

  it("thiếu một trong hai mốc giờ thì bỏ luôn phần giờ", () => {
    expect(formatScheduleText("Monday", { startTime: "08:00" })).toBe("Thứ Hai");
    expect(formatScheduleText("Monday", { endTime: "10:30" })).toBe("Thứ Hai");
  });
});
