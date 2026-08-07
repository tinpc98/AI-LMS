import React, { useState, useEffect } from "react";
import { Modal, Typography, Button } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface WaitingScreenProps {
  waitingExamData: { examId: string; startTime: string; title: string } | null;
  onClose: () => void;
  onRetry: () => void;
}

const WaitingScreen: React.FC<WaitingScreenProps> = ({ waitingExamData, onClose, onRetry }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!waitingExamData) return;
    const startMs = new Date(waitingExamData.startTime).getTime();
    
    const calculateTimeLeft = () => {
      const now = Date.now();
      return Math.max(0, startMs - now);
    };

    setTimeLeft(calculateTimeLeft());
    
    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [waitingExamData]);

  if (!waitingExamData) return null;

  const formatTime = (ms: number) => {
    if (ms <= 0) return "00:00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const isReady = timeLeft <= 0;

  return (
    <Modal
      open={!!waitingExamData}
      onCancel={onClose}
      footer={null}
      centered
      closable={!isReady}
      maskClosable={false}
      width={400}
    >
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <ClockCircleOutlined style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }} />
        <Title level={4} style={{ marginBottom: 8 }}>Kỳ thi chưa bắt đầu</Title>
        <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
          {waitingExamData.title}
        </Text>
        
        <div style={{ background: "#f0f2f5", padding: "24px", borderRadius: "8px", marginBottom: 24 }}>
          {isReady ? (
            <Text strong style={{ fontSize: 18, color: "#52c41a" }}>Đã đến giờ làm bài!</Text>
          ) : (
            <>
              <Text style={{ display: "block", marginBottom: 8 }}>Thời gian đếm ngược:</Text>
              <Text strong style={{ fontSize: 32, fontFamily: "monospace", color: "#f5222d" }}>
                {formatTime(timeLeft)}
              </Text>
            </>
          )}
        </div>
        
        {isReady ? (
          <Button type="primary" size="large" block onClick={onRetry}>
            Vào thi ngay
          </Button>
        ) : (
          <Button type="default" size="large" block onClick={onClose}>
            Quay lại sau
          </Button>
        )}
      </div>
    </Modal>
  );
};

export default WaitingScreen;
