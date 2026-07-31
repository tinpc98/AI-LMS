import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { StudentAssignmentStats } from "../../../../../types/studentAssignment";

interface AssignmentStatisticProps {
  stats: StudentAssignmentStats;
}

export const AssignmentStatistic: React.FC<AssignmentStatisticProps> = React.memo(({ stats }) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#fafafa" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Tổng bài tập</span>}
            value={stats.total}
            prefix={<FileTextOutlined style={{ color: "#1890ff", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#fffbe6" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Chưa nộp</span>}
            value={stats.pending}
            prefix={<ClockCircleOutlined style={{ color: "#faad14", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#d48806" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#f6ffed" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đã nộp bài</span>}
            value={stats.submitted}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#389e0d" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#fff1f0" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Quá hạn / Trễ</span>}
            value={stats.late}
            prefix={<ExclamationCircleOutlined style={{ color: "#ff4d4f", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#cf1322" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#f9f0ff" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Điểm trung bình</span>}
            value={stats.averageGrade !== null ? stats.averageGrade : "--"}
            suffix={stats.averageGrade !== null ? "/ 10" : ""}
            prefix={<TrophyOutlined style={{ color: "#722ed1", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#531dab" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

AssignmentStatistic.displayName = "AssignmentStatistic";

export default AssignmentStatistic;
