import React from "react";
import { Card, Typography, Tag } from "antd";
import { FormOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { ExamSummaryItem } from "../types/learningDashboard.types";

const { Text } = Typography;

interface UpcomingExamsWidgetProps {
  exams: ExamSummaryItem[];
}

export const UpcomingExamsWidget: React.FC<UpcomingExamsWidgetProps> = React.memo(({ exams }) => {
  const displayed = exams.slice(0, 3);

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FormOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 16 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-title)" }}>Lịch thi sắp tới</span>
          {exams.length > 0 && (
            <Text
              style={{
                fontSize: 12,
                color: "var(--color-secondary-icon)",
                backgroundColor: "var(--color-secondary-bg)",
                borderRadius: 8,
                padding: "1px 8px",
                fontWeight: 600,
              }}
            >
              {exams.length}
            </Text>
          )}
        </div>
      }
      style={{
        borderRadius: 20,
        border: "1px solid var(--color-border-default)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
        height: "100%",
      }}
      styles={{ body: { padding: "8px 20px 20px" } }}
    >
      {exams.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "32px 0",
            color: "var(--color-text-disabled)",
            fontSize: 13,
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 28, marginBottom: 10, display: "block", color: "var(--color-success-base)" }} />
          Không có lịch thi nào sắp tới.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {displayed.map((item) => {
            const isCompleted = item.status === "COMPLETED";

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: isCompleted ? "var(--color-success-bg)" : "var(--color-secondary-bg)",
                  border: `1px solid ${isCompleted ? "var(--color-border-default)" : "var(--color-secondary-border)"}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  transition: "var(--transition-fast)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 8,
                    gap: 8,
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      color: isCompleted ? "var(--color-success-text)" : "var(--color-secondary-active)",
                      lineHeight: 1.3,
                      flex: 1,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Tag
                    color={isCompleted ? "success" : "purple"}
                    style={{ borderRadius: 8, fontSize: 11, flexShrink: 0 }}
                  >
                    {isCompleted ? "Đã thi" : `${item.duration} phút`}
                  </Tag>
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 12px" }}>
                  <Text style={{ fontSize: 12, color: "var(--color-text-description)" }}>
                    <ClockCircleOutlined style={{ marginRight: 4, fontSize: 11 }} />
                    {item.className}
                  </Text>
                  {item.score !== null && (
                    <Text style={{ fontSize: 12, color: "var(--color-success-base)", fontWeight: 600 }}>
                      Điểm: {item.score} / {item.maxScore}
                    </Text>
                  )}
                </div>
              </div>
            );
          })}

          {exams.length > 3 && (
            <Text
              style={{
                fontSize: 12,
                color: "var(--color-text-description)",
                textAlign: "center",
                display: "block",
                paddingTop: 4,
              }}
            >
              + {exams.length - 3} lịch thi khác
            </Text>
          )}
        </div>
      )}
    </Card>
  );
});

UpcomingExamsWidget.displayName = "UpcomingExamsWidget";

export default UpcomingExamsWidget;
