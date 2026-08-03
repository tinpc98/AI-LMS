import React from "react";
import { Drawer, Button, Typography, Space, Descriptions, Tag, Alert } from "antd";
import {
  TrophyOutlined,
  CommentOutlined,
  RobotOutlined,
  UserOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import GradeStatusTag from "./GradeStatusTag";
import type { IGradeItem } from "../../../../../types/studentGrade";

const { Text, Paragraph, Title } = Typography;

interface GradeDetailDrawerProps {
  open: boolean;
  item: IGradeItem | null;
  onClose: () => void;
}

export const GradeDetailDrawer: React.FC<GradeDetailDrawerProps> = React.memo(
  ({ open, item, onClose }) => {
    if (!item) return null;

    const formattedGradedAt = item.gradedAt
      ? new Date(item.gradedAt).toLocaleString("vi-VN")
      : "Chưa xác định";

    const formattedSubmittedAt = item.submittedAt
      ? new Date(item.submittedAt).toLocaleString("vi-VN")
      : "Không có dữ liệu nộp";

    const isGraded = item.status === "Graded" && item.score !== null;

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "var(--color-text-title)" }}>
                {item.title}
              </Title>
              <Space size={6} style={{ marginTop: 2 }}>
                <GradeStatusTag status={item.status} />
              </Space>
            </div>
          </Space>
        }
        extra={
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Đóng
          </Button>
        }
        width={600}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          {/* Score Display Card */}
          {isGraded ? (
            <div
              style={{
                backgroundColor: "var(--color-secondary-bg)",
                border: "1px solid var(--color-secondary-border)",
                borderRadius: 14,
                padding: "16px 20px",
                marginBottom: 20,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                  Kết quả chấm điểm cá nhân
                </Text>
                <Title level={2} style={{ margin: 0, color: "var(--color-secondary-icon)", fontWeight: 700 }}>
                  {item.score}{" "}
                  <span style={{ fontSize: 16, color: "var(--color-text-description)", fontWeight: 400 }}>
                    / {item.maxScore} điểm
                  </span>
                </Title>
              </div>

              <Tag
                color="purple"
                style={{ borderRadius: 8, fontSize: 14, padding: "6px 12px", fontWeight: 700 }}
              >
                Trọng số: {item.weight}%
              </Tag>
            </div>
          ) : (
            <Alert
              message="Đầu điểm này chưa được chấm chính thức"
              description="Điểm số sẽ được cập nhật ngay khi giáo viên phụ trách hoàn tất việc chấm bài."
              type="warning"
              showIcon
              style={{ borderRadius: 10, marginBottom: 20 }}
            />
          )}

          {/* Meta Information Descriptions */}
          <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { width: "35%", fontWeight: 600, backgroundColor: "var(--color-bg-page)" } }}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Tên bài / Đầu điểm">{item.title}</Descriptions.Item>

            <Descriptions.Item label="Danh mục điểm">
              <Tag color="blue">{item.category}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Trọng số tính GPA">
              <Space size={4}>
                <PercentageOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                <span>{item.weight}% điểm môn học</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian nộp bài">{formattedSubmittedAt}</Descriptions.Item>

            <Descriptions.Item label="Thời gian chấm điểm">{formattedGradedAt}</Descriptions.Item>

            <Descriptions.Item label="Giảng viên chấm bài">
              <Space size={6}>
                <UserOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                <span>{item.gradedBy || "Giảng viên phụ trách"}</span>
              </Space>
            </Descriptions.Item>
          </Descriptions>

          {/* Teacher Written Feedback */}
          {item.feedback && (
            <div style={{ marginBottom: 20 }}>
              <Text
                strong
                style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 6 }}
              >
                <CommentOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} /> Nhận xét của giảng
                viên:
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
                {item.feedback}
              </Paragraph>
            </div>
          )}

          {/* AI Assistant Feedback */}
          {item.aiFeedback && (
            <div>
              <Text
                strong
                style={{ fontSize: 14, color: "var(--color-action-primary-bg)", display: "block", marginBottom: 6 }}
              >
                <RobotOutlined style={{ marginRight: 6 }} /> Gợi ý & Phân tích từ AI Assistant:
              </Text>
              <Paragraph
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: 0,
                  backgroundColor: "var(--color-bg-primary-tint)",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--color-border-primary-tint)",
                }}
              >
                {item.aiFeedback}
              </Paragraph>
            </div>
          )}
        </div>
      </Drawer>
    );
  }
);

GradeDetailDrawer.displayName = "GradeDetailDrawer";

export default GradeDetailDrawer;
