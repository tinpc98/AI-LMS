import React from "react";
import { Card, Progress, Row, Col, Typography, Space, Tag } from "antd";
import { TrophyOutlined, CheckCircleOutlined, FormOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface LearningProgressCardProps {
  progressPercent?: number;
  completedAssignments?: number;
  totalAssignments?: number;
  completedExams?: number;
  totalExams?: number;
  averageScore?: number;
}

export const LearningProgressCard: React.FC<LearningProgressCardProps> = React.memo(
  ({
    progressPercent = 0,
    completedAssignments = 0,
    totalAssignments = 0,
    completedExams = 0,
    totalExams = 0,
    averageScore = 0,
  }) => {
    return (
      <Card
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Báo cáo tiến độ cá nhân</span>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Row gutter={[24, 20]} align="middle">
          {/* Circular Progress */}
          <Col xs={24} sm={8} style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={progressPercent}
              width={110}
              strokeColor={{ "0%": "var(--color-action-primary-bg)", "100%": "var(--color-success-base)" }}
              format={(percent) => (
                <div>
                  <Title level={3} style={{ margin: 0, fontWeight: 700, color: "var(--color-text-title)" }}>
                    {percent}%
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Tiến độ
                  </Text>
                </div>
              )}
            />
          </Col>

          {/* Metrics breakdown */}
          <Col xs={24} sm={16}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>
              {/* Average Score */}
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, color: "var(--color-text-body)" }}>
                  <TrophyOutlined style={{ color: "var(--color-warning-base)", marginRight: 6 }} /> Điểm trung bình
                  tích lũy:
                </Text>
                <Tag
                  color="gold"
                  style={{ fontSize: 13, fontWeight: 700, borderRadius: 8, padding: "2px 10px" }}
                >
                  {averageScore} / 10.0
                </Tag>
              </div>

              {/* Assignments Progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontSize: 12, color: "var(--color-text-body)" }}>
                    <CheckCircleOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} /> Bài tập:{" "}
                    {completedAssignments}/{totalAssignments} bài
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>
                    {totalAssignments > 0
                      ? Math.round((completedAssignments / totalAssignments) * 100)
                      : 0}
                    %
                  </Text>
                </div>
                <Progress
                  percent={
                    totalAssignments > 0
                      ? Math.round((completedAssignments / totalAssignments) * 100)
                      : 0
                  }
                  showInfo={false}
                  size="small"
                  strokeColor="var(--color-action-primary-bg)"
                />
              </div>

              {/* Exams Progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <Text style={{ fontSize: 12, color: "var(--color-text-body)" }}>
                    <FormOutlined style={{ color: "var(--color-warning-base)", marginRight: 6 }} /> Bài kiểm tra:{" "}
                    {completedExams}/{totalExams} bài
                  </Text>
                  <Text style={{ fontSize: 12, fontWeight: 600 }}>
                    {totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0}%
                  </Text>
                </div>
                <Progress
                  percent={totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0}
                  showInfo={false}
                  size="small"
                  strokeColor="var(--color-warning-base)"
                />
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  }
);

LearningProgressCard.displayName = "LearningProgressCard";

export default LearningProgressCard;
