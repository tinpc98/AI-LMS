import React from "react";
import { Alert, Card, Tag, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ExamQuestionReviewListProps {
  questionsList: any[];
  studentAnswerLabel?: string;
}

export const ExamQuestionReviewList: React.FC<ExamQuestionReviewListProps> = React.memo(
  ({ questionsList, studentAnswerLabel = "Đáp án bạn chọn" }) => {
    if (!questionsList || questionsList.length === 0) {
      return (
        <Alert
          message="Chưa có dữ liệu bài làm"
          description="Không tìm thấy chi tiết các câu trả lời."
          type="info"
          showIcon
          style={{ borderRadius: 10 }}
        />
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {questionsList.map((q: any, idx: number) => {
          const questionText = q.questionContent;
          if (!questionText) {
            return (
              <Alert
                key={idx}
                message={`Lỗi hiển thị câu hỏi ${idx + 1}`}
                description="Không thể tải nội dung câu hỏi."
                type="warning"
                showIcon
              />
            );
          }

          const isCorrect = (q.pointsEarned ?? 0) > 0;
          const studentAnswer = q.studentAnswer || "Chưa chọn đáp án";
          const isUnanswered = !q.studentAnswer;
          const correctAnswer = q.correctAnswer;

          return (
            <Card
              key={idx}
              size="small"
              style={{
                borderRadius: 12,
                border: `1px solid ${
                  isCorrect ? "var(--color-border-default)" : "var(--color-border-default)"
                }`,
                backgroundColor: isCorrect ? "var(--color-success-bg)" : "var(--color-error-bg)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <Text strong style={{ fontSize: 13, color: "var(--color-text-title)" }}>
                  Câu {idx + 1}: {questionText}
                </Text>
                {isCorrect ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    Đúng (+{q.pointsEarned} đ)
                  </Tag>
                ) : (
                  <Tag color="error" icon={<CloseCircleOutlined />}>
                    Sai (0 đ)
                  </Tag>
                )}
              </div>

              <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                <div>
                  <Text type="secondary">{studentAnswerLabel}: </Text>
                  <Text
                    strong
                    style={{
                      color: isCorrect
                        ? "var(--color-success-text)"
                        : isUnanswered
                        ? "var(--color-warning-text)"
                        : "var(--color-error-text)",
                    }}
                  >
                    {studentAnswer}
                  </Text>
                </div>

                {!isCorrect && correctAnswer && (
                  <div>
                    <Text type="secondary">Đáp án chính xác: </Text>
                    <Text strong style={{ color: "var(--color-success-text)" }}>
                      {correctAnswer}
                    </Text>
                  </div>
                )}

                {q.explanation && (
                  <div
                    style={{
                      marginTop: 6,
                      backgroundColor: "var(--color-surface)",
                      padding: 8,
                      borderRadius: 6,
                      border: "1px dashed var(--color-border-default)",
                    }}
                  >
                    <Text type="secondary" style={{ fontStyle: "italic" }}>
                      Lời giải: {q.explanation}
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }
);

ExamQuestionReviewList.displayName = "ExamQuestionReviewList";

export default ExamQuestionReviewList;
