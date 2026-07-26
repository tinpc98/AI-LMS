import React from "react";
import { Row, Col, Card, Statistic, Progress } from "antd";
import {
  TrophyOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FormOutlined,
} from "@ant-design/icons";
import type { LearningStatistics } from "../types/learningDashboard.types";

interface LearningStatsWidgetProps {
  statistics: LearningStatistics;
}

export const LearningStatsWidget: React.FC<LearningStatsWidgetProps> = React.memo(({ statistics }) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
      <Col xs={12} sm={6}>
        <Card bordered={false} styles={{ body: { padding: 16 } }} style={{ borderRadius: 16, backgroundColor: "#fff7e6" }}>
          <Statistic
            title={<span style={{ fontSize: 12, color: "#8c8c8c" }}>Điểm trung bình (GPA)</span>}
            value={statistics.gpa}
            precision={2}
            suffix="/ 10"
            prefix={<TrophyOutlined style={{ color: "#fa8c16", marginRight: 4 }} />}
            valueStyle={{ fontSize: 22, fontWeight: 700, color: "#d46b08" }}
          />
          <Progress percent={Math.round((statistics.gpa / 10) * 100)} showInfo={false} strokeColor="#fa8c16" size="small" style={{ marginTop: 8 }} />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card bordered={false} styles={{ body: { padding: 16 } }} style={{ borderRadius: 16, backgroundColor: "#f6ffed" }}>
          <Statistic
            title={<span style={{ fontSize: 12, color: "#8c8c8c" }}>Tỷ lệ chuyên cần</span>}
            value={statistics.attendanceRate}
            suffix="%"
            prefix={<CalendarOutlined style={{ color: "#52c41a", marginRight: 4 }} />}
            valueStyle={{ fontSize: 22, fontWeight: 700, color: "#389e0d" }}
          />
          <Progress percent={statistics.attendanceRate} showInfo={false} strokeColor="#52c41a" size="small" style={{ marginTop: 8 }} />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card bordered={false} styles={{ body: { padding: 16 } }} style={{ borderRadius: 16, backgroundColor: "#e6f7ff" }}>
          <Statistic
            title={<span style={{ fontSize: 12, color: "#8c8c8c" }}>Hoàn thành bài tập</span>}
            value={statistics.assignmentCompletionRate}
            suffix="%"
            prefix={<FileTextOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
            valueStyle={{ fontSize: 22, fontWeight: 700, color: "#096dd9" }}
          />
          <Progress percent={statistics.assignmentCompletionRate} showInfo={false} strokeColor="#1890ff" size="small" style={{ marginTop: 8 }} />
        </Card>
      </Col>

      <Col xs={12} sm={6}>
        <Card bordered={false} styles={{ body: { padding: 16 } }} style={{ borderRadius: 16, backgroundColor: "#f9f0ff" }}>
          <Statistic
            title={<span style={{ fontSize: 12, color: "#8c8c8c" }}>Kết quả bài thi</span>}
            value={statistics.examPerformanceRate}
            suffix="%"
            prefix={<FormOutlined style={{ color: "#722ed1", marginRight: 4 }} />}
            valueStyle={{ fontSize: 22, fontWeight: 700, color: "#531dab" }}
          />
          <Progress percent={statistics.examPerformanceRate} showInfo={false} strokeColor="#722ed1" size="small" style={{ marginTop: 8 }} />
        </Card>
      </Col>
    </Row>
  );
});

LearningStatsWidget.displayName = "LearningStatsWidget";

export default LearningStatsWidget;
