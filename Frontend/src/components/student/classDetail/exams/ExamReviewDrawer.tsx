import React from "react";
import { Drawer, Button, Typography, Space, Tag, Card, Divider, Alert, Spin } from "antd";
import {
  TrophyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import ExamResultCard from "./ExamResultCard";
import type { IExtendedExam } from "../../../../types/studentExam";

const { Text, Paragraph, Title } = Typography;

interface ExamReviewDrawerProps {
  open: boolean;
  item: IExtendedExam | null;
  reviewData: any | null;
  loading: boolean;
  onClose: () => void;
}

export const ExamReviewDrawer: React.FC<ExamReviewDrawerProps> = React.memo(
  ({ open, item, reviewData, loading, onClose }) => {
    if (!item) return null;

    const questionsList = reviewData?.questions || reviewData?.answers || item.questions || [];

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "#722ed1", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                Xem lại bài làm & Đáp án
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.title}
              </Text>
            </div>
          </Space>
        }
        extra={
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Đóng
          </Button>
        }
        width={720}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          {/* Result Card Summary */}
          <ExamResultCard attempt={item.attempt} maxScore={item.maxScore || 10} />

          <Divider style={{ margin: "20px 0" }} />

          <Text
            strong
            style={{ fontSize: 14, color: "#262626", display: "block", marginBottom: 12 }}
          >
            <BookOutlined style={{ marginRight: 6 }} /> Danh sách câu hỏi & Đáp án chi tiết:
          </Text>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <Spin tip="Đang tải chi tiết đáp án bài thi..." />
            </div>
          ) : questionsList.length === 0 ? (
            <Alert
              message="Giảng viên chưa mở tính năng xem lại đáp án chi tiết"
              description="Bạn chỉ có thể xem điểm số tổng quan của bài thi."
              type="info"
              showIcon
              style={{ borderRadius: 10 }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {questionsList.map((q: any, idx: number) => {
                const questionText = q.questionText || q.title || `Câu hỏi ${idx + 1}`;
                const isCorrect = q.isCorrect || q.score > 0;
                const studentAnswer = q.studentAnswer || q.userAnswer || "Chưa chọn đáp án";
                const correctAnswer = q.correctAnswer || "Đáp án chuẩn";

                return (
                  <Card
                    key={idx}
                    size="small"
                    style={{
                      borderRadius: 12,
                      border: `1px solid ${isCorrect ? "#d9f7be" : "#ffccc7"}`,
                      backgroundColor: isCorrect ? "#fcffe6" : "#fff2f0",
                    }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}
                    >
                      <Text strong style={{ fontSize: 13, color: "#1f2937" }}>
                        Câu {idx + 1}: {questionText}
                      </Text>
                      {isCorrect ? (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Đúng (+{q.points || 1} đ)
                        </Tag>
                      ) : (
                        <Tag color="error" icon={<CloseCircleOutlined />}>
                          Sai (0 đ)
                        </Tag>
                      )}
                    </div>

                    <div style={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div>
                        <Text type="secondary">Đáp án bạn chọn: </Text>
                        <Text strong style={{ color: isCorrect ? "#389e0d" : "#cf1322" }}>
                          {studentAnswer}
                        </Text>
                      </div>

                      {!isCorrect && (
                        <div>
                          <Text type="secondary">Đáp án chính xác: </Text>
                          <Text strong style={{ color: "#389e0d" }}>
                            {correctAnswer}
                          </Text>
                        </div>
                      )}

                      {q.explanation && (
                        <div
                          style={{
                            marginTop: 6,
                            backgroundColor: "#fff",
                            padding: 8,
                            borderRadius: 6,
                            border: "1px dashed #d9d9d9",
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
          )}
        </div>
      </Drawer>
    );
  }
);

ExamReviewDrawer.displayName = "ExamReviewDrawer";

export default ExamReviewDrawer;
