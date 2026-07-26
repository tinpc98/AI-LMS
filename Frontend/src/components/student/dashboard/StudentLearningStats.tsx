import React from "react";
import { Row, Col, Card, Statistic, Progress, Tag } from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  BookOutlined,
} from "@ant-design/icons";

interface StudentLearningStatsProps {
  gpa: number;
  attendanceRate: number; // e.g. 95 (percentage)
  overallProgress: number; // e.g. 78 (percentage)
  totalClasses: number;
}

export const StudentLearningStats: React.FC<StudentLearningStatsProps> = React.memo(
  ({ gpa, attendanceRate, overallProgress, totalClasses }) => {
    // GPA rating badge tag
    const getGpaTag = (score: number) => {
      if (score >= 9.0) return <Tag color="gold">Xuất sắc</Tag>;
      if (score >= 8.0) return <Tag color="green">Giỏi</Tag>;
      if (score >= 6.5) return <Tag color="blue">Khá</Tag>;
      if (score >= 5.0) return <Tag color="orange">Trung bình</Tag>;
      return <Tag color="red">Cần cố gắng</Tag>;
    };

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 1. GPA Trung Bình */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              height: "100%",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13 }}>GPA Trung bình</span>}
              value={gpa}
              precision={2}
              suffix={<span style={{ fontSize: 13, color: "#bfbfbf" }}>/ 10.0</span>}
              prefix={<TrophyOutlined style={{ color: "#faad14", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#1f2937" }}
            />
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {getGpaTag(gpa)}
              <span style={{ fontSize: 12, color: "#8c8c8c" }}>Xếp loại tích lũy</span>
            </div>
          </Card>
        </Col>

        {/* 2. Tỷ lệ điểm danh */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              height: "100%",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13 }}>Tỷ lệ điểm danh</span>}
              value={attendanceRate}
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#1f2937" }}
            />
            <div style={{ marginTop: 10 }}>
              <Progress percent={attendanceRate} size="small" status={attendanceRate >= 80 ? "active" : "exception"} />
            </div>
          </Card>
        </Col>

        {/* 3. Tiến độ học tập */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              height: "100%",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13 }}>Tiến độ học tập</span>}
              value={overallProgress}
              suffix="%"
              prefix={<RiseOutlined style={{ color: "#1890ff", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#1f2937" }}
            />
            <div style={{ marginTop: 10 }}>
              <Progress percent={overallProgress} size="small" strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }} />
            </div>
          </Card>
        </Col>

        {/* 4. Số lớp đang tham gia */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 14,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              height: "100%",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13 }}>Số lớp đang học</span>}
              value={totalClasses}
              suffix="Lớp"
              prefix={<BookOutlined style={{ color: "#722ed1", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#1f2937" }}
            />
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <Tag color="purple">Đang hoạt động</Tag>
              <span style={{ fontSize: 12, color: "#8c8c8c" }}>Học kỳ này</span>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }
);

StudentLearningStats.displayName = "StudentLearningStats";

export default StudentLearningStats;
