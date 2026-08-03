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
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-page)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Tổng thông báo</span>}
            value={stats.total}
            prefix={<BellOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-title)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-primary-tint)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Chưa đọc</span>}
            value={stats.unread}
            prefix={<MailOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-action-primary-bg-active)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-success-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đã đọc</span>}
            value={stats.read}
            prefix={<CheckCircleOutlined style={{ color: "var(--color-success-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-success-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-warning-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Hôm nay</span>}
            value={stats.todayCount}
            prefix={<CalendarOutlined style={{ color: "var(--color-warning-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-warning-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4} style={{ flexGrow: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-secondary-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Tuần này</span>}
            value={stats.thisWeekCount}
            prefix={<HistoryOutlined style={{ color: "var(--color-secondary-icon)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-secondary-active)" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

NotificationSummary.displayName = "NotificationSummary";

export default NotificationSummary;
