import { useState, useEffect, useRef } from "react";

// Đổi tên biến thành durationInSeconds cho chuẩn logic với ExamPage
const useExamTimer = (durationInSeconds, examId, onTimeUp) => {
  const storageKey = `exam_endTime_${examId}`;

  // TỐI ƯU 1: Dùng useRef để giữ hàm onTimeUp mới nhất, tránh lỗi re-render vô tận
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Đọc trực tiếp từ localStorage ngay khi khởi tạo
  const [timeLeft, setTimeLeft] = useState(() => {
    const endTime = localStorage.getItem(storageKey);
    if (endTime) {
      const remaining = Math.round((parseInt(endTime, 10) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return durationInSeconds; // Không nhân 60 nữa vì đây đã là Giây
  });

  useEffect(() => {
    // TỐI ƯU 2: CHẶN LƯU VÀO LOCAL STORAGE KHI API CHƯA TRẢ VỀ DATA (duration <= 0)
    if (!durationInSeconds || durationInSeconds <= 0) return;

    let endTime = localStorage.getItem(storageKey);

    if (!endTime) {
      // Thiết lập mốc kết thúc (tính bằng milli-giây)
      endTime = Date.now() + durationInSeconds * 1000;
      localStorage.setItem(storageKey, endTime.toString());
    } else {
      endTime = parseInt(endTime, 10);
    }

    const updateTimer = () => {
      const currentTime = Date.now();
      const remainingSeconds = Math.round((endTime - currentTime) / 1000);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        localStorage.removeItem(storageKey);

        // Gọi hàm nộp bài thông qua Ref
        if (onTimeUpRef.current) {
          onTimeUpRef.current();
        }
      } else {
        setTimeLeft(remainingSeconds);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [durationInSeconds, examId, storageKey]);

  // TỐI ƯU 3: Viết lại hàm format thời gian để hỗ trợ đề thi dài hơn 60 phút (hiện cả giờ)
  const formattedTime = () => {
    if (timeLeft === null || timeLeft === undefined) return "00:00";

    const h = Math.floor(timeLeft / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((timeLeft % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (timeLeft % 60).toString().padStart(2, "0");

    // Nếu đề thi trên 60 phút thì hiện 01:30:00, dưới 60 phút thì hiện 30:00
    return h === "00" ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  return { timeLeft, formattedTime };
};

export default useExamTimer;
