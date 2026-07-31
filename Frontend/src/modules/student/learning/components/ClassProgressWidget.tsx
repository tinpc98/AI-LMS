import React from "react";
import { Card, Typography, Progress, Space } from "antd";
import { BookOutlined } from "@ant-design/icons";
import type { ClassProgressItem } from "../types/learningDashboard.types";

const { Text } = Typography;

interface ClassProgressWidgetProps {
  classProgress: ClassProgressItem[];
}

export const ClassProgressWidget: React.FC<ClassProgressWidgetProps> = React.memo(
  ({ classProgress }) => {
    return (
      <Card
        title={
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            <BookOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Tiến độ học tập từng môn (
            {classProgress.length})
          </span>
        }
        style={{ borderRadius: 16, border: "1px solid #f0f0f0", marginBottom: 24 }}
        styles={{ body: { padding: 16 } }}
      >
        {classProgress.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 13, fontStyle: "italic" }}>
            Bạn chưa đăng ký lớp học nào.
          </Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {classProgress.map((item) => (
              <div key={item.classId}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 13, color: "#1f2937" }}>
                    {item.className}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    GV: {item.teacherName}
                  </Text>
                </div>

                <Progress percent={item.progressPercent} strokeColor="#1890ff" size="small" />
              </div>
            ))}
          </div>
        )}
      </Card>
    );
  }
);

ClassProgressWidget.displayName = "ClassProgressWidget";

export default ClassProgressWidget;
