import React, { useMemo } from "react";
import { Card, Row, Col, Statistic, Typography, Progress } from "antd";
import { DatabaseOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface QuestionStatisticProps {
  questions: any[];
}

export const QuestionStatistic: React.FC<QuestionStatisticProps> = React.memo(({ questions }) => {
  const stats = useMemo(() => {
    const total = questions.length;
    const mcqCount = questions.filter((q) => q.type === "MCQ").length;
    const essayCount = questions.filter((q) => q.type === "ESSAY").length;
    const easyCount = questions.filter((q) => q.difficulty === "EASY").length;
    const mediumCount = questions.filter((q) => q.difficulty === "MEDIUM").length;
    const hardCount = questions.filter((q) => q.difficulty === "HARD").length;

    const mcqPercent = total > 0 ? Math.round((mcqCount / total) * 100) : 0;

    return { total, mcqCount, essayCount, easyCount, mediumCount, hardCount, mcqPercent };
  }, [questions]);

  return (
    <Card
      style={{
        borderRadius: 16,
        background: "linear-gradient(135deg, #002140 0%, #003a70 100%)",
        color: "#fff",
        boxShadow: "0 8px 24px rgba(0, 33, 64, 0.25)",
        marginBottom: 24,
      }}
      styles={{ body: { padding: "24px 32px" } }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={5}>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <Statistic
              title={
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                  Tổng số câu hỏi
                </Text>
              }
              value={stats.total}
              prefix={<DatabaseOutlined style={{ color: "#fff", marginRight: 6 }} />}
              styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 22 } }}
            />
          </div>
        </Col>

        <Col xs={12} sm={8} md={5}>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <Statistic
              title={
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                  🔵 Trắc nghiệm (MCQ)
                </Text>
              }
              value={stats.mcqCount}
              styles={{ content: { color: "#91caff", fontWeight: 700, fontSize: 20 } }}
            />
          </div>
        </Col>

        <Col xs={12} sm={8} md={5}>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <Statistic
              title={
                <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                  🟣 Tự luận (ESSAY)
                </Text>
              }
              value={stats.essayCount}
              styles={{ content: { color: "#d3ade6", fontWeight: 700, fontSize: 20 } }}
            />
          </div>
        </Col>

        <Col xs={12} sm={8} md={9}>
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              padding: "12px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 12,
                display: "block",
                marginBottom: 4,
              }}
            >
              Cơ cấu độ khó: Dễ ({stats.easyCount}) | Vừa ({stats.mediumCount}) | Khó (
              {stats.hardCount})
            </Text>
            <Progress
              percent={stats.total > 0 ? Math.round((stats.easyCount / stats.total) * 100) : 0}
              success={{
                percent: stats.total > 0 ? Math.round((stats.mediumCount / stats.total) * 100) : 0,
              }}
              strokeColor="#b7eb8f"
              trailColor="rgba(255,255,255,0.2)"
              showInfo={false}
              size="small"
            />
          </div>
        </Col>
      </Row>
    </Card>
  );
});

QuestionStatistic.displayName = "QuestionStatistic";
