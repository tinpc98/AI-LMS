import React from "react";
import { Modal, Button, Typography, Space, Descriptions, Alert } from "antd";
import {
  FormOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import ExamStatusTag from "./ExamStatusTag";
import type { IExtendedExam } from "../../../../../types/studentExam";

const { Text, Paragraph, Title } = Typography;

interface ExamDetailModalProps {
  open: boolean;
  item: IExtendedExam | null;
  onClose: () => void;
  onStart: (item: IExtendedExam) => void;
}

export const ExamDetailModal: React.FC<ExamDetailModalProps> = React.memo(
  ({ open, item, onClose, onStart }) => {
    if (!item) return null;

    const formattedStartTime = item.startTime
      ? new Date(item.startTime).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Chưa xác định";

    const questionCount = item.questions ? item.questions.length : item.totalQuestions || 20;
    const maxScore = item.maxScore || 10;
    const isAvailable = item.displayStatus === "Available" || item.displayStatus === "In Progress";

    return (
      <Modal
        open={open}
        onCancel={onClose}
        title={
          <Space align="center">
            <FormOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "var(--color-text-title)" }}>
                {item.title}
              </Title>
              <Space size={6} style={{ marginTop: 2 }}>
                <ExamStatusTag status={item.displayStatus} />
              </Space>
            </div>
          </Space>
        }
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Đóng
            </Button>
            {isAvailable && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  onClose();
                  onStart(item);
                }}
                style={{ borderRadius: 8, backgroundColor: "var(--color-success-base)" }}
              >
                {item.displayStatus === "In Progress" ? "Tiếp tục bài thi" : "Bắt đầu làm bài"}
              </Button>
            )}
          </div>
        }
        width={850}
        centered
        destroyOnClose
        styles={{ body: { maxHeight: "75vh", overflowY: "auto", paddingRight: 8, paddingTop: 16 } }}
      >
        <div style={{ padding: "8px 0" }}>
          {/* Exam Parameters Descriptions */}
          <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { width: "35%", fontWeight: 600, backgroundColor: "var(--color-bg-page)" } }}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Tên bài kiểm tra">
              <Text strong style={{ color: "var(--color-text-title)" }}>
                {item.title}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <ExamStatusTag status={item.displayStatus} />
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian làm bài">
              <Space size={6}>
                <ClockCircleOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                <Text strong>{item.duration || 45} phút</Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Cấu trúc đề thi">
              <Space size={6}>
                <QuestionCircleOutlined style={{ color: "var(--color-warning-base)" }} />
                <span>
                  {questionCount} câu hỏi ({maxScore} điểm)
                </span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Điểm đạt (Passing Score)">
              <Space size={6}>
                <SafetyCertificateOutlined style={{ color: "var(--color-success-base)" }} />
                <span>5.0 / {maxScore} điểm</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian mở thi">{formattedStartTime}</Descriptions.Item>
          </Descriptions>

          {/* Quy chế & Mô tả */}
          <div style={{ marginBottom: 20 }}>
            <Text
              strong
              style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 6 }}
            >
              Mô tả:
            </Text>
            <Paragraph
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                margin: 0,
                backgroundColor: "var(--color-bg-page)",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid var(--color-border-default)",
              }}
            >
              {item.description ||
                "Học sinh vui lòng đảm bảo kết nối mạng ổn định và làm bài nghiêm túc trong suốt thời gian diễn ra bài thi."}
            </Paragraph>
          </div>

          {/* Exam Rules Alert Notice */}
          <Alert
            message="Quy định làm bài thi trực tuyến"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                <li>Hệ thống tự động thu bài khi hết thời gian.</li>
                <li>Bài thi yêu cầu chế độ toàn màn hình.</li>
                <li>Rời khỏi cửa sổ thi sẽ bị ghi nhận vi phạm.</li>
                <li><strong>Vi phạm đủ 5 lần:</strong> hệ thống tự nộp bài, kết quả 0 điểm.</li>
              </ul>
            }
            type="warning"
            showIcon
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>
    );
  }
);

ExamDetailModal.displayName = "ExamDetailModal";

export default ExamDetailModal;
