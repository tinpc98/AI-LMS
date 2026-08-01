import React from "react";
import { Card, Skeleton, Row, Col } from "antd";

interface LiveLoadingSkeletonProps {
  count?: number;
}

export const LiveLoadingSkeleton: React.FC<LiveLoadingSkeletonProps> = React.memo(
  ({ count = 4 }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Card style={{ borderRadius: 16, height: 220 }}>
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Card style={{ borderRadius: 16 }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card style={{ borderRadius: 16 }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
);

LiveLoadingSkeleton.displayName = "LiveLoadingSkeleton";

export default LiveLoadingSkeleton;
