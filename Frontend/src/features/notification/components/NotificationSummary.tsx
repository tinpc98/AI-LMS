import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  BellOutlined,
  MailOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import type { NotificationStats } from "../../../types/studentNotification";

interface NotificationSummaryProps {
  stats: NotificationStats;
}

export const NotificationSummary: React.FC<NotificationSummaryProps> = React.memo(({ stats }) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#fafafa" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Tổng thông báo</span>}
            value={stats.total}
            prefix={<BellOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#e6f7ff" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Chưa đọc</span>}
            value={stats.unread}
            prefix={<MailOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#096dd9" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#f6ffed" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đã đọc</span>}
            value={stats.read}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#389e0d" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#fff7e6" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Hôm nay</span>}
            value={stats.todayCount}
            prefix={<CalendarOutlined style={{ color: "#fa8c16", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#d46b08" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#f9f0ff" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Tuần này</span>}
            value={stats.thisWeekCount}
            prefix={<HistoryOutlined style={{ color: "#722ed1", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#531dab" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

NotificationSummary.displayName = "NotificationSummary";

export default NotificationSummary;
