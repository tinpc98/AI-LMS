import React from "react";
import { Card, Tag, Typography, Space, Tooltip, Button } from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  LockOutlined,
  FormOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import ExamStatusTag from "./ExamStatusTag";
import type { IExtendedExam } from "../../../../types/studentExam";

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
    const isCompleted = item.status === "Completed" && item.attempt?.totalScore !== undefined && item.attempt?.totalScore !== null;

    return (
      <Card
        hoverable
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "all 0.3s ease",
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <ExamStatusTag status={item.status} />
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
              color: "#1f2937",
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
        <div style={{ backgroundColor: "#fafafa", borderRadius: 8, padding: "8px 12px", marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 4 }}>
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 4 }} /> Ngày/giờ mở thi:
            </Text>
            <Text strong style={{ color: "#1f2937" }}>
              {formattedStartTime}
            </Text>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
            <Text type="secondary">
              <QuestionCircleOutlined style={{ marginRight: 4 }} /> Số lượng câu hỏi:
            </Text>
            <Text strong>{questionCount} câu ({maxScore} điểm)</Text>
          </div>
        </div>

        {/* Score Badge if Completed */}
        {isCompleted && (
          <div
            style={{
              backgroundColor: "#f9f0ff",
              border: "1px solid #d3ade6",
              borderRadius: 8,
              padding: "6px 12px",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "#531dab", fontWeight: 600 }}>
              <TrophyOutlined style={{ marginRight: 6 }} /> Điểm số bài thi:
            </Text>
            <Tag color="purple" style={{ borderRadius: 6, fontWeight: 700, fontSize: 13, margin: 0 }}>
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

            {item.status === "Available" && (
              <Button
                type="primary"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(item)}
                style={{ borderRadius: 6, fontSize: 12, backgroundColor: "#52c41a" }}
              >
                Vào thi
              </Button>
            )}

            {item.status === "In Progress" && (
              <Button
                type="primary"
                size="small"
                icon={<SyncOutlined spin />}
                onClick={() => onStart(item)}
                style={{ borderRadius: 6, fontSize: 12, backgroundColor: "#fa8c16" }}
              >
                Tiếp tục
              </Button>
            )}

            {item.status === "Completed" && (
              <Button
                type="primary"
                size="small"
                icon={<TrophyOutlined />}
                onClick={() => onReview(item)}
                style={{ borderRadius: 6, fontSize: 12, backgroundColor: "#722ed1" }}
              >
                Kết quả
              </Button>
            )}

            {item.status === "Upcoming" && (
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

            {item.status === "Expired" && (
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
