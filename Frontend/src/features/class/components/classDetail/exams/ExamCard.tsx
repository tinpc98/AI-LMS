import React from "react";
import { Card, Tag, Typography, Space, Tooltip, Button } from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  LockOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import ExamStatusTag from "./ExamStatusTag";
import type { IExtendedExam } from "../../../../../types/studentExam";

const { Text, Paragraph } = Typography;

interface ExamCardProps {
  item: IExtendedExam;
  onDetail: (item: IExtendedExam) => void;
  onStart: (item: IExtendedExam) => void;
  onReview: (item: IExtendedExam) => void;
}

export const ExamCard: React.FC<ExamCardProps> = React.memo(
  ({ item, onDetail, onStart, onReview }) => {
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
    const isCompleted =
      item.displayStatus === "Completed" &&
      item.attempt?.totalScore !== undefined &&
      item.attempt?.totalScore !== null;

    return (
      <Card
        hoverable
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--color-border-default)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "var(--transition-fast)",
        }}
        styles={{
          body: {
            padding: 20,
            display: "flex",
            flexDirection: "column",
            flex: 1,
          },
        }}
      >
        {/* Header Status Tag & Duration */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <ExamStatusTag status={item.displayStatus} />
          <Tag color="blue" style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} /> {item.duration || 45} phút
          </Tag>
        </div>

        {/* Exam Title */}
        <Tooltip title={item.title}>
          <Text
            strong
            style={{
              fontSize: 16,
              color: "var(--color-text-title)",
              lineHeight: 1.4,
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </Text>
        </Tooltip>

        {/* Short Description */}
        <Paragraph
          type="secondary"
          style={{
            fontSize: 12,
            margin: "0 0 12px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 36,
          }}
        >
          {item.description || "Không có ghi chú thêm cho bài kiểm tra này."}
        </Paragraph>

        {/* Exam Metadata Grid */}
        <div
          style={{
            backgroundColor: "var(--color-bg-page)",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 4 }} /> Ngày/giờ mở thi:
            </Text>
            <Text strong style={{ color: "var(--color-text-title)" }}>
              {formattedStartTime}
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <Text type="secondary">
              <QuestionCircleOutlined style={{ marginRight: 4 }} /> Số lượng câu hỏi:
            </Text>
            <Text strong>
              {questionCount} câu ({maxScore} điểm)
            </Text>
          </div>
        </div>

        {/* Score Badge if Completed */}
        {isCompleted && (
          <div
            style={{
              backgroundColor: "var(--color-secondary-bg)",
              border: "1px solid var(--color-secondary-border)",
              borderRadius: 8,
              padding: "6px 12px",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "var(--color-secondary-active)", fontWeight: 600 }}>
              <TrophyOutlined style={{ marginRight: 6 }} /> Điểm số bài thi:
            </Text>
            <Tag
              color="purple"
              style={{ borderRadius: 6, fontWeight: 700, fontSize: 13, margin: 0 }}
            >
              {item.attempt?.totalScore} / {maxScore}
            </Tag>
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          {/* Action Buttons Toolbar */}
          <Space size={6} style={{ width: "100%", justifyContent: "space-between" }}>
            <Button
              type="default"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onDetail(item)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Quy chế
            </Button>

            {item.displayStatus === "Available" && (
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(item)}
                style={{ borderRadius: 6, fontSize: 12, backgroundColor: "var(--color-success-base)" }}
              >
                Vào thi
              </Button>
            )}

            {item.displayStatus === "In Progress" && (
              <Button
                type="primary"
                size="small"
                icon={<SyncOutlined spin />}
                onClick={() => onStart(item)}
                style={{ borderRadius: 6, fontSize: 12, backgroundColor: "var(--color-warning-base)" }}
              >
                Tiếp tục
              </Button>
            )}

            {item.displayStatus === "Completed" && (
              <Button
                type="primary"
                size="small"
                icon={<TrophyOutlined />}
                onClick={() => onReview(item)}
                style={{ borderRadius: 6, fontSize: 12, backgroundColor: "var(--color-secondary-icon)" }}
              >
                Kết quả
              </Button>
            )}

            {item.displayStatus === "Upcoming" && (
              <Button
                type="default"
                disabled
                size="small"
                icon={<ClockCircleOutlined />}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                Chưa tới giờ
              </Button>
            )}

            {item.displayStatus === "Expired" && (
              <Button
                type="default"
                disabled
                size="small"
                icon={<LockOutlined />}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                Đã khóa
              </Button>
            )}
          </Space>
        </div>
      </Card>
    );
  }
);

ExamCard.displayName = "ExamCard";

export default ExamCard;
