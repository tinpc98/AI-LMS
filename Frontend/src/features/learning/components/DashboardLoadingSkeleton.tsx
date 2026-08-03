import React from "react";
import { Skeleton, Row, Col, Card } from "antd";

export const DashboardLoadingSkeleton: React.FC = React.memo(() => {
  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Section 1: Welcome Banner skeleton */}
      <Card
        style={{
          borderRadius: 20,
          marginBottom: 32,
          background: "linear-gradient(135deg, var(--color-bg-primary-tint) 0%, var(--color-border-primary-tint) 100%)",
          border: "none",
        }}
        styles={{ body: { padding: "28px 32px" } }}
      >
        <Skeleton active avatar={{ size: 64, shape: "circle" }} paragraph={{ rows: 1 }} />
        <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Col key={idx} xs={12} sm={6}>
              <Skeleton.Input active block style={{ height: 72, borderRadius: 16 }} />
            </Col>
          ))}
        </Row>
      </Card>

      {/* Section 2: Today's tasks — 3 columns */}
      <Skeleton.Input
        active
        block
        style={{ height: 28, width: 200, borderRadius: 8, marginBottom: 16 }}
      />
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={9}>
          <Card style={{ borderRadius: 20 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card style={{ borderRadius: 20 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
        <Col xs={24} lg={6}>
          <Card style={{ borderRadius: 20 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
      </Row>

      {/* Section 3: AI Insight */}
      <Skeleton.Input
        active
        block
        style={{ height: 28, width: 200, borderRadius: 8, marginBottom: 16 }}
      />
      <Card style={{ borderRadius: 20, marginBottom: 32 }}>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>

      {/* Section 4: Performance */}
      <Skeleton.Input
        active
        block
        style={{ height: 28, width: 200, borderRadius: 8, marginBottom: 16 }}
      />
      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={10}>
          <Card style={{ borderRadius: 20 }}>
            <Skeleton active paragraph={{ rows: 4 }} />
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Row gutter={[16, 16]}>
            {Array.from({ length: 4 }).map((_, idx) => (
              <Col key={idx} xs={12} sm={6}>
                <Card style={{ borderRadius: 18 }}>
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
      <Card style={{ borderRadius: 20 }}>
        <Skeleton active paragraph={{ rows: 5 }} />
      </Card>
    </div>
  );
});

DashboardLoadingSkeleton.displayName = "DashboardLoadingSkeleton";

export default DashboardLoadingSkeleton;
