import React from "react";
import { Drawer, Button, Typography, Space, Descriptions, Alert } from "antd";
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

interface ExamDetailDrawerProps {
  open: boolean;
  item: IExtendedExam | null;
  onClose: () => void;
  onStart: (item: IExtendedExam) => void;
}

export const ExamDetailDrawer: React.FC<ExamDetailDrawerProps> = React.memo(
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
    const isAvailable = item.status === "Available" || item.status === "In Progress";

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <FormOutlined style={{ color: "#1890ff", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                {item.title}
              </Title>
              <Space size={6} style={{ marginTop: 2 }}>
                <ExamStatusTag status={item.status} />
              </Space>
            </div>
          </Space>
        }
        extra={
          <Space>
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
                style={{ borderRadius: 8, backgroundColor: "#52c41a" }}
              >
                {item.status === "In Progress" ? "Tiếp tục bài thi" : "Bắt đầu làm bài"}
              </Button>
            )}
          </Space>
        }
        width={640}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          {/* Exam Parameters Descriptions */}
          <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { width: "35%", fontWeight: 600, backgroundColor: "#fafafa" } }}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Tên bài kiểm tra">
              <Text strong style={{ color: "#1f2937" }}>
                {item.title}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <ExamStatusTag status={item.status} />
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian làm bài">
              <Space size={6}>
                <ClockCircleOutlined style={{ color: "#1890ff" }} />
                <Text strong>{item.duration || 45} phút</Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Cấu trúc đề thi">
              <Space size={6}>
                <QuestionCircleOutlined style={{ color: "#fa8c16" }} />
                <span>
                  {questionCount} câu hỏi ({maxScore} điểm)
                </span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Điểm đạt (Passing Score)">
              <Space size={6}>
                <SafetyCertificateOutlined style={{ color: "#52c41a" }} />
                <span>5.0 / {maxScore} điểm</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian mở thi">{formattedStartTime}</Descriptions.Item>
          </Descriptions>

          {/* Quy chế & Mô tả */}
          <div style={{ marginBottom: 20 }}>
            <Text
              strong
              style={{ fontSize: 14, color: "#262626", display: "block", marginBottom: 6 }}
            >
              Mô tả & Quy chế phòng thi:
            </Text>
            <Paragraph
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                margin: 0,
                backgroundColor: "#fafafa",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #f0f0f0",
              }}
            >
              {item.description ||
                "Học sinh vui lòng đảm bảo kết nối mạng ổn định và làm bài nghiêm túc trong suốt thời gian diễn ra bài thi."}
            </Paragraph>
          </div>

          {/* Exam Rules Alert Notice */}
          <Alert
            message="Quy định làm bài thi trực tuyến"
            description="Hệ thống tự động giám sát thời gian và lượt làm bài. Khi hết thời gian thi, hệ thống sẽ tự động thu bài của bạn."
            type="warning"
            showIcon
            style={{ borderRadius: 10 }}
          />
        </div>
      </Drawer>
    );
  }
);

ExamDetailDrawer.displayName = "ExamDetailDrawer";

export default ExamDetailDrawer;
