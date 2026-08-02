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
          <FormOutlined style={{ color: "#722ed1", fontSize: 16 }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1f2937" }}>Lịch thi sắp tới</span>
          {exams.length > 0 && (
            <Text
              style={{
                fontSize: 12,
                color: "#722ed1",
                backgroundColor: "#f9f0ff",
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
        border: "1px solid #f0f0f0",
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
            color: "#bfbfbf",
            fontSize: 13,
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 28, marginBottom: 10, display: "block", color: "#52c41a" }} />
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
                  backgroundColor: isCompleted ? "#f6ffed" : "#f9f0ff",
                  border: `1px solid ${isCompleted ? "#d9f7be" : "#e9d5f7"}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  transition: "all 0.2s ease",
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
                      color: isCompleted ? "#389e0d" : "#391085",
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
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>
                    <ClockCircleOutlined style={{ marginRight: 4, fontSize: 11 }} />
                    {item.className}
                  </Text>
                  {item.score !== null && (
                    <Text style={{ fontSize: 12, color: "#52c41a", fontWeight: 600 }}>
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
                color: "#8c8c8c",
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
