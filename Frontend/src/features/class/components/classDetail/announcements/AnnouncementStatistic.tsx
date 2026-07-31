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
            style={{ borderRadius: 12, backgroundColor: "#fafafa" }}
          >
            <Statistic
              title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Tổng số thông báo</span>}
              value={stats.total}
              prefix={<NotificationOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}
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
              title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Chưa đọc</span>}
              value={stats.unread}
              prefix={<BellOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#096dd9" }}
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
              title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đã đọc</span>}
              value={stats.read}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#389e0d" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6}>
          <Card
            bordered={false}
            styles={{ body: { padding: "12px 16px" } }}
            style={{ borderRadius: 12, backgroundColor: "#fff2e8" }}
          >
            <Statistic
              title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Thông báo ghim</span>}
              value={stats.pinned}
              prefix={<PushpinOutlined style={{ color: "#fa541c", marginRight: 4 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 700, color: "#d4380d" }}
            />
          </Card>
        </Col>
      </Row>
    );
  }
);

AnnouncementStatistic.displayName = "AnnouncementStatistic";

export default AnnouncementStatistic;
