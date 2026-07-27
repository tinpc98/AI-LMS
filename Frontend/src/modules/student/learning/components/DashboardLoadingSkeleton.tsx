import React from "react";
import { Skeleton, Row, Col, Card } from "antd";

export const DashboardLoadingSkeleton: React.FC = React.memo(() => {
  return (
    <div style={{ padding: "12px 0" }}>
      <Card style={{ borderRadius: 20, marginBottom: 24 }}>
        <Skeleton active avatar paragraph={{ rows: 2 }} />
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {Array.from({ length: 4 }).map((_, idx) => (
          <Col key={idx} xs={12} sm={6}>
            <Card style={{ borderRadius: 16 }}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={15} xl={16}>
          <Card style={{ borderRadius: 16, marginBottom: 24 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
          <Card style={{ borderRadius: 16 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>

        <Col xs={24} lg={9} xl={8}>
          <Card style={{ borderRadius: 16, marginBottom: 24 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
          <Card style={{ borderRadius: 16 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
      </Row>
    </div>
  );
});

DashboardLoadingSkeleton.displayName = "DashboardLoadingSkeleton";

export default DashboardLoadingSkeleton;
