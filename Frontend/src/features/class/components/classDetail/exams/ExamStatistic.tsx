import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  FormOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { StudentExamStats } from "../../../../../types/studentExam";

interface ExamStatisticProps {
  stats: StudentExamStats;
}

export const ExamStatistic: React.FC<ExamStatisticProps> = React.memo(({ stats }) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-page)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Tổng bài thi</span>}
            value={stats.total}
            prefix={<FormOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-text-title)" }}
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
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đang mở thi</span>}
            value={stats.available}
            prefix={<PlayCircleOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-action-primary-bg-active)" }}
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
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đang làm dở dang</span>}
            value={stats.inProgress}
            prefix={<SyncOutlined style={{ color: "var(--color-warning-base)", marginRight: 6 }} />}
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
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Đã hoàn thành</span>}
            value={stats.completed}
            prefix={<CheckCircleOutlined style={{ color: "var(--color-success-base)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-success-text)" }}
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
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Điểm thi trung bình</span>}
            value={stats.averageScore !== null ? stats.averageScore : "--"}
            suffix={stats.averageScore !== null ? "/ 10" : ""}
            prefix={<TrophyOutlined style={{ color: "var(--color-secondary-icon)", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-secondary-active)" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

ExamStatistic.displayName = "ExamStatistic";

export default ExamStatistic;
