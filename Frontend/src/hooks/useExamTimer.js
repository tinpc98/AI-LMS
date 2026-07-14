import { useState, useEffect } from "react";

const useExamTimer = (durationInMinutes, examId, onTimeUp) => {
  const storageKey = `exam_endTime_${examId}`;

  // NÂNG CẤP: Đọc trực tiếp từ localStorage ngay khi khởi tạo để CHỐNG GIẬT màn hình
  const [timeLeft, setTimeLeft] = useState(() => {
    const endTime = localStorage.getItem(storageKey);
    if (endTime) {
      const remaining = Math.round((parseInt(endTime, 10) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    return durationInMinutes * 60;
  });

  useEffect(() => {
    let endTime = localStorage.getItem(storageKey);

    if (!endTime) {
      endTime = Date.now() + durationInMinutes * 60 * 1000;
      localStorage.setItem(storageKey, endTime.toString());
    } else {
      endTime = parseInt(endTime, 10);
    }

    // Định nghĩa hàm cập nhật đồng hồ
    const updateTimer = () => {
      const currentTime = Date.now();
      const remainingSeconds = Math.round((endTime - currentTime) / 1000);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        localStorage.removeItem(storageKey);
        onTimeUp();
      } else {
        setTimeLeft(remainingSeconds);
      }
    };

    // Chạy ngay 1 lần để tránh bị trễ 1 giây đầu tiên
    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [durationInMinutes, examId, onTimeUp, storageKey]);

  const formattedTime = () => {
    const m = Math.floor(timeLeft / 60)
      .toString()
      .padStart(2, "0");
    const s = (timeLeft % 60).toString().padStart(2, "0");
    return `00:${m}:${s}`;
  };

  return { timeLeft, formattedTime };
};

export default useExamTimer;
