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
  averageScore?: number; // GPA scale e.g. 8.5
}

export const StatisticSection: React.FC<StatisticSectionProps> = React.memo(
  ({
    attendanceRate = 0,
    completedAssignments = 0,
    totalAssignments = 0,
    completedExams = 0,
    totalExams = 0,
    overallProgress = 0,
    averageScore = 0,
  }) => {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* 1. Điểm danh */}
        <Col xs={12} sm={12} md={8} lg={4.8} style={{ flex: 1, minWidth: 160 }}>
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
              title={<span style={{ color: "var(--color-text-description)", fontSize: 13 }}>Tỷ lệ điểm danh</span>}
              value={attendanceRate}
              suffix="%"
              prefix={<FieldTimeOutlined style={{ color: "var(--color-success-base)", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "var(--color-text-title)" }}
            />
            <div style={{ marginTop: 6 }}>
              <Progress
                percent={attendanceRate}
                size="small"
                showInfo={false}
                strokeColor="var(--color-success-base)"
                trailColor="rgba(0, 0, 0, 0.08)"
              />
            </div>
          </Card>
        </Col>

        {/* 2. Bài tập hoàn thành */}
        <Col xs={12} sm={12} md={8} lg={4.8} style={{ flex: 1, minWidth: 160 }}>
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
              title={<span style={{ color: "var(--color-text-description)", fontSize: 13 }}>Bài tập hoàn thành</span>}
              value={completedAssignments}
              suffix={`/ ${totalAssignments}`}
              prefix={<FileTextOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "var(--color-text-title)" }}
            />
            <div style={{ marginTop: 6 }}>
              <Progress
                percent={
                  totalAssignments > 0
                    ? Math.round((completedAssignments / totalAssignments) * 100)
                    : 0
                }
                size="small"
                showInfo={false}
                strokeColor="var(--color-action-primary-bg)"
                trailColor="rgba(0, 0, 0, 0.08)"
              />
            </div>
          </Card>
        </Col>

        {/* 3. Bài thi hoàn thành */}
        <Col xs={12} sm={12} md={8} lg={4.8} style={{ flex: 1, minWidth: 160 }}>
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
              title={
                <span style={{ color: "var(--color-text-description)", fontSize: 13 }}>Bài kiểm tra hoàn thành</span>
              }
              value={completedExams}
              suffix={`/ ${totalExams}`}
              prefix={<FormOutlined style={{ color: "var(--color-warning-base)", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "var(--color-text-title)" }}
            />
            <div style={{ marginTop: 6 }}>
              <Progress
                percent={totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0}
                size="small"
                showInfo={false}
                strokeColor="var(--color-warning-base)"
                trailColor="rgba(0, 0, 0, 0.08)"
              />
            </div>
          </Card>
        </Col>

        {/* 4. Điểm trung bình tích lũy */}
        <Col xs={12} sm={12} md={8} lg={4.8} style={{ flex: 1, minWidth: 160 }}>
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
              title={<span style={{ color: "var(--color-text-description)", fontSize: 13 }}>Điểm TB tích lũy</span>}
              value={averageScore}
              suffix="/ 10.0"
              prefix={<TrophyOutlined style={{ color: "var(--color-warning-text)", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "var(--color-warning-text)" }}
            />
            <div style={{ marginTop: 6 }}>
              <Progress
                percent={Math.min(100, Math.round((averageScore / 10) * 100))}
                size="small"
                showInfo={false}
                strokeColor="var(--color-warning-text)"
                trailColor="rgba(0, 0, 0, 0.08)"
              />
            </div>
          </Card>
        </Col>

        {/* 5. Tiến độ tổng thể */}
        <Col xs={12} sm={12} md={8} lg={4.8} style={{ flex: 1, minWidth: 160 }}>
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
              title={<span style={{ color: "var(--color-text-description)", fontSize: 13 }}>Tiến độ môn học</span>}
              value={overallProgress}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: "var(--color-secondary-icon)", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24, color: "var(--color-text-title)" }}
            />
            <div style={{ marginTop: 6 }}>
              <Progress
                percent={overallProgress}
                size="small"
                showInfo={false}
                strokeColor="var(--color-secondary-icon)"
                trailColor="rgba(0, 0, 0, 0.08)"
              />
            </div>
          </Card>
        </Col>
      </Row>
    );
  }
);

StatisticSection.displayName = "StatisticSection";

export default StatisticSection;
