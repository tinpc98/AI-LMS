import React from "react";
import { Card, Skeleton } from "antd";

interface GradeLoadingSkeletonProps {
  count?: number;
}

export const GradeLoadingSkeleton: React.FC<GradeLoadingSkeletonProps> = React.memo(
  ({ count = 4 }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ borderRadius: 16 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>

        <Card style={{ borderRadius: 16 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }
);

GradeLoadingSkeleton.displayName = "GradeLoadingSkeleton";

export default GradeLoadingSkeleton;
