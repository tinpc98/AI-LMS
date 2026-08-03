import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  TrophyOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  FormOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { StudentGradeStats } from "../../../../../types/studentGrade";

interface GradeStatisticProps {
  stats: StudentGradeStats;
}

export const GradeStatistic: React.FC<GradeStatisticProps> = React.memo(({ stats }) => {
  return (
    <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-secondary-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>GPA tích lũy</span>}
            value={stats.gpa !== null ? stats.gpa : "--"}
            suffix={stats.gpa !== null ? "/ 10" : ""}
            prefix={<TrophyOutlined style={{ color: "var(--color-secondary-icon)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-secondary-active)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-primary-tint)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>ĐTB lớp học</span>}
            value={stats.classAvgGpa !== null ? stats.classAvgGpa : "--"}
            suffix={stats.classAvgGpa !== null ? "/ 10" : ""}
            prefix={<TeamOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-action-primary-bg-active)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-success-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Số bài đã chấm</span>}
            value={stats.gradedCount}
            prefix={<CheckCircleOutlined style={{ color: "var(--color-success-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-success-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-bg-page)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>ĐTB Bài tập</span>}
            value={stats.assignmentAvg !== null ? stats.assignmentAvg : "--"}
            suffix={stats.assignmentAvg !== null ? "/ 10" : ""}
            prefix={<FileTextOutlined style={{ color: "var(--color-info-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-info-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-warning-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>ĐTB Bài thi</span>}
            value={stats.examAvg !== null ? stats.examAvg : "--"}
            suffix={stats.examAvg !== null ? "/ 10" : ""}
            prefix={<FormOutlined style={{ color: "var(--color-warning-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-warning-text)" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "var(--color-info-bg)" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "var(--color-text-description)" }}>Chuyên cần</span>}
            value={stats.attendanceRate !== null ? stats.attendanceRate : "--"}
            suffix={stats.attendanceRate !== null ? "%" : ""}
            prefix={<CalendarOutlined style={{ color: "var(--color-info-base)", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "var(--color-info-text)" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

GradeStatistic.displayName = "GradeStatistic";

export default GradeStatistic;
