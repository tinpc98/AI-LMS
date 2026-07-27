import React from "react";
import { Row, Col, Card, Statistic, Progress } from "antd";
import {
  FieldTimeOutlined,
  FileTextOutlined,
  FormOutlined,
  TrophyOutlined,
} from "@ant-design/icons";

interface StatisticSectionProps {
  attendanceRate: number; // percentage e.g. 95
  completedAssignments: number;
  totalAssignments: number;
  completedExams: number;
  totalExams: number;
  overallProgress: number; // percentage e.g. 85
}

export const StatisticSection: React.FC<StatisticSectionProps> = React.memo(
  ({
    attendanceRate = 0,
    completedAssignments = 0,
    totalAssignments = 0,
    completedExams = 0,
    totalExams = 0,
    overallProgress = 0,
  }) => {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 1. Điểm danh */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              height: "100%",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13 }}>Tỷ lệ điểm danh</span>}
              value={attendanceRate}
              suffix="%"
              prefix={<FieldTimeOutlined style={{ color: "#52c41a", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#1f2937" }}
            />
            <div style={{ marginTop: 10 }}>
              <Progress percent={attendanceRate} size="small" strokeColor="#52c41a" />
            </div>
          </Card>
        </Col>

        {/* 2. Bài tập hoàn thành */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              height: "100%",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13 }}>Bài tập hoàn thành</span>}
              value={completedAssignments}
              suffix={`/ ${totalAssignments}`}
              prefix={<FileTextOutlined style={{ color: "#1890ff", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#1f2937" }}
            />
            <div style={{ marginTop: 10 }}>
              <Progress
                percent={totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0}
                size="small"
                strokeColor="#1890ff"
              />
            </div>
          </Card>
        </Col>

        {/* 3. Bài thi hoàn thành */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              height: "100%",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13 }}>Bài kiểm tra hoàn thành</span>}
              value={completedExams}
              suffix={`/ ${totalExams}`}
              prefix={<FormOutlined style={{ color: "#fa8c16", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#1f2937" }}
            />
            <div style={{ marginTop: 10 }}>
              <Progress
                percent={totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0}
                size="small"
                strokeColor="#fa8c16"
              />
            </div>
          </Card>
        </Col>

        {/* 4. Tiến độ tổng thể */}
        <Col xs={12} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              height: "100%",
            }}
            styles={{ body: { padding: 20 } }}
          >
            <Statistic
              title={<span style={{ color: "#8c8c8c", fontSize: 13 }}>Tiến độ môn học</span>}
              value={overallProgress}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: "#722ed1", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "#1f2937" }}
            />
            <div style={{ marginTop: 10 }}>
              <Progress percent={overallProgress} size="small" strokeColor="#722ed1" />
            </div>
          </Card>
        </Col>
      </Row>
    );
  }
);

StatisticSection.displayName = "StatisticSection";

export default StatisticSection;
