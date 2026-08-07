import React from "react";
import { Card, Typography, Space, Tag, Progress, Row, Col } from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { IExamAttempt } from "../../../../../api/examApi";

const { Text } = Typography;

interface ExamResultCardProps {
  attempt?: IExamAttempt | null;
  maxScore?: number;
  isSuspended?: boolean;
}

export const ExamResultCard: React.FC<ExamResultCardProps> = React.memo(
  ({ attempt, maxScore = 10, isSuspended = false }) => {
    if (!attempt || attempt.totalScore === undefined || attempt.totalScore === null) {
      return null;
    }

    const score = attempt.totalScore;
    const isPassed = score >= 5.0 && !isSuspended;
    const scorePercent = Math.round((score / maxScore) * 100);

    const formattedDate = attempt.createdAt
      ? new Date(attempt.createdAt).toLocaleString("vi-VN")
      : "Đã hoàn thành";

    return (
      <Card
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 18 }} />
            <span style={{ fontSize: 15, fontWeight: 700 }}>Kết quả kiểm tra</span>
          </Space>
        }
        size="small"
        style={{
          borderRadius: 12,
          backgroundColor: isPassed ? "var(--color-success-bg)" : "var(--color-error-bg)",
          border: `1px solid ${isPassed ? "var(--color-border-default)" : "var(--color-border-default)"}`,
          marginBottom: 16,
        }}
      >
        <Row gutter={[16, 12]} align="middle">
          <Col xs={24} sm={8} style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={scorePercent}
              width={80}
              strokeColor={isPassed ? "var(--color-success-base)" : "var(--color-error-base)"}
              format={() => (
                <span
                  style={{ fontSize: 16, fontWeight: 700, color: isPassed ? "var(--color-success-text)" : "var(--color-error-text)" }}
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

              {isSuspended && (
                <div style={{ marginTop: 4, padding: "8px 12px", backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error-base)", borderRadius: 6 }}>
                  <Text strong style={{ color: "var(--color-error-text)", fontSize: 13, display: "block" }}>
                    ⚠ Bài thi bị chốt do vi phạm quy chế 5 lần.
                  </Text>
                  <Text style={{ color: "var(--color-error-text)", fontSize: 12 }}>
                    Kết quả được ghi nhận 0 điểm theo quy định.
                  </Text>
                </div>
              )}

              <Text type="secondary" style={{ fontSize: 12, marginTop: isSuspended ? 4 : 0 }}>
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
