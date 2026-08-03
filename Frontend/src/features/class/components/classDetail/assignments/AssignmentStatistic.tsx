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
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-page)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Tổng bài tập</span>}
            value={stats.total}
            prefix={<FileTextOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-title)" }}
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
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Chưa nộp</span>}
            value={stats.pending}
            prefix={<ClockCircleOutlined style={{ color: "var(--color-warning-base)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-warning-text)" }}
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
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đã nộp bài</span>}
            value={stats.submitted}
            prefix={<CheckCircleOutlined style={{ color: "var(--color-success-base)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-success-text)" }}
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
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Quá hạn / Trễ</span>}
            value={stats.late}
            prefix={<ExclamationCircleOutlined style={{ color: "var(--color-error-base)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-error-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-secondary-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Điểm trung bình</span>}
            value={stats.averageGrade !== null ? stats.averageGrade : "--"}
            suffix={stats.averageGrade !== null ? "/ 10" : ""}
            prefix={<TrophyOutlined style={{ color: "var(--color-secondary-icon)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-secondary-active)" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

AssignmentStatistic.displayName = "AssignmentStatistic";

export default AssignmentStatistic;
