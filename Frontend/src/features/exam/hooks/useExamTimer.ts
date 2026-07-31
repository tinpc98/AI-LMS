import { useState, useEffect, useRef } from "react";

/**
 * Đồng hồ đếm ngược phòng thi.
 *
 * MỐC KẾT THÚC LẤY TỪ MÁY CHỦ KHI CÓ (Wave 7+).
 *
 * Trước đây tham số examEndTime tồn tại nhưng KHÔNG được dùng — và backend cũng chưa từng gửi
 * trường đó. Mã chết ở cả hai phía. Hệ quả: hạn nộp chỉ tồn tại trong localStorage của học
 * sinh, xoá đi là có đồng hồ mới trọn thời gian.
 *
 * Nay endpoint chi tiết lượt thi trả về endTime tuyệt đối (tính từ lúc học sinh bấm bắt đầu),
 * và hook ưu tiên giá trị đó. localStorage tụt xuống vai trò dự phòng cho trường hợp máy chủ
 * chưa kịp trả — không còn là nguồn sự thật.
 */
const useExamTimer = (
  durationInSeconds: number | null,
  examId?: string,
  onTimeUp?: () => void,
  examEndTime?: string | null
) => {
  const storageKey = `exam_endTime_${examId || "default"}`;

  /** Mốc kết thúc do máy chủ cấp, tính bằng mili-giây. null nếu chưa có hoặc không hợp lệ. */
  const serverEndTime = (() => {
    if (!examEndTime) return null;
    const parsed = new Date(examEndTime).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  })();

  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const [timeLeft, setTimeLeft] = useState<number | null>(() => {
    // Máy chủ là nguồn sự thật; localStorage chỉ dùng khi chưa có.
    const known =
      serverEndTime ?? (examId ? Number(localStorage.getItem(storageKey)) || null : null);
    if (!known) return durationInSeconds;
    return Math.max(0, Math.round((known - Date.now()) / 1000));
  });

  useEffect(() => {
    if (!durationInSeconds || durationInSeconds <= 0) return;

    // Thứ tự ưu tiên: mốc của máy chủ > mốc đã lưu > tự tính từ thời lượng.
    // Mốc của máy chủ luôn GHI ĐÈ localStorage — nếu học sinh sửa giá trị đã lưu, lần đồng bộ
    // kế tiếp sẽ đưa nó về đúng.
    let endTime: number;

    if (serverEndTime) {
      endTime = serverEndTime;
      localStorage.setItem(storageKey, String(endTime));
    } else {
      const saved = Number(localStorage.getItem(storageKey));
      endTime = saved || Date.now() + durationInSeconds * 1000;
      localStorage.setItem(storageKey, String(endTime));
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
  }, [durationInSeconds, examId, storageKey, serverEndTime]);

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
