import React from "react";
import { Row, Col, Card, Skeleton } from "antd";

interface MaterialLoadingSkeletonProps {
  count?: number;
}

export const MaterialLoadingSkeleton: React.FC<MaterialLoadingSkeletonProps> = React.memo(
  ({ count = 6 }) => {
    return (
      <Row gutter={[16, 16]}>
        {Array.from({ length: count }).map((_, index) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={index}>
            <Card
              style={{
                borderRadius: 16,
                height: 240,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              }}
            >
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }
);

MaterialLoadingSkeleton.displayName = "MaterialLoadingSkeleton";

export default MaterialLoadingSkeleton;
