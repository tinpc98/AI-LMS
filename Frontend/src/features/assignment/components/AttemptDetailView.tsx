import React, { useState } from "react";
import { Typography, Tag, Space, Button, InputNumber, Input, Divider } from "antd";
import type { IAssignmentAttempt, IAttemptQuestion } from "../../../interface/assignmentInterface";
import assignmentApi from "../../../api/assignmentApi";
import { toast } from "../../../utils/toast";

const { Text, Paragraph } = Typography;

interface AttemptDetailViewProps {
  attempt: IAssignmentAttempt;
  onGradeSuccess?: (updatedAttempt: IAssignmentAttempt) => void;
  isTeacher?: boolean;
}

export const AttemptDetailView: React.FC<AttemptDetailViewProps> = ({ attempt, onGradeSuccess, isTeacher }) => {
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [grades, setGrades] = useState<Record<string, { score: number; feedback: string }>>({});

  const handleGradeChange = (questionId: string, field: "score" | "feedback", value: any) => {
    setGrades((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value,
      },
    }));
  };

  const submitGrade = async (q: IAttemptQuestion) => {
    const gradeData = grades[q.questionId];
    if (!gradeData || gradeData.score === undefined) {
      toast.error("Vui lòng nhập điểm.");
      return;
    }
    
    if (gradeData.score < 0 || gradeData.score > q.points) {
      toast.error(`Điểm phải từ 0 đến ${q.points}`);
      return;
    }

    setLoading((prev) => ({ ...prev, [q.questionId]: true }));
    try {
      const res = await assignmentApi.gradeEssay(attempt._id, q.questionId, gradeData.score, gradeData.feedback || "");
      toast.success("Đã lưu điểm!");
      if (onGradeSuccess) {
        onGradeSuccess(res);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi chấm điểm");
    } finally {
      setLoading((prev) => ({ ...prev, [q.questionId]: false }));
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. Tổng kết điểm số */}
      <div
        style={{
          backgroundColor: attempt.status === "GRADED" ? "var(--color-success-bg, #f6ffed)" : "#fffbe6",
          border: attempt.status === "GRADED" ? "1px solid var(--color-success-border, #b7eb8f)" : "1px solid #ffe58f",
          borderRadius: 8,
          padding: "12px 16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text strong style={{ fontSize: 16, color: attempt.status === "GRADED" ? "var(--color-success-text, #389e0d)" : "#d48806" }}>
            Trạng thái: {attempt.status} 
            {attempt.score !== null && ` - Điểm: ${attempt.score}`}
          </Text>
        </div>
      </div>

      {/* 2. Danh sách câu hỏi */}
      {attempt.questions?.map((q, idx) => {
        const type = q.questionSnapshot?.type;
        const isEssay = type === "ESSAY" || type === "SHORT_ANSWER";
        const contentStr = typeof q.questionSnapshot?.content === "string" 
          ? q.questionSnapshot.content 
          : (q.questionSnapshot?.content?.[0] as any)?.text;
        
        const answerStr = typeof q.answer?.content === "string" 
          ? q.answer?.content 
          : (q.answer?.content?.[0] as any)?.text;

        return (
          <div key={q.questionId} style={{ border: "1px solid #d9d9d9", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Text strong>Câu {idx + 1} ({q.points} điểm)</Text>
              <Tag color={type === "MCQ" ? "blue" : "purple"}>{type}</Tag>
            </div>
            
            <Paragraph>{contentStr}</Paragraph>
            
            <div style={{ backgroundColor: "#f5f5f5", padding: 12, borderRadius: 4, marginBottom: 12 }}>
              <Text strong>Bài làm của học sinh:</Text>
              {type === "MCQ" ? (
                <div>
                  <Text>{q.answer?.selectedOptionIds?.join(", ") || "Chưa chọn"}</Text>
                </div>
              ) : (
                <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                  {answerStr || <Text type="secondary">Chưa trả lời</Text>}
                </div>
              )}
            </div>

            <Divider style={{ margin: "12px 0" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <Text strong>Điểm đạt được: </Text>
                <Text type={q.isCorrect ? "success" : "danger"}>
                  {q.score !== null && q.score !== undefined ? q.score : "Chưa chấm"} / {q.points}
                </Text>
                {q.answer?.feedback && (
                  <div style={{ marginTop: 8 }}>
                    <Text strong>Lời phê: </Text>
                    <Text>{q.answer.feedback}</Text>
                  </div>
                )}
              </div>

              {isTeacher && isEssay && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 300 }}>
                  <InputNumber 
                    min={0} 
                    max={q.points} 
                    placeholder="Điểm số" 
                    value={grades[q.questionId]?.score ?? q.score}
                    onChange={(val) => handleGradeChange(q.questionId, "score", val)}
                    style={{ width: "100%" }}
                  />
                  <Input.TextArea 
                    placeholder="Nhận xét (Tùy chọn)" 
                    value={grades[q.questionId]?.feedback ?? q.answer?.feedback ?? ""}
                    onChange={(e) => handleGradeChange(q.questionId, "feedback", e.target.value)}
                    rows={2}
                  />
                  <Button 
                    type="primary" 
                    size="small" 
                    loading={loading[q.questionId]} 
                    onClick={() => submitGrade(q)}
                  >
                    Lưu điểm
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
