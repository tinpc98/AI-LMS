import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { StudentLiveStats } from "../../../../../types/studentLive";

interface LiveStatisticProps {
  stats: StudentLiveStats;
}

export const LiveStatistic: React.FC<LiveStatisticProps> = React.memo(({ stats }) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={6}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-page)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Tổng số buổi Live</span>}
            value={stats.total}
            prefix={<VideoCameraOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-title)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-success-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đã tham gia</span>}
            value={stats.attended}
            prefix={<CheckCircleOutlined style={{ color: "var(--color-success-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-success-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-error-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đã bỏ lỡ</span>}
            value={stats.missed}
            prefix={<CloseCircleOutlined style={{ color: "var(--color-error-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-error-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-primary-tint)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Sắp diễn ra</span>}
            value={stats.upcoming}
            prefix={<ClockCircleOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-action-primary-bg-active)" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

LiveStatistic.displayName = "LiveStatistic";

export default LiveStatistic;
