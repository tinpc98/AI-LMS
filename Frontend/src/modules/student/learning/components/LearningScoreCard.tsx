import React from "react";
import { Card, Progress, Typography, Tag, Alert } from "antd";
import { TrophyOutlined, RiseOutlined, LikeOutlined } from "@ant-design/icons";
import type { LearningScore } from "../types/learningDashboard.types";

const { Text, Title, Paragraph } = Typography;

interface LearningScoreCardProps {
  score: LearningScore;
}

export const LearningScoreCard: React.FC<LearningScoreCardProps> = React.memo(({ score }) => {
  const getLevelColor = (level: LearningScore["level"]) => {
    switch (level) {
      case "Excellent":
        return "#52c41a";
      case "Good":
        return "#1890ff";
      case "Average":
        return "#fa8c16";
      case "Needs Improvement":
      default:
        return "#ff4d4f";
    }
  };

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        border: "1px solid #f0f0f0",
        marginBottom: 24,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text strong style={{ fontSize: 15, color: "#1f2937" }}>
          <TrophyOutlined style={{ color: "#faad14", marginRight: 6 }} /> Đánh giá Năng lực Học tập Tổng hợp
        </Text>
        <Tag color="green" icon={<RiseOutlined />}>
          +{score.trendPercent}% so với tháng trước
        </Tag>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
        <Progress
          type="dashboard"
          percent={score.score}
          size={110}
          strokeColor={getLevelColor(score.level)}
          format={(val) => <span style={{ fontSize: 20, fontWeight: 700 }}>{val} điểm</span>}
        />

        <div style={{ flex: 1 }}>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            Xếp loại năng lực:
          </Text>
          <Title level={4} style={{ margin: "2px 0 6px 0", color: getLevelColor(score.level), fontWeight: 700 }}>
            {score.level.toUpperCase()}
          </Title>
          <Paragraph type="secondary" style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
            {score.feedback}
          </Paragraph>
        </div>
      </div>

      <Alert
        message="Nhận xét từ Hệ thống AI Assistant"
        description="Điểm số năng lực được tự động tổng hợp từ Điểm GPA (40%), Tỷ lệ nộp bài tập (35%) và Chuyên cần (25%)."
        type="info"
        showIcon
        icon={<LikeOutlined />}
        style={{ borderRadius: 10, padding: "8px 12px" }}
      />
    </Card>
  );
});

LearningScoreCard.displayName = "LearningScoreCard";

export default LearningScoreCard;
