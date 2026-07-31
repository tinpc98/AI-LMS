import React from "react";
import { Drawer, Button, Typography, Space, Descriptions, Tag, Divider, Alert } from "antd";
import {
  TrophyOutlined,
  CommentOutlined,
  RobotOutlined,
  CalendarOutlined,
  UserOutlined,
  PercentageOutlined,
} from "@ant-design/icons";
import GradeStatusTag from "./GradeStatusTag";
import type { IGradeItem } from "../../../../types/studentGrade";

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
            <TrophyOutlined style={{ color: "#722ed1", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
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
                backgroundColor: "#f9f0ff",
                border: "1px solid #d3ade6",
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
                <Title level={2} style={{ margin: 0, color: "#722ed1", fontWeight: 700 }}>
                  {item.score}{" "}
                  <span style={{ fontSize: 16, color: "#8c8c8c", fontWeight: 400 }}>
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
            styles={{ label: { width: "35%", fontWeight: 600, backgroundColor: "#fafafa" } }}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Tên bài / Đầu điểm">{item.title}</Descriptions.Item>

            <Descriptions.Item label="Danh mục điểm">
              <Tag color="blue">{item.category}</Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Trọng số tính GPA">
              <Space size={4}>
                <PercentageOutlined style={{ color: "#1890ff" }} />
                <span>{item.weight}% điểm môn học</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian nộp bài">{formattedSubmittedAt}</Descriptions.Item>

            <Descriptions.Item label="Thời gian chấm điểm">{formattedGradedAt}</Descriptions.Item>

            <Descriptions.Item label="Giảng viên chấm bài">
              <Space size={6}>
                <UserOutlined style={{ color: "#1890ff" }} />
                <span>{item.gradedBy || "Giảng viên phụ trách"}</span>
              </Space>
            </Descriptions.Item>
          </Descriptions>

          {/* Teacher Written Feedback */}
          {item.feedback && (
            <div style={{ marginBottom: 20 }}>
              <Text
                strong
                style={{ fontSize: 14, color: "#262626", display: "block", marginBottom: 6 }}
              >
                <CommentOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Nhận xét của giảng
                viên:
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
                {item.feedback}
              </Paragraph>
            </div>
          )}

          {/* AI Assistant Feedback */}
          {item.aiFeedback && (
            <div>
              <Text
                strong
                style={{ fontSize: 14, color: "#1890ff", display: "block", marginBottom: 6 }}
              >
                <RobotOutlined style={{ marginRight: 6 }} /> Gợi ý & Phân tích từ AI Assistant:
              </Text>
              <Paragraph
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: 0,
                  backgroundColor: "#e6f7ff",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #91caff",
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
