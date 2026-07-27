import React from "react";
import { Card, Progress, Row, Col, Typography, Space } from "antd";
import {
  RocketOutlined,
  FileTextOutlined,
  FormOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { StudentGradeStats } from "../../../../types/studentGrade";

const { Text, Title } = Typography;

interface GradeOverviewProps {
  stats: StudentGradeStats;
}

export const GradeOverview: React.FC<GradeOverviewProps> = React.memo(({ stats }) => {
  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        border: "1px solid #f0f0f0",
        marginBottom: 24,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Row gutter={[24, 16]} align="middle">
        {/* Left Col: Overall Learning Progress Bar */}
        <Col xs={24} md={8} style={{ borderRight: "1px dashed #f0f0f0", paddingRight: 20 }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text strong style={{ fontSize: 14, color: "#1f2937" }}>
                <RocketOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Tiến độ hoàn thành điểm số
              </Text>
              <Text strong style={{ color: "#1890ff", fontSize: 16 }}>
                {stats.overallProgress}%
              </Text>
            </div>
            <Progress
              percent={stats.overallProgress}
              strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
              status="active"
              showInfo={false}
              strokeWidth={12}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Dựa trên tổng số bài tập, bài thi và lượt điểm danh đã hoàn thành.
            </Text>
          </Space>
        </Col>

        {/* Right Col: Category Breakdown Progress Indicators */}
        <Col xs={24} md={16}>
          <Text strong style={{ fontSize: 13, color: "#8c8c8c", display: "block", marginBottom: 12 }}>
            Phân rã điểm số các danh mục:
          </Text>

          <Row gutter={[16, 12]}>
            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <FileTextOutlined style={{ color: "#13c2c2", marginRight: 4 }} /> Bài tập (30%)
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#08979c" }}>
                  {stats.assignmentAvg !== null ? `${stats.assignmentAvg} / 10` : "--"}
                </div>
                <Progress percent={stats.assignmentAvg ? stats.assignmentAvg * 10 : 0} showInfo={false} size="small" strokeColor="#13c2c2" />
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <FormOutlined style={{ color: "#faad14", marginRight: 4 }} /> Bài thi / Quiz (40%)
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#d48806" }}>
                  {stats.examAvg !== null ? `${stats.examAvg} / 10` : "--"}
                </div>
                <Progress percent={stats.examAvg ? stats.examAvg * 10 : 0} showInfo={false} size="small" strokeColor="#faad14" />
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <CalendarOutlined style={{ color: "#36cfc9", marginRight: 4 }} /> Chuyên cần (10%)
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#006d75" }}>
                  {stats.attendanceRate}%
                </div>
                <Progress percent={stats.attendanceRate} showInfo={false} size="small" strokeColor="#36cfc9" />
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <TrophyOutlined style={{ color: "#722ed1", marginRight: 4 }} /> Tổng kết GPA (20%)
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#531dab" }}>
                  {stats.gpa !== null ? `${stats.gpa} / 10` : "--"}
                </div>
                <Progress percent={stats.gpa ? stats.gpa * 10 : 0} showInfo={false} size="small" strokeColor="#722ed1" />
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  );
});

GradeOverview.displayName = "GradeOverview";

export default GradeOverview;
