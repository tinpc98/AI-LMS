import React from "react";
import { Card, Typography, Space, Tag, Progress, Row, Col } from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { IExamAttempt } from "../../../../../api/examApi";

const { Text, Title } = Typography;

interface ExamResultCardProps {
  attempt?: IExamAttempt | null;
  maxScore?: number;
}

export const ExamResultCard: React.FC<ExamResultCardProps> = React.memo(
  ({ attempt, maxScore = 10 }) => {
    if (!attempt || attempt.totalScore === undefined || attempt.totalScore === null) {
      return null;
    }

    const score = attempt.totalScore;
    const isPassed = score >= 5.0;
    const scorePercent = Math.round((score / maxScore) * 100);

    const formattedDate = attempt.createdAt
      ? new Date(attempt.createdAt).toLocaleString("vi-VN")
      : "Đã hoàn thành";

    return (
      <Card
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "#722ed1", fontSize: 18 }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Kết quả kiểm tra</span>
          </Space>
        }
        size="small"
        style={{
          borderRadius: 12,
          backgroundColor: isPassed ? "#f6ffed" : "#fff1f0",
          border: `1px solid ${isPassed ? "#b7eb8f" : "#ffa39e"}`,
          marginBottom: 16,
        }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={scorePercent}
              width={80}
              strokeColor={isPassed ? "#52c41a" : "#ff4d4f"}
              format={() => (
                <span
                  style={{ fontSize: 16, fontWeight: 700, color: isPassed ? "#389e0d" : "#cf1322" }}
                >
                  {score}/{maxScore}
                </span>
              )}
            />
          </Col>

          <Col xs={24} sm={16}>
            <Space direction="vertical" size={4} style={{ width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Text strong style={{ fontSize: 14 }}>
                  Trạng thái kết quả:
                </Text>
                {isPassed ? (
                  <Tag
                    color="success"
                    icon={<CheckCircleOutlined />}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                  >
                    ĐẠT (PASS)
                  </Tag>
                ) : (
                  <Tag
                    color="error"
                    icon={<CloseCircleOutlined />}
                    style={{ borderRadius: 6, fontWeight: 600 }}
                  >
                    KHÔNG ĐẠT (FAIL)
                  </Tag>
                )}
              </div>

              <Text type="secondary" style={{ fontSize: 12 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} /> Ngày nộp bài: {formattedDate}
              </Text>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  }
);

ExamResultCard.displayName = "ExamResultCard";

export default ExamResultCard;
