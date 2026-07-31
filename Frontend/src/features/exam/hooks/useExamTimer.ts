import { useState, useEffect, useRef } from "react";

const useExamTimer = (
  durationInSeconds: number | null,
  examId?: string,
  onTimeUp?: () => void,
  _examEndTime?: string | null
) => {
  const storageKey = `exam_endTime_${examId || "default"}`;

  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    if (!examId) return durationInSeconds;
    const endTime = localStorage.getItem(storageKey);
    if (endTime) {
      const remaining = Math.round((parseInt(endTime, 10) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return durationInSeconds;
  });

  useEffect(() => {
    if (!durationInSeconds || durationInSeconds <= 0) return;

    let endTimeStr = localStorage.getItem(storageKey);
    let endTime: number;

    if (!endTimeStr) {
      endTime = Date.now() + durationInSeconds * 1000;
      localStorage.setItem(storageKey, endTime.toString());
    } else {
      endTime = parseInt(endTimeStr, 10);
    }

    /**
     * Cập nhật thời gian còn lại. Trả về false khi đã hết giờ.
     *
     * BUG ĐÃ SỬA (Wave 7): bản cũ gọi clearInterval(interval) ngay trong thân hàm này, trong
     * khi `interval` được khai báo bằng const Ở DƯỚI. Lần gọi đầu tiên — chạy TRƯỚC setInterval
     * — vì thế rơi vào vùng chết tạm thời và ném ReferenceError.
     *
     * Nghĩa là: học sinh mở trang thi sau khi đã hết giờ thì hook SẬP, và thay vì thấy "hết
     * giờ" họ thấy màn hình lỗi của ExamErrorBoundary. Nhánh này chỉ chạy khi thời gian đã
     * hết ngay lúc vào trang nên không lộ ra khi bấm thử bình thường.
     *
     * Cách sửa cũng gỡ luôn một vấn đề thứ hai: bản cũ vẫn khởi động setInterval kể cả khi đã
     * hết giờ, để lại một bộ đếm chạy vô ích mỗi giây.
     */
    const updateTimer = (): boolean => {
      const remainingSeconds = Math.round((endTime - Date.now()) / 1000);

      if (remainingSeconds > 0) {
        setTimeLeft(remainingSeconds);
        return true;
      }

      setTimeLeft(0);
      localStorage.removeItem(storageKey);
      onTimeUpRef.current?.();
      return false;
    };

    // Hết giờ ngay từ lúc vào trang thì không cần bộ đếm nào cả.
    if (!updateTimer()) return;

    const interval = setInterval(() => {
      if (!updateTimer()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [durationInSeconds, examId, storageKey]);

  const formattedTime = (): string => {
    if (timeLeft === null || timeLeft === undefined) return "00:00";

    const h = Math.floor(timeLeft / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((timeLeft % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (timeLeft % 60).toString().padStart(2, "0");

    return h === "00" ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  return { timeLeft, formattedTime };
};

export default useExamTimer;
