// Test cho lessonBlockProgress.js — TÍNH NĂNG MỚI (đặc tả nghiệp vụ mục 1). Logic thuần.
import { describe, it, expect } from "vitest";
import {
  computeWatchedUnionSeconds,
  isVideoBlockComplete,
  isDocumentBlockComplete,
  isQuizBlockComplete,
  computeLessonCompletion,
} from "#modules/lesson/lessonBlockProgress.js";

describe("computeWatchedUnionSeconds — union các đoạn đã xem, không cộng dồn trùng", () => {
  it("1 đoạn đơn giản", () => {
    expect(computeWatchedUnionSeconds([{ start: 0, end: 100 }])).toBe(100);
  });

  it("Nhiều đoạn KHÔNG chồng lấn → cộng dồn", () => {
    expect(
      computeWatchedUnionSeconds([
        { start: 0, end: 50 },
        { start: 100, end: 150 },
      ])
    ).toBe(100);
  });

  it("BUG GIỐNG PATTERN ĐÃ SỬA Ở ATTENDANCE — tua đi tua lại (đoạn chồng lấn) → hợp nhất, không cộng dồn gấp đôi", () => {
    expect(
      computeWatchedUnionSeconds([
        { start: 0, end: 60 },
        { start: 30, end: 90 }, // chồng 30s với đoạn trên
      ])
    ).toBe(90); // Không phải 60+60=120
  });

  it("Tua nhanh tới cuối (đoạn rất ngắn ở cuối video) không được tính là đã xem hết", () => {
    // Video 600s, chỉ xem 0-10s rồi tua thẳng bấm nút "xem xong" ở giây 599-600.
    const watched = computeWatchedUnionSeconds([
      { start: 0, end: 10 },
      { start: 599, end: 600 },
    ]);
    expect(watched).toBe(11); // Chỉ 11s thật, không phải 600s
  });

  it("Mảng rỗng → 0", () => {
    expect(computeWatchedUnionSeconds([])).toBe(0);
  });
});

describe("isVideoBlockComplete — ngưỡng 80%", () => {
  it("Đạt đúng 80% → hoàn thành", () => {
    expect(isVideoBlockComplete(80, 100)).toBe(true);
  });
  it("Dưới 80% → chưa hoàn thành", () => {
    expect(isVideoBlockComplete(79.9, 100)).toBe(false);
  });
  it("durationSeconds = 0 hoặc thiếu → không tính (false), tránh chia cho 0", () => {
    expect(isVideoBlockComplete(50, 0)).toBe(false);
    expect(isVideoBlockComplete(50, null)).toBe(false);
  });
});

describe("isDocumentBlockComplete — ngưỡng 30 giây", () => {
  it("Đủ 30s → hoàn thành", () => {
    expect(isDocumentBlockComplete(30)).toBe(true);
  });
  it("Dưới 30s → chưa hoàn thành", () => {
    expect(isDocumentBlockComplete(29)).toBe(false);
  });
});

describe("isQuizBlockComplete — ngưỡng 70%", () => {
  it("Đạt 70% → hoàn thành", () => {
    expect(isQuizBlockComplete(70)).toBe(true);
  });
  it("Dưới 70% → chưa hoàn thành", () => {
    expect(isQuizBlockComplete(69.9)).toBe(false);
  });
  it("Chưa làm bài (null) → chưa hoàn thành", () => {
    expect(isQuizBlockComplete(null)).toBe(false);
  });
});

describe("computeLessonCompletion", () => {
  it("BR-1.3 — Lesson không có block bắt buộc nào → tự động COMPLETED", () => {
    const lessonBlocks = [{ _id: "b1", isRequired: false }];
    expect(computeLessonCompletion(lessonBlocks, [])).toEqual({ completed: true, progress: 100 });
  });

  it("Lesson rỗng (0 block) → tự động COMPLETED", () => {
    expect(computeLessonCompletion([], [])).toEqual({ completed: true, progress: 100 });
  });

  it("Chỉ xét block BẮT BUỘC — block tùy chọn chưa xong không cản hoàn thành", () => {
    const lessonBlocks = [
      { _id: "b1", isRequired: true },
      { _id: "b2", isRequired: false },
    ];
    const progress = [{ blockId: "b1", completed: true }]; // b2 chưa làm, nhưng optional
    expect(computeLessonCompletion(lessonBlocks, progress)).toEqual({
      completed: true,
      progress: 100,
    });
  });

  it("2/3 block bắt buộc xong → progress=67, completed=false", () => {
    const lessonBlocks = [
      { _id: "b1", isRequired: true },
      { _id: "b2", isRequired: true },
      { _id: "b3", isRequired: true },
    ];
    const progress = [
      { blockId: "b1", completed: true },
      { blockId: "b2", completed: true },
      { blockId: "b3", completed: false },
    ];
    const result = computeLessonCompletion(lessonBlocks, progress);
    expect(result.completed).toBe(false);
    expect(result.progress).toBe(67);
  });

  it("Chưa có tiến độ nào ghi nhận → progress=0", () => {
    const lessonBlocks = [{ _id: "b1", isRequired: true }];
    expect(computeLessonCompletion(lessonBlocks, [])).toEqual({ completed: false, progress: 0 });
  });
});
