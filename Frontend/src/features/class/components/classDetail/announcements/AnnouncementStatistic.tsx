import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  NotificationOutlined,
  BellOutlined,
  CheckCircleOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import type { StudentAnnouncementStats } from "../../../../../types/studentAnnouncement";

interface AnnouncementStatisticProps {
  stats: StudentAnnouncementStats;
}

export const AnnouncementStatistic: React.FC<AnnouncementStatisticProps> = React.memo(
  ({ stats }) => {
    return (
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            styles={{ body: { padding: "12px 16px" } }}
            style={{ borderRadius: 12, backgroundColor: "var(--color-bg-page)" }}
          >
            <Statistic
              title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Tổng số thông báo</span>}
              value={stats.total}
              prefix={<NotificationOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-title)" }}
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
              title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Chưa đọc</span>}
              value={stats.unread}
              prefix={<BellOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-action-primary-bg-active)" }}
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
              title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đã đọc</span>}
              value={stats.read}
              prefix={<CheckCircleOutlined style={{ color: "var(--color-success-base)", marginRight: 4 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-success-text)" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            styles={{ body: { padding: "12px 16px" } }}
            style={{ borderRadius: 12, backgroundColor: "var(--color-warning-bg)" }}
          >
            <Statistic
              title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Thông báo ghim</span>}
              value={stats.pinned}
              prefix={<PushpinOutlined style={{ color: "var(--color-warning-base)", marginRight: 4 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-warning-text)" }}
            />
          </Card>
        </Col>
      </Row>
    );
  }
);

AnnouncementStatistic.displayName = "AnnouncementStatistic";

export default AnnouncementStatistic;
