import React from "react";
import { Progress, Typography } from "antd";

const { Text } = Typography;

interface ClassProgressProps {
  percent?: number;
}

export const ClassProgress: React.FC<ClassProgressProps> = React.memo(({ percent = 0 }) => {
  const safePercent = Math.min(100, Math.max(0, percent));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Tiến độ học tập
        </Text>
        <Text strong style={{ fontSize: 12, color: "#1f2937" }}>
          {safePercent}%
        </Text>
      </div>
      <Progress
        percent={safePercent}
        showInfo={false}
        size="small"
        strokeColor={{
          "0%": "#108ee9",
          "100%": "#87d068",
        }}
      />
    </div>
  );
});

ClassProgress.displayName = "ClassProgress";

export default ClassProgress;
