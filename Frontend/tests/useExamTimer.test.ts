// Chốt đồng hồ đếm ngược phòng thi (Wave 7).
//
// Đây là đoạn mã chưa có test mà hậu quả nặng nhất còn lại ở Frontend: nó quyết định học sinh
// còn bao nhiêu thời gian và khi nào bài được nộp tự động. Sai một chiều thì học sinh mất giờ
// oan, sai chiều kia thì được thi thêm.
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useExamTimer from "../src/features/exam/hooks/useExamTimer";

const EXAM_ID = "attempt-1";
const KEY = `exam_endTime_${EXAM_ID}`;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-08-01T10:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

describe("useExamTimer — mốc kết thúc lưu trong localStorage", () => {
  it("ghi mốc kết thúc ngay lần chạy đầu", () => {
    renderHook(() => useExamTimer(600, EXAM_ID));

    const saved = Number(localStorage.getItem(KEY));
    expect(saved).toBe(Date.now() + 600 * 1000);
  });

  it("TẢI LẠI TRANG KHÔNG ĐƯỢC CẤP THÊM GIỜ", () => {
    // Đây là tính chất quan trọng nhất của hook. Nếu mốc kết thúc được tính lại mỗi lần mount,
    // học sinh chỉ cần F5 là có đủ thời gian mới.
    const { unmount } = renderHook(() => useExamTimer(600, EXAM_ID));
    unmount();

    vi.setSystemTime(Date.now() + 300 * 1000); // 5 phút trôi qua
    const { result } = renderHook(() => useExamTimer(600, EXAM_ID));

    expect(result.current.timeLeft).toBe(300); // còn 5 phút, không phải 10
  });

  it("mỗi bài thi có mốc riêng, không đè lên nhau", () => {
    renderHook(() => useExamTimer(600, "attempt-A"));
    renderHook(() => useExamTimer(1200, "attempt-B"));

    expect(localStorage.getItem("exam_endTime_attempt-A")).not.toBe(
      localStorage.getItem("exam_endTime_attempt-B")
    );
  });

  it("mốc đã qua thì thời gian còn lại là 0, không âm", () => {
    localStorage.setItem(KEY, String(Date.now() - 60 * 1000));

    const { result } = renderHook(() => useExamTimer(600, EXAM_ID));

    expect(result.current.timeLeft).toBe(0);
  });

  it("xoá mốc khỏi localStorage khi hết giờ", () => {
    renderHook(() => useExamTimer(2, EXAM_ID));
    expect(localStorage.getItem(KEY)).not.toBeNull();

    tick(3000);

    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("useExamTimer — đếm ngược và nộp bài tự động", () => {
  it("giảm dần theo từng giây", () => {
    const { result } = renderHook(() => useExamTimer(600, EXAM_ID));
    expect(result.current.timeLeft).toBe(600);

    tick(1000);
    expect(result.current.timeLeft).toBe(599);

    tick(9000);
    expect(result.current.timeLeft).toBe(590);
  });

  it("gọi onTimeUp ĐÚNG MỘT LẦN khi hết giờ", () => {
    // Gọi nhiều lần nghĩa là nộp bài nhiều lần — request thứ hai sẽ lỗi vì phiên đã chốt.
    const onTimeUp = vi.fn();
    renderHook(() => useExamTimer(2, EXAM_ID, onTimeUp));

    tick(3000);
    tick(5000); // tiếp tục chạy đồng hồ

    expect(onTimeUp).toHaveBeenCalledTimes(1);
  });

  it("gọi PHIÊN BẢN MỚI NHẤT của onTimeUp, không phải bản lúc mount", () => {
    // Hook giữ callback trong ref. Điều này thiết yếu: hàm nộp bài của ExamPage đọc `answers`
    // và `questions` từ state, nên một callback bị đóng băng sẽ nộp lên bài làm RỖNG.
    // Cùng lớp lỗi với bug chống gian lận đã sửa ở commit 3a395f0.
    const cu = vi.fn();
    const moi = vi.fn();

    const { rerender } = renderHook(({ cb }) => useExamTimer(2, EXAM_ID, cb), {
      initialProps: { cb: cu },
    });
    rerender({ cb: moi });

    tick(3000);

    expect(cu).not.toHaveBeenCalled();
    expect(moi).toHaveBeenCalledTimes(1);
  });

  it("không có onTimeUp cũng không sập", () => {
    expect(() => {
      renderHook(() => useExamTimer(2, EXAM_ID));
      tick(3000);
    }).not.toThrow();
  });

  it("dừng đồng hồ khi rời trang", () => {
    const onTimeUp = vi.fn();
    const { unmount } = renderHook(() => useExamTimer(2, EXAM_ID, onTimeUp));

    unmount();
    tick(5000);

    expect(onTimeUp).not.toHaveBeenCalled();
  });

  it("thời lượng 0 hoặc null thì không chạy đồng hồ", () => {
    // Xảy ra thật: ExamPage truyền 0 trong lúc chờ tải dữ liệu đề thi từ máy chủ. Chạy đồng hồ
    // lúc đó sẽ nộp bài ngay khi trang vừa mở.
    const onTimeUp = vi.fn();
    renderHook(() => useExamTimer(0, EXAM_ID, onTimeUp));

    tick(5000);

    expect(onTimeUp).not.toHaveBeenCalled();
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});

describe("useExamTimer — định dạng hiển thị", () => {
  it.each([
    [65, "01:05"],
    [600, "10:00"],
    [59, "00:59"],
    [0, "00:00"],
  ])("%i giây -> %s", (seconds, expected) => {
    localStorage.setItem(KEY, String(Date.now() + seconds * 1000));
    const { result } = renderHook(() => useExamTimer(seconds || 1, EXAM_ID));

    expect(result.current.formattedTime()).toBe(expected);
  });

  it("từ một giờ trở lên thì hiện thêm phần giờ", () => {
    localStorage.setItem(KEY, String(Date.now() + 3661 * 1000));
    const { result } = renderHook(() => useExamTimer(3661, EXAM_ID));

    expect(result.current.formattedTime()).toBe("01:01:01");
  });
});

describe("useExamTimer — GIỚI HẠN ĐÃ BIẾT: mốc kết thúc chỉ nằm ở phía máy khách", () => {
  it("xoá localStorage thì đồng hồ được cấp lại trọn thời gian", () => {
    // Test này KHÔNG chốt một hành vi mong muốn — nó ghi lại một lỗ hổng có thật để không ai
    // tưởng hook đã chống được việc gian lận thời gian.
    //
    // Hook nhận tham số thứ tư `_examEndTime` (mốc kết thúc tuyệt đối do máy chủ cấp) nhưng
    // KHÔNG dùng tới. Kiểm phía backend cho thấy endpoint chi tiết lượt thi chỉ trả
    // examInfo.duration và startTime, KHÔNG trả endTime — nên tham số đó chưa từng có giá trị
    // để dùng. Đó là mã chết ở cả hai phía.
    //
    // Hệ quả: mốc kết thúc chỉ tồn tại trong localStorage của học sinh. Xoá đi là có đồng hồ mới.
    //
    // Máy chủ CÓ một lớp chặn cuối: gradeSubmission kẹp lại endTime khi thời gian làm bài vượt
    // duration + 2 phút. Nhưng nó vẫn CHẤP NHẬN bài nộp — chỉ ghi nhận mốc kết thúc bị kẹp,
    // không từ chối và cũng không đánh dấu gì.
    //
    // Sửa triệt để cần backend trả mốc kết thúc tuyệt đối và từ chối bài nộp quá hạn — đó là
    // quyết định về chính sách thi cử, không phải quyết định kỹ thuật.
    const { unmount } = renderHook(() => useExamTimer(600, EXAM_ID));
    unmount();

    vi.setSystemTime(Date.now() + 500 * 1000);
    localStorage.clear();

    const { result } = renderHook(() => useExamTimer(600, EXAM_ID));

    expect(result.current.timeLeft).toBe(600); // trọn 10 phút, không phải 100 giây còn lại
  });
});
