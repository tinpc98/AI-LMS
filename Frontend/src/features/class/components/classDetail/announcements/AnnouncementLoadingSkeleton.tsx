import React from "react";
import { Card, Skeleton } from "antd";

interface AnnouncementLoadingSkeletonProps {
  count?: number;
}

export const AnnouncementLoadingSkeleton: React.FC<AnnouncementLoadingSkeletonProps> = React.memo(
  ({ count = 4 }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {Array.from({ length: count }).map((_, index) => (
          <Card key={index} style={{ borderRadius: 16 }}>
            <Skeleton active avatar paragraph={{ rows: 3 }} />
          </Card>
        ))}
      </div>
    );
  }
);

AnnouncementLoadingSkeleton.displayName = "AnnouncementLoadingSkeleton";

export default AnnouncementLoadingSkeleton;
