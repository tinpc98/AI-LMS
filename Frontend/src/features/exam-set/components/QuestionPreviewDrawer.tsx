import React from "react";
import { Drawer, Descriptions, Tag, Typography, Space, Card } from "antd";
import { DatabaseOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Text, Paragraph } = Typography;

interface QuestionPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  question: any | null;
}

export const QuestionPreviewDrawer: React.FC<QuestionPreviewDrawerProps> = React.memo(
  ({ open, onClose, question }) => {
    if (!question) return null;

    const isMCQ = question.type === "MCQ";

    return (
      <Drawer
        title={
          <Space>
            <DatabaseOutlined style={{ color: "var(--color-action-primary-bg)" }} />
            <span>Chi tiết câu hỏi #{question._id?.slice(-6).toUpperCase()}</span>
          </Space>
        }
        placement="right"
        width={580}
        onClose={onClose}
        open={open}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Tags Header */}
          <Space size={8} wrap>
            <Tag color={isMCQ ? "blue" : "purple"}>
              {isMCQ ? "🔵 Trắc nghiệm (MCQ)" : "🟣 Tự luận (ESSAY)"}
            </Tag>
            <Tag
              color={
                question.difficulty === "EASY"
                  ? "green"
                  : question.difficulty === "HARD"
                    ? "red"
                    : "orange"
              }
            >
              Độ khó:{" "}
              {question.difficulty === "EASY"
                ? "Dễ"
                : question.difficulty === "HARD"
                  ? "Khó"
                  : "Vừa"}
            </Tag>
            {question.topic && <Tag color="cyan">Chủ đề: {question.topic}</Tag>}
          </Space>

          {/* Question Content Box */}
          <Card
            title="📌 Nội dung câu hỏi"
            style={{ borderRadius: 8, backgroundColor: "var(--color-bg-page)" }}
            styles={{ body: { padding: 16 } }}
          >
            <Paragraph
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text-title)",
                whiteSpace: "pre-wrap",
                margin: 0,
              }}
            >
              {question.content}
            </Paragraph>
          </Card>

          {/* MCQ Options List */}
          {isMCQ && question.options && question.options.length > 0 && (
            <Card
              title="🎯 Các phương án lựa chọn"
              style={{ borderRadius: 8 }}
              styles={{ body: { padding: 16 } }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {question.options.map((opt: string, idx: number) => {
                  const label = String.fromCharCode(65 + idx); // A, B, C, D
                  const isCorrect = opt.trim() === (question.correctAnswer || "").trim();

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 6,
                        border: isCorrect ? "2px solid var(--color-success-base)" : "1px solid var(--color-border-default)",
                        backgroundColor: isCorrect ? "var(--color-success-bg)" : "var(--color-surface)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Space size={10}>
                        <Text
                          strong
                          style={{ color: isCorrect ? "var(--color-success-base)" : "var(--color-text-body)", fontSize: 14 }}
                        >
                          {label}. {opt}
                        </Text>
                      </Space>
                      {isCorrect && (
                        <Tag color="success" icon={<CheckCircleOutlined />}>
                          Đáp án đúng
                        </Tag>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Descriptions Meta */}
          <Descriptions bordered size="small" column={1} style={{ marginTop: 8 }}>
            <Descriptions.Item label="Mã câu hỏi (ID)">
              <Text style={{ fontFamily: "monospace" }}>{question._id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Chủ đề / Bài học">
              {question.topic || "Chưa phân loại"}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {question.createdAt ? new Date(question.createdAt).toLocaleString("vi-VN") : "N/A"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Drawer>
    );
  }
);

QuestionPreviewDrawer.displayName = "QuestionPreviewDrawer";
