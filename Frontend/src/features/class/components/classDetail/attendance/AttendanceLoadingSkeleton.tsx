import React from "react";
import { Card, Skeleton, Row, Col } from "antd";

interface AttendanceLoadingSkeletonProps {
  count?: number;
}

export const AttendanceLoadingSkeleton: React.FC<AttendanceLoadingSkeletonProps> = React.memo(
  ({ count = 4 }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={16}>
            <Card style={{ borderRadius: 16 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card style={{ borderRadius: 16 }}>
              <Skeleton active avatar paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        </Row>

        <Card style={{ borderRadius: 16 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }
);

AttendanceLoadingSkeleton.displayName = "AttendanceLoadingSkeleton";

export default AttendanceLoadingSkeleton;
