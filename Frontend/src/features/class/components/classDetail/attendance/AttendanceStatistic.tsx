import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { StudentAttendanceStats } from "../../../../../types/studentAttendance";

interface AttendanceStatisticProps {
  stats: StudentAttendanceStats;
}

export const AttendanceStatistic: React.FC<AttendanceStatisticProps> = React.memo(({ stats }) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-page)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Tổng số buổi học</span>}
            value={stats.total}
            prefix={<CalendarOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-title)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-success-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Có mặt</span>}
            value={stats.present}
            prefix={<CheckCircleOutlined style={{ color: "var(--color-success-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-success-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-warning-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đi muộn</span>}
            value={stats.late}
            prefix={<ClockCircleOutlined style={{ color: "var(--color-warning-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-warning-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-error-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Vắng mặt</span>}
            value={stats.absent}
            prefix={<CloseCircleOutlined style={{ color: "var(--color-error-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-error-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-primary-tint)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Có phép</span>}
            value={stats.excused}
            prefix={<InfoCircleOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-action-primary-bg-active)" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

AttendanceStatistic.displayName = "AttendanceStatistic";

export default AttendanceStatistic;
