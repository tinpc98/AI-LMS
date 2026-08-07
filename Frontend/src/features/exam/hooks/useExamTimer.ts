import { useState, useEffect, useRef } from "react";

/**
 * Đồng hồ đếm ngược phòng thi.
 *
 * MỐC KẾT THÚC LẤY TỪ MÁY CHỦ KHI CÓ (Wave 7+).
 *
 * OFFSET ĐỒNG HỒ (Wave 8+):
 * Backend trả về `serverTime` trong response chi tiết lượt thi. Frontend tính:
 *   offset = serverTime - Date.now()
 * Mọi phép tính thời gian sau đó dùng (Date.now() + offset) thay vì Date.now().
 * Điều này bù sai lệch nếu đồng hồ máy học sinh lệch vài phút so với server.
 */
const useExamTimer = (
  durationInSeconds: number | null,
  examId?: string,
  onTimeUp?: () => void,
  examEndTime?: string | null,
  serverTimeOffset = 0  // ms; dương = client chậm hơn server
) => {
  const storageKey = `exam_endTime_${examId || "default"}`;

  /** Đồng hồ chuẩn: Date.now() đã hiệu chỉnh theo offset server. */
  const now = () => Date.now() + serverTimeOffset;

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
    return Math.max(0, Math.round((known - now()) / 1000));
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
      endTime = saved || now() + durationInSeconds * 1000;
      localStorage.setItem(storageKey, String(endTime));
    }

    /**
     * Cập nhật thời gian còn lại. Trả về false khi đã hết giờ.
     *
     * BUG ĐÃ SỬA (Wave 7): bản cũ gọi clearInterval(interval) ngay trong thân hàm này, trong
     * khi `interval` được khai báo bằng const Ở DƯỚI. Lần gọi đầu tiên — chạy TRƯỚC setInterval
     * — vì thế rơi vào vùng chết tạm thời và ném ReferenceError.
     */
    const updateTimer = (): boolean => {
      const remainingSeconds = Math.round((endTime - now()) / 1000);

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
  }, [durationInSeconds, examId, storageKey, serverEndTime, serverTimeOffset]);

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
