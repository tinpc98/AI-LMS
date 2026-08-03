import React from "react";
import { Progress, Typography } from "antd";

const { Text } = Typography;

interface ClassProgressProps {
  // null/undefined = chưa xác định được tiến độ (lớp chưa có bài giảng lẫn bài tập).
  // Trường hợp này hiển thị "—" thay vì 0% để không khẳng định sai là học sinh chưa học gì.
  percent?: number | null;
}

export const ClassProgress: React.FC<ClassProgressProps> = React.memo(({ percent }) => {
  const isUnknown = typeof percent !== "number";
  const safePercent = isUnknown ? 0 : Math.min(100, Math.max(0, percent));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          Tiến độ học tập
        </Text>
        <Text
          strong
          style={{ fontSize: 12, color: isUnknown ? "var(--color-text-disabled)" : "var(--color-text-title)" }}
          title={isUnknown ? "Lớp chưa có bài giảng hoặc bài tập nào để tính tiến độ" : undefined}
        >
          {isUnknown ? "—" : `${safePercent}%`}
        </Text>
      </div>
      <Progress
        percent={safePercent}
        showInfo={false}
        size="small"
        strokeColor={
          isUnknown
            ? "var(--color-border-default)"
            : {
                "0%": "var(--color-action-primary-bg)",
                "100%": "var(--color-success-base)",
              }
        }
      />
    </div>
  );
});

ClassProgress.displayName = "ClassProgress";

export default ClassProgress;
