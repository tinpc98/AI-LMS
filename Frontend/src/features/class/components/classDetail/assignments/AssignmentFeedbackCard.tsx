import React from "react";
import { Card, Typography, Space, Divider } from "antd";
import { TrophyOutlined, CommentOutlined, RobotOutlined } from "@ant-design/icons";
import type { ISubmission } from "../../../../../interface/assignmentInterface";

const { Text, Paragraph, Title } = Typography;

interface AssignmentFeedbackCardProps {
  submission: ISubmission;
}

export const AssignmentFeedbackCard: React.FC<AssignmentFeedbackCardProps> = React.memo(
  ({ submission }) => {
    if (submission.grade === null || submission.grade === undefined) {
      return null;
    }

    const formattedDate = submission.updatedAt
      ? new Date(submission.updatedAt).toLocaleString("vi-VN")
      : "Gần đây";

    return (
      <Card
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 18 }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Kết quả đánh giá & Phản hồi</span>
          </Space>
        }
        size="small"
        style={{
          borderRadius: 12,
          backgroundColor: "var(--color-secondary-bg)",
          border: "1px solid var(--color-secondary-border)",
          marginBottom: 16,
        }}
      >
        {/* Grade Display */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text strong style={{ fontSize: 13, color: "var(--color-secondary-active)" }}>
            Điểm số của bạn:
          </Text>
          <div style={{ textAlign: "right" }}>
            <Title level={3} style={{ margin: 0, color: "var(--color-secondary-icon)", fontWeight: 700 }}>
              {submission.grade}{" "}
              <span style={{ fontSize: 14, color: "var(--color-text-description)", fontWeight: 400 }}>/ 10</span>
            </Title>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Chấm ngày: {formattedDate}
            </Text>
          </div>
        </div>

        <Divider style={{ margin: "10px 0" }} />

        {/* Teacher Feedback */}
        <div style={{ marginBottom: 12 }}>
          <Text
            strong
            style={{ fontSize: 13, color: "var(--color-text-title)", display: "block", marginBottom: 4 }}
          >
            <CommentOutlined style={{ marginRight: 6, color: "var(--color-action-primary-bg)" }} /> Nhận xét của giảng
            viên:
          </Text>
          <Paragraph
            type="secondary"
            style={{
              fontSize: 13,
              margin: 0,
              backgroundColor: "var(--color-surface)",
              padding: "8px 12px",
              borderRadius: 8,
            }}
          >
            {submission.feedback || "Giảng viên không để lại nhận xét thêm."}
          </Paragraph>
        </div>

        {/* AI Assistant Feedback if any */}
        {(submission as any).aiFeedback && (
          <div>
            <Text
              strong
              style={{ fontSize: 13, color: "var(--color-action-primary-bg)", display: "block", marginBottom: 4 }}
            >
              <RobotOutlined style={{ marginRight: 6 }} /> Gợi ý tối ưu từ AI Assistant:
            </Text>
            <Paragraph
              type="secondary"
              style={{
                fontSize: 12,
                margin: 0,
                backgroundColor: "var(--color-bg-primary-tint)",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              {(submission as any).aiFeedback}
            </Paragraph>
          </div>
        )}
      </Card>
    );
  }
);

AssignmentFeedbackCard.displayName = "AssignmentFeedbackCard";

export default AssignmentFeedbackCard;
