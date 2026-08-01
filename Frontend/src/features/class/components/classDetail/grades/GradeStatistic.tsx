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
          style={{ borderRadius: 12, backgroundColor: "#f9f0ff" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>GPA tích lũy</span>}
            value={stats.gpa !== null ? stats.gpa : "--"}
            suffix={stats.gpa !== null ? "/ 10" : ""}
            prefix={<TrophyOutlined style={{ color: "#722ed1", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#531dab" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#e6f7ff" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>ĐTB lớp học</span>}
            value={stats.classAvgGpa !== null ? stats.classAvgGpa : "--"}
            suffix={stats.classAvgGpa !== null ? "/ 10" : ""}
            prefix={<TeamOutlined style={{ color: "#1890ff", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#096dd9" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#f6ffed" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Số bài đã chấm</span>}
            value={stats.gradedCount}
            prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#389e0d" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#fafafa" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>ĐTB Bài tập</span>}
            value={stats.assignmentAvg !== null ? stats.assignmentAvg : "--"}
            suffix={stats.assignmentAvg !== null ? "/ 10" : ""}
            prefix={<FileTextOutlined style={{ color: "#13c2c2", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#08979c" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#fffbe6" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>ĐTB Bài thi</span>}
            value={stats.examAvg !== null ? stats.examAvg : "--"}
            suffix={stats.examAvg !== null ? "/ 10" : ""}
            prefix={<FormOutlined style={{ color: "#faad14", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#d48806" }}
          />
        </Card>
      </Col>

      <Col xs={12} sm={8} md={8} lg={8}>
        <Card
          bordered={false}
          styles={{ body: { padding: "12px 16px" } }}
          style={{ borderRadius: 12, backgroundColor: "#e6fffb" }}
        >
          <Statistic
            title={<span style={{ fontSize: 11, color: "#8c8c8c" }}>Chuyên cần</span>}
            value={stats.attendanceRate !== null ? stats.attendanceRate : "--"}
            suffix={stats.attendanceRate !== null ? "%" : ""}
            prefix={<CalendarOutlined style={{ color: "#36cfc9", marginRight: 4 }} />}
            valueStyle={{ fontSize: 20, fontWeight: 700, color: "#006d75" }}
          />
        </Card>
      </Col>
    </Row>
  );
});

GradeStatistic.displayName = "GradeStatistic";

export default GradeStatistic;
