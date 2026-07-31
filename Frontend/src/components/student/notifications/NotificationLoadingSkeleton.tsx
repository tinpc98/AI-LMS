import React from "react";
import { Card, Skeleton } from "antd";

interface NotificationLoadingSkeletonProps {
  count?: number;
}

export const NotificationLoadingSkeleton: React.FC<NotificationLoadingSkeletonProps> = React.memo(
  ({ count = 5 }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} style={{ borderRadius: 16 }}>
            <Skeleton active avatar paragraph={{ rows: 2 }} />
          </Card>
        ))}
      </div>
    );
  }
);

NotificationLoadingSkeleton.displayName = "NotificationLoadingSkeleton";

export default NotificationLoadingSkeleton;
