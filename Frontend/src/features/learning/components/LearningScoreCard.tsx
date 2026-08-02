import React from "react";
import { Card, Progress, Typography, Tag } from "antd";
import { TrophyOutlined, RiseOutlined } from "@ant-design/icons";
import type { LearningScore } from "../types/learningDashboard.types";

const { Text, Title } = Typography;

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

  const getLevelBg = (level: LearningScore["level"]) => {
    switch (level) {
      case "Excellent":
        return "#f6ffed";
      case "Good":
        return "#e6f7ff";
      case "Average":
        return "#fff7e6";
      case "Needs Improvement":
      default:
        return "#fff1f0";
    }
  };

  const levelColor = getLevelColor(score.level);
  const levelBg = getLevelBg(score.level);

  return (
    <Card
      style={{
        borderRadius: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid #f0f0f0",
        height: "100%",
      }}
      styles={{ body: { padding: "24px" } }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <TrophyOutlined style={{ color: "#faad14", fontSize: 18 }} />
            <Text strong style={{ fontSize: 15, color: "#1f2937" }}>
              Năng lực học tập
            </Text>
          </div>
          <Text style={{ fontSize: 12, color: "#8c8c8c", lineHeight: 1.4 }}>
            Tổng hợp từ GPA, chuyên cần & bài tập
          </Text>
        </div>
        <Tag
          color="green"
          icon={<RiseOutlined />}
          style={{ borderRadius: 8, fontWeight: 600, fontSize: 12 }}
        >
          +{score.trendPercent}%
        </Tag>
      </div>

      {/* Score display */}
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 20 }}>
        <Progress
          type="dashboard"
          percent={score.score}
          size={120}
          strokeColor={levelColor}
          trailColor="rgba(0,0,0,0.06)"
          strokeWidth={8}
          format={(val) => (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: levelColor, lineHeight: 1 }}>
                {val}
              </div>
              <div style={{ fontSize: 10, color: "#8c8c8c", marginTop: 2 }}>/ 100</div>
            </div>
          )}
        />

        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              backgroundColor: levelBg,
              borderRadius: 10,
              padding: "6px 12px",
              marginBottom: 10,
              border: `1px solid ${levelColor}30`,
            }}
          >
            <Title level={4} style={{ margin: 0, color: levelColor, fontWeight: 800, fontSize: 18 }}>
              {score.level.toUpperCase()}
            </Title>
          </div>
          <Text
            style={{
              fontSize: 13,
              color: "#4b5563",
              display: "block",
              lineHeight: 1.6,
            }}
          >
            {score.feedback}
          </Text>
        </div>
      </div>

      {/* Formula note */}
      <div
        style={{
          backgroundColor: "#fafafa",
          borderRadius: 10,
          padding: "10px 14px",
          border: "1px solid #f0f0f0",
        }}
      >
        <Text style={{ fontSize: 12, color: "#8c8c8c", lineHeight: 1.5 }}>
          📊 <strong style={{ color: "#4b5563" }}>Công thức:</strong> GPA (40%) + Nộp bài (35%) + Chuyên cần (25%)
        </Text>
      </div>
    </Card>
  );
});

LearningScoreCard.displayName = "LearningScoreCard";

export default LearningScoreCard;
