import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { Typography, Space } from "antd";
import { ClockCircleOutlined, LockOutlined } from "@ant-design/icons";

interface Props {
  endAt: string | null;
  lockedAt?: string | null;
  status: string;
}

export const CountdownTimer: React.FC<Props> = ({ endAt, lockedAt, status }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  useEffect(() => {
    // If it is already confirmed, we don't need a countdown
    if (status === "CONFIRMED" || status === "ABSENT") {
      setIsLocked(true);
      return;
    }

    if (!endAt) {
      setIsLocked(true);
      return;
    }

    const endDate = dayjs(endAt);
    const lockedDate = lockedAt ? dayjs(lockedAt) : endDate.add(24, "hour");

    const calculateTimeLeft = () => {
      const now = dayjs();
      if (now.isAfter(lockedDate)) {
        setIsLocked(true);
        setTimeLeft(0);
      } else {
        setIsLocked(false);
        setTimeLeft(lockedDate.diff(now, "second"));
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [endAt, lockedAt, status]);

  if (isLocked) {
    if (status === "CONFIRMED") return <Typography.Text type="success">Hoàn thành</Typography.Text>;
    if (status === "ABSENT") return <Typography.Text type="danger">Vắng mặt</Typography.Text>;
    
    return (
      <Space className="text-gray-400">
        <LockOutlined />
        <span>Đã khóa</span>
      </Space>
    );
  }

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  const pad = (num: number) => num.toString().padStart(2, "0");

  const isUrgent = hours < 1;

  return (
    <Space style={{ color: isUrgent ? "var(--color-error-text)" : "var(--color-warning-text)", fontWeight: 500 }}>
      <ClockCircleOutlined />
      <span>Còn {pad(hours)}:{pad(minutes)}:{pad(seconds)}</span>
    </Space>
  );
};

export default CountdownTimer;
