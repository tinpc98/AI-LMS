import React from "react";
import { Card, Typography, Tag, Space, Alert } from "antd";
import { StarOutlined, CheckCircleOutlined, WarningOutlined, CompassOutlined } from "@ant-design/icons";
import type { LearningInsight } from "../types/learningDashboard.types";

const { Text, Paragraph } = Typography;

interface LearningInsightsWidgetProps {
  insight: LearningInsight;
}

export const LearningInsightsWidget: React.FC<LearningInsightsWidgetProps> = React.memo(({ insight }) => {
  const getRiskColor = (level: LearningInsight["riskLevel"]) => {
    switch (level) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
      default:
        return "green";
    }
  };

  return (
    <Card
      title={
        <Space align="center">
          <StarOutlined style={{ color: "#722ed1", fontSize: 18 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#391085" }}>
            🤖 AI Learning Insights & Gợi ý lộ trình
          </span>
        </Space>
      }
      extra={
        <Tag color={getRiskColor(insight.riskLevel)} icon={<WarningOutlined />} style={{ borderRadius: 6, fontWeight: 700 }}>
          Rủi ro: {insight.riskLevel.toUpperCase()}
        </Tag>
      }
      style={{
        borderRadius: 16,
        background: "linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)",
        border: "1px solid #d3ade6",
        marginBottom: 24,
      }}
      styles={{ body: { padding: 18 } }}
    >
      {/* Strong & Weak Subjects */}
      <div style={{ marginBottom: 16 }}>
        <Text strong style={{ fontSize: 13, color: "#1f2937", display: "block", marginBottom: 6 }}>
          🌟 Môn học thế mạnh:
        </Text>
        <Space size={6} wrap style={{ marginBottom: 10 }}>
          {insight.strongSubjects.map((s, idx) => (
            <Tag key={idx} color="green" icon={<CheckCircleOutlined />} style={{ borderRadius: 6 }}>
              {s}
            </Tag>
          ))}
        </Space>

        <Text strong style={{ fontSize: 13, color: "#1f2937", display: "block", marginBottom: 6 }}>
          ⚠️ Môn học cần lưu ý cải thiện:
        </Text>
        <Space size={6} wrap>
          {insight.weakSubjects.map((s, idx) => (
            <Tag key={idx} color="volcano" icon={<WarningOutlined />} style={{ borderRadius: 6 }}>
              {s}
            </Tag>
          ))}
        </Space>
      </div>

      {/* Recommended Actions */}
      {insight.recommendedActions.length > 0 && (
        <Alert
          message={
            <Space align="center">
              <CompassOutlined style={{ color: "#722ed1" }} />
              <strong>Gợi ý từ AI Study Assistant dành cho bạn:</strong>
            </Space>
          }
          description={
            <ul style={{ paddingLeft: 18, margin: "6px 0 0 0", fontSize: 12, lineHeight: 1.6 }}>
              {insight.recommendedActions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          }
          type="info"
          style={{ borderRadius: 12, backgroundColor: "#ffffff", border: "1px solid #e8d5f5" }}
        />
      )}
    </Card>
  );
});

LearningInsightsWidget.displayName = "LearningInsightsWidget";

export default LearningInsightsWidget;
