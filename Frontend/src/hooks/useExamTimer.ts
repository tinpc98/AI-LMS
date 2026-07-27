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

    const updateTimer = () => {
      const currentTime = Date.now();
      const remainingSeconds = Math.round((endTime - currentTime) / 1000);

      if (remainingSeconds <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        localStorage.removeItem(storageKey);

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
