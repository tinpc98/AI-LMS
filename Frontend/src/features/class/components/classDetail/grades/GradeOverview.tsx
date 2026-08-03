import React from "react";
import { Card, Progress, Row, Col, Typography, Space } from "antd";
import {
  RocketOutlined,
  FileTextOutlined,
  FormOutlined,
  CalendarOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { StudentGradeStats } from "../../../../../types/studentGrade";

const { Text } = Typography;

interface GradeOverviewProps {
  stats: StudentGradeStats;
}

export const GradeOverview: React.FC<GradeOverviewProps> = React.memo(({ stats }) => {
  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        border: "1px solid var(--color-border-default)",
        marginBottom: 24,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Row gutter={[24, 16]} align="middle">
        {/* Left Col: Overall Learning Progress Bar */}
        <Col xs={24} md={8} style={{ borderRight: "1px dashed var(--color-border-default)", paddingRight: 20 }}>
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text strong style={{ fontSize: 14, color: "var(--color-text-title)" }}>
                <RocketOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} /> Tiến độ hoàn thành
                điểm số
              </Text>
              <Text strong style={{ color: "var(--color-action-primary-bg)", fontSize: 16 }}>
                {stats.overallProgress}%
              </Text>
            </div>
            <Progress
              percent={stats.overallProgress}
              strokeColor={{ "0%": "var(--color-action-primary-bg)", "100%": "var(--color-success-base)" }}
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
          <Text
            strong
            style={{ fontSize: 13, color: "var(--color-text-description)", display: "block", marginBottom: 12 }}
          >
            Phân rã điểm số các danh mục:
          </Text>

          <Row gutter={[16, 12]}>
            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <FileTextOutlined style={{ color: "var(--color-info-base)", marginRight: 4 }} /> Bài tập (30%)
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-info-text)" }}>
                  {stats.assignmentAvg !== null ? `${stats.assignmentAvg} / 10` : "--"}
                </div>
                <Progress
                  percent={stats.assignmentAvg ? Math.min(100, stats.assignmentAvg * 10) : 0}
                  showInfo={false}
                  size="small"
                  strokeColor="var(--color-info-base)"
                />
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <FormOutlined style={{ color: "var(--color-warning-base)", marginRight: 4 }} /> Bài thi / Quiz (40%)
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-warning-text)" }}>
                  {stats.examAvg !== null ? `${stats.examAvg} / 10` : "--"}
                </div>
                <Progress
                  percent={stats.examAvg ? Math.min(100, stats.examAvg * 10) : 0}
                  showInfo={false}
                  size="small"
                  strokeColor="var(--color-warning-base)"
                />
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <CalendarOutlined style={{ color: "var(--color-info-base)", marginRight: 4 }} /> Chuyên cần (10%)
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-info-text)" }}>
                  {stats.attendanceRate !== null ? `${stats.attendanceRate}%` : "--"}
                </div>
                <Progress
                  percent={stats.attendanceRate !== null ? Math.min(100, stats.attendanceRate) : 0}
                  showInfo={false}
                  size="small"
                  strokeColor="var(--color-info-base)"
                />
              </div>
            </Col>

            <Col xs={12} sm={6}>
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  <TrophyOutlined style={{ color: "var(--color-secondary-icon)", marginRight: 4 }} /> Tổng kết GPA (20%)
                </Text>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-secondary-active)" }}>
                  {stats.gpa !== null ? `${stats.gpa} / 10` : "--"}
                </div>
                <Progress
                  percent={stats.gpa ? Math.min(100, stats.gpa * 10) : 0}
                  showInfo={false}
                  size="small"
                  strokeColor="var(--color-secondary-icon)"
                />
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
