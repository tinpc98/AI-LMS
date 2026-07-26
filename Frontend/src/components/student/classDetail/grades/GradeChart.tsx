import React from "react";
import { Card, Typography, Row, Col, Progress, Tooltip } from "antd";
import { BarChartOutlined } from "@ant-design/icons";
import type { IGradeItem } from "../../../types/studentGrade";

const { Text } = Typography;

interface GradeChartProps {
  items: IGradeItem[];
}

export const GradeChart: React.FC<GradeChartProps> = React.memo(({ items }) => {
  const gradedItems = items.filter((i) => i.status === "Graded" && i.score !== null);

  if (gradedItems.length === 0) return null;

  return (
    <Card
      title={
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          <BarChartOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Biểu đồ phân bổ điểm số các đầu điểm
        </span>
      }
      size="small"
      style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
    >
      <Row gutter={[12, 16]} align="bottom" style={{ height: 160, padding: "12px 8px" }}>
        {gradedItems.slice(0, 8).map((item) => {
          const score = item.score || 0;
          const heightPercent = Math.max(10, Math.round((score / item.maxScore) * 100));
          const color = score >= 8 ? "#52c41a" : score >= 6.5 ? "#1890ff" : score >= 5 ? "#faad14" : "#ff4d4f";

          return (
            <Col key={item._id} flex="1" style={{ textAlign: "center", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center" }}>
              <Tooltip title={`${item.title}: ${score}/${item.maxScore} đ`}>
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <Text strong style={{ fontSize: 11, color, marginBottom: 4 }}>
                    {score}
                  </Text>
                  <div
                    style={{
                      width: "60%",
                      maxWidth: 36,
                      height: `${heightPercent * 1.1}px`,
                      backgroundColor: color,
                      borderRadius: "6px 6px 0 0",
                      transition: "height 0.3s ease",
                    }}
                  />
                </div>
              </Tooltip>
              <Text
                type="secondary"
                ellipsis
                style={{ fontSize: 10, marginTop: 6, maxWidth: 60, display: "block" }}
              >
                {item.title}
              </Text>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
});

GradeChart.displayName = "GradeChart";

export default GradeChart;
