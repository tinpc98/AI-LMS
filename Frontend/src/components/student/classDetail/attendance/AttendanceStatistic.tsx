import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { StudentAttendanceStats } from "../../../types/studentAttendance";

interface AttendanceStatisticProps {
  stats: StudentAttendanceStats;
}

export const AttendanceStatistic: React.FC<AttendanceStatisticProps> = React.memo(({ stats }) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#fafafa" }}>
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Tổng số buổi học</span>}
            value={stats.total}
            prefix={<CalendarOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#f6ffed" }}>
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Có mặt</span>}
            value={stats.present}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#389e0d" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#fffbe6" }}>
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đi muộn</span>}
            value={stats.late}
            prefix={<ClockCircleOutlined style={{ color: "#faad14", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#d48806" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#fff1f0" }}>
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Vắng mặt</span>}
            value={stats.absent}
            prefix={<CloseCircleOutlined style={{ color: "#ff4d4f", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#cf1322" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card bordered={false} styles={{ body: { padding: "12px 16px" } }} style={{ borderRadius: 12, backgroundColor: "#e6f7ff" }}>
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Có phép</span>}
            value={stats.excused}
            prefix={<InfoCircleOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#096dd9" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

AttendanceStatistic.displayName = "AttendanceStatistic";

export default AttendanceStatistic;
