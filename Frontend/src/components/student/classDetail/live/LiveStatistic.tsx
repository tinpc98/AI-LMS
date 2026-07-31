import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  VideoCameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { StudentLiveStats } from "../../../../types/studentLive";

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
          style={{ borderRadius: 12, backgroundColor: "#fafafa" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Tổng số buổi Live</span>}
            value={stats.total}
            prefix={<VideoCameraOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#f6ffed" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đã tham gia</span>}
            value={stats.attended}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#389e0d" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#fff1f0" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đã bỏ lỡ</span>}
            value={stats.missed}
            prefix={<CloseCircleOutlined style={{ color: "#ff4d4f", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#cf1322" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#e6f7ff" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Sắp diễn ra</span>}
            value={stats.upcoming}
            prefix={<ClockCircleOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#096dd9" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

LiveStatistic.displayName = "LiveStatistic";

export default LiveStatistic;
