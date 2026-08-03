import React, { useState } from "react";
import { Card, Typography, Tag, Space, Collapse, Button } from "antd";
import {
  StarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CompassOutlined,
  RobotOutlined,
  DownOutlined,
} from "@ant-design/icons";
import type { LearningInsight } from "../types/learningDashboard.types";

const { Text } = Typography;
const { Panel } = Collapse;

interface LearningInsightsWidgetProps {
  insight: LearningInsight;
}

export const LearningInsightsWidget: React.FC<LearningInsightsWidgetProps> = React.memo(
  ({ insight }) => {
    const [expanded, setExpanded] = useState(false);

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

    const getRiskLabel = (level: LearningInsight["riskLevel"]) => {
      switch (level) {
        case "high":
          return "Cần chú ý";
        case "medium":
          return "Trung bình";
        default:
          return "Tốt";
      }
    };

    const handleAskAI = (prompt: string) => {
      window.dispatchEvent(new CustomEvent("open-ai-chat", { detail: { prompt } }));
    };

    return (
      <Card
        style={{
          borderRadius: 20,
          background: "linear-gradient(135deg, var(--color-secondary-bg) 0%, var(--color-surface) 60%)",
          border: "1px solid var(--color-secondary-border)",
          marginBottom: 32,
          boxShadow: "0 2px 12px rgba(114, 46, 209, 0.08)",
        }}
        styles={{ body: { padding: "20px 24px" } }}
      >
        {/* Header row — tiêu đề được cung cấp bởi SectionHeader bên ngoài */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: "var(--color-secondary-icon)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RobotOutlined style={{ color: "var(--color-surface)", fontSize: 18 }} />
            </div>
          </div>
          <Tag
            color={getRiskColor(insight.riskLevel)}
            icon={<WarningOutlined />}
            style={{ borderRadius: 8, fontWeight: 600, fontSize: 12, padding: "2px 10px" }}
          >
            {getRiskLabel(insight.riskLevel)}
          </Tag>
        </div>

        {/* Subjects row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            backgroundColor: "var(--color-surface)",
            borderRadius: 12,
            padding: "14px 16px",
            border: "1px solid var(--color-secondary-bg)",
            marginBottom: 16,
          }}
        >
          {/* Strong subjects */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <Text style={{ fontSize: 12, color: "var(--color-text-description)", display: "block", marginBottom: 6 }}>
              🌟 Điểm mạnh
            </Text>
            <Space size={6} wrap>
              {insight.strongSubjects.length === 0 ? (
                <Text style={{ fontSize: 12, color: "var(--color-text-disabled)", fontStyle: "italic" }}>
                  Chưa có dữ liệu
                </Text>
              ) : (
                insight.strongSubjects.map((s, idx) => (
                  <Tag
                    key={idx}
                    color="green"
                    icon={<CheckCircleOutlined />}
                    style={{ borderRadius: 8, fontSize: 12 }}
                  >
                    {s}
                  </Tag>
                ))
              )}
            </Space>
          </div>

          {/* Weak subjects */}
          <div style={{ flex: 1, minWidth: 140 }}>
            <Text style={{ fontSize: 12, color: "var(--color-text-description)", display: "block", marginBottom: 6 }}>
              ⚠️ Cần cải thiện
            </Text>
            <Space size={6} wrap>
              {insight.weakSubjects.length === 0 ? (
                <Text style={{ fontSize: 12, color: "var(--color-text-disabled)", fontStyle: "italic" }}>
                  Không có
                </Text>
              ) : (
                insight.weakSubjects.map((s, idx) => (
                  <Tag key={idx} color="volcano" icon={<WarningOutlined />} style={{ borderRadius: 8, fontSize: 12 }}>
                    {s}
                  </Tag>
                ))
              )}
            </Space>
          </div>
        </div>

        {/* Recommendations — collapsible */}
        {insight.recommendedActions.length > 0 && (
          <Collapse
            ghost
            activeKey={expanded ? ["rec"] : []}
            onChange={() => setExpanded(!expanded)}
            style={{ marginBottom: 0 }}
          >
            <Panel
              key="rec"
              header={
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <CompassOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 14 }} />
                  <Text style={{ fontSize: 13, color: "var(--color-secondary-icon)", fontWeight: 600 }}>
                    Khuyến nghị từ AI ({insight.recommendedActions.length})
                  </Text>
                  <DownOutlined
                    style={{
                      fontSize: 11,
                      color: "var(--color-secondary-icon)",
                      transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform var(--duration-fast) var(--ease-out)",
                    }}
                  />
                </div>
              }
              showArrow={false}
              style={{
                backgroundColor: "rgba(114,46,209,0.04)",
                borderRadius: 10,
                border: "1px solid var(--color-secondary-border)",
              }}
            >
              <ul
                style={{
                  paddingLeft: 16,
                  margin: "4px 0 8px 0",
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: "var(--color-text-body)",
                }}
              >
                {insight.recommendedActions.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </Panel>
          </Collapse>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <Button
            type="default"
            size="small"
            icon={<StarOutlined />}
            onClick={() => handleAskAI("Xem phân tích chi tiết tiến độ học tập của tôi")}
            style={{
              borderRadius: 8,
              borderColor: "var(--color-secondary-icon)",
              color: "var(--color-secondary-icon)",
              fontWeight: 500,
              fontSize: 13,
              height: 34,
              paddingInline: 14,
            }}
          >
            Xem phân tích
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<RobotOutlined />}
            onClick={() =>
              handleAskAI(
                insight.weakSubjects.length > 0
                  ? `Tôi cần cải thiện môn ${insight.weakSubjects.join(", ")}. Hãy tư vấn lộ trình học tập cho tôi.`
                  : "Tư vấn lộ trình học tập tối ưu cho tôi"
              )
            }
            style={{
              borderRadius: 8,
              background: "var(--color-secondary-icon)",
              borderColor: "var(--color-secondary-icon)",
              fontWeight: 500,
              fontSize: 13,
              height: 34,
              paddingInline: 14,
            }}
          >
            Trao đổi với AI
          </Button>
        </div>
      </Card>
    );
  }
);

LearningInsightsWidget.displayName = "LearningInsightsWidget";

export default LearningInsightsWidget;
