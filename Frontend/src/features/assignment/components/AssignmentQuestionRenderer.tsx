import React from "react";
import { Radio, Space, Typography, Input } from "antd";
import type { IAttemptQuestion } from "../../../interface/assignmentInterface";

const { Text, Paragraph } = Typography;

interface AssignmentQuestionRendererProps {
  question: IAttemptQuestion;
  index: number;
  readOnly?: boolean;
  onAnswerChange?: (questionId: string, answer: { selectedOptionIds?: string[]; content?: string }) => void;
}

export const AssignmentQuestionRenderer: React.FC<AssignmentQuestionRendererProps> = ({
  question,
  index,
  readOnly = false,
  onAnswerChange,
}) => {
  const qs = question.questionSnapshot;
  if (!qs) return null;

  const contentStr = typeof qs.content === "string" 
    ? qs.content 
    : (qs.content?.[0] as any)?.text || "No content";

  const isMCQ = qs.type === "MCQ";
  const isEssay = qs.type === "ESSAY" || qs.type === "SHORT_ANSWER";

  return (
    <div style={{ marginBottom: 24, padding: 16, border: "1px solid #f0f0f0", borderRadius: 8, backgroundColor: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <Text strong>Câu {index + 1} ({question.points} điểm)</Text>
      </div>
      
      <Paragraph style={{ fontSize: 16 }}>{contentStr}</Paragraph>

      {isMCQ && qs.options && (
        <Radio.Group
          disabled={readOnly}
          value={question.answer?.selectedOptionIds?.[0]}
          onChange={(e) => {
            if (onAnswerChange) {
              onAnswerChange(question.questionId, { selectedOptionIds: [e.target.value] });
            }
          }}
        >
          <Space direction="vertical">
            {qs.options.map((opt) => (
              <Radio key={opt.id} value={opt.id}>
                {typeof opt.content === "string" ? opt.content : (opt.content?.[0] as any)?.text}
              </Radio>
            ))}
          </Space>
        </Radio.Group>
      )}

      {isEssay && (
        <Input.TextArea
          disabled={readOnly}
          rows={4}
          placeholder="Nhập câu trả lời của bạn..."
          value={typeof question.answer?.content === "string" ? question.answer?.content : (question.answer?.content?.[0] as any)?.text || ""}
          onChange={(e) => {
            if (onAnswerChange) {
              onAnswerChange(question.questionId, { content: e.target.value });
            }
          }}
        />
      )}
    </div>
  );
};
