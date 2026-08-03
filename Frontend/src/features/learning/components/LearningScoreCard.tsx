import React from "react";
import { Card, Progress, Typography, Tag } from "antd";
import { TrophyOutlined, RiseOutlined } from "@ant-design/icons";
import type { LearningScore } from "../types/learningDashboard.types";
import { formatLearningLevel } from "../../../shared/utils/labelFormatters";

const { Text, Title } = Typography;

interface LearningScoreCardProps {
  score: LearningScore;
}

export const LearningScoreCard: React.FC<LearningScoreCardProps> = React.memo(({ score }) => {
  const getLevelColor = (level: LearningScore["level"]) => {
    switch (level) {
      case "Excellent":
        return "var(--color-success-base)";
      case "Good":
        return "var(--color-action-primary-bg)";
      case "Average":
        return "var(--color-warning-base)";
      case "Needs Improvement":
      default:
        return "var(--color-error-base)";
    }
  };

  const getLevelBg = (level: LearningScore["level"]) => {
    switch (level) {
      case "Excellent":
        return "var(--color-success-bg)";
      case "Good":
        return "var(--color-bg-primary-tint)";
      case "Average":
        return "var(--color-warning-bg)";
      case "Needs Improvement":
      default:
        return "var(--color-error-bg)";
    }
  };

  const levelColor = getLevelColor(score.level);
  const levelBg = getLevelBg(score.level);

  return (
    <Card
      style={{
        borderRadius: 20,
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        border: "1px solid var(--color-border-default)",
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
            <TrophyOutlined style={{ color: "var(--color-warning-base)", fontSize: 18 }} />
            <Text strong style={{ fontSize: 15, color: "var(--color-text-title)" }}>
              Năng lực học tập
            </Text>
          </div>
          <Text style={{ fontSize: 12, color: "var(--color-text-description)", lineHeight: 1.4 }}>
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
              <div style={{ fontSize: 10, color: "var(--color-text-description)", marginTop: 2 }}>/ 100</div>
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
              {formatLearningLevel(score.level).toUpperCase()}
            </Title>
          </div>
          <Text
            style={{
              fontSize: 13,
              color: "var(--color-text-body)",
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
          backgroundColor: "var(--color-bg-page)",
          borderRadius: 10,
          padding: "10px 14px",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <Text style={{ fontSize: 12, color: "var(--color-text-description)", lineHeight: 1.5 }}>
          📊 <strong style={{ color: "var(--color-text-body)" }}>Công thức:</strong> GPA (40%) + Nộp bài (35%) + Chuyên cần (25%)
        </Text>
      </div>
    </Card>
  );
});

LearningScoreCard.displayName = "LearningScoreCard";

export default LearningScoreCard;
