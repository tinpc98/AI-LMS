import React from "react";
import { Row, Col, Card, Skeleton } from "antd";

interface ExamLoadingSkeletonProps {
  count?: number;
}

export const ExamLoadingSkeleton: React.FC<ExamLoadingSkeletonProps> = React.memo(
  ({ count = 6 }) => {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: count }).map((_, index) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={index}>
            <Card
              style={{
                borderRadius: 16,
                height: 260,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Skeleton active avatar paragraph={{ rows: 4 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }
);

ExamLoadingSkeleton.displayName = "ExamLoadingSkeleton";

export default ExamLoadingSkeleton;
