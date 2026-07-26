import React from "react";
import { Card, Typography, Tag, Space } from "antd";
import { FormOutlined, ClockCircleOutlined } from "@ant-design/icons";
import type { ExamSummaryItem } from "../types/learningDashboard.types";

const { Text } = Typography;

interface UpcomingExamsWidgetProps {
  exams: ExamSummaryItem[];
}

export const UpcomingExamsWidget: React.FC<UpcomingExamsWidgetProps> = React.memo(({ exams }) => {
  return (
    <Card
      title={
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          <FormOutlined style={{ color: "#722ed1", marginRight: 6 }} /> Lịch thi & Kiểm tra sắp tới ({exams.length})
        </span>
      }
      style={{ borderRadius: 16, border: "1px solid #f0f0f0", marginBottom: 24 }}
      styles={{ body: { padding: 16 } }}
    >
      {exams.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 13, fontStyle: "italic" }}>
          Hiện không có lịch thi nào sắp tới.
        </Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {exams.slice(0, 3).map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: "#f9f0ff",
                border: "1px solid #d3ade6",
                borderRadius: 12,
                padding: "10px 14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Text strong style={{ fontSize: 13, color: "#391085" }}>
                  {item.title}
                </Text>
                <Tag color="purple" style={{ borderRadius: 6 }}>
                  {item.duration} phút
                </Tag>
              </div>

              <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} /> Lớp: {item.className}
              </Text>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});

UpcomingExamsWidget.displayName = "UpcomingExamsWidget";

export default UpcomingExamsWidget;
