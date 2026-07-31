import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import {
  FormOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { StudentExamStats } from "../../../../types/studentExam";

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
          style={{ borderRadius: 12, backgroundColor: "#fafafa" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Tổng bài thi</span>}
            value={stats.total}
            prefix={<FormOutlined style={{ color: "#1890ff", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#1f2937" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={4.8} lg={4.8} style={{ flex: 1 }}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#e6f7ff" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đang mở thi</span>}
            value={stats.available}
            prefix={<PlayCircleOutlined style={{ color: "#1890ff", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#096dd9" }}
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
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đang làm dở dang</span>}
            value={stats.inProgress}
            prefix={<SyncOutlined style={{ color: "#faad14", marginRight: 6 }} />}
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
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Đã hoàn thành</span>}
            value={stats.completed}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#389e0d" }}
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
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Điểm thi trung bình</span>}
            value={stats.averageScore !== null ? stats.averageScore : "--"}
            suffix={stats.averageScore !== null ? "/ 10" : ""}
            prefix={<TrophyOutlined style={{ color: "#722ed1", marginRight: 6 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#531dab" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

ExamStatistic.displayName = "ExamStatistic";

export default ExamStatistic;
