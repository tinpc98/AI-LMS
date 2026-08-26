import React, { useState } from "react";
import { Button, Radio, Checkbox, Tag, Alert, Space } from "antd";
import { CheckCircleFilled, CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { ContentRenderer } from "../../../components/Content/ContentRenderer";
import { lessonProgressApi } from "../../../api/lessonProgressApi";
import type { LessonBlock, LessonProgress, PracticeQuiz, QuizAttemptResult } from "../lesson.types";
import type { Question } from "../../question/question.types";

interface Props {
  lessonId: string;
  block: LessonBlock;
  bestScorePercent: number | null;
  isCompleted: boolean;
  onProgressUpdated: (progress: LessonProgress) => void;
}

const QUIZ_PASS_THRESHOLD = 70;

// TÍNH NĂNG MỚI (mục 1.4/1.6): Practice Quiz — chấm ngay, hiện đáp án đúng ngay sau khi nộp,
// làm lại không giới hạn (khác Assignment/Exam: không tính vào điểm tổng kết).
export const LessonPracticeQuizBlockView: React.FC<Props> = ({
  lessonId,
  block,
  bestScorePercent,
  isCompleted,
  onProgressUpdated,
}) => {
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptResult | null>(null);

  const quiz = typeof block.quizId === "object" ? (block.quizId as PracticeQuiz) : null;
  if (!quiz) {
    return <Alert type="warning" showIcon message="Bài quiz này chưa có câu hỏi." />;
  }

  const questions = quiz.questions
    .map((q) => (typeof q.questionId === "object" ? (q.questionId as Question) : null))
    .filter((q): q is Question => q !== null);

  const handleSelect = (questionId: string, optionId: string, multiple: boolean) => {
    setAnswers((prev) => {
      if (!multiple) return { ...prev, [questionId]: [optionId] };
      const current = prev[questionId] || [];
      const next = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      return { ...prev, [questionId]: next };
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await lessonProgressApi.submitPracticeQuizAttempt(lessonId, block._id, {
        answers: questions.map((q) => ({
          questionId: q._id,
          selectedOptionIds: answers[q._id] || [],
        })),
      });
      setResult(res.data);
      onProgressUpdated(res.data.progress);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
  };

  const gradedByQuestionId = new Map((result?.gradedAnswers || []).map((g) => [g.questionId, g]));

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-semibold text-gray-800">{quiz.title}</span>
        <Space>
          {bestScorePercent !== null && bestScorePercent !== undefined && (
            <Tag color={bestScorePercent >= QUIZ_PASS_THRESHOLD ? "success" : "default"}>
              Điểm cao nhất: {bestScorePercent}%
            </Tag>
          )}
          {isCompleted && (
            <Tag icon={<CheckCircleFilled />} color="success">
              Đạt yêu cầu
            </Tag>
          )}
        </Space>
      </div>

      <div className="flex flex-col gap-5">
        {questions.map((q, idx) => {
          const graded = gradedByQuestionId.get(q._id);
          const multiple = q.selectionMode === "MULTIPLE";
          const selected = answers[q._id] || [];

          return (
            <div key={q._id} className="border-t border-gray-100 pt-4 first:border-t-0 first:pt-0">
              <div className="mb-2 flex gap-2">
                <span className="font-semibold text-gray-700">Câu {idx + 1}.</span>
                <ContentRenderer blocks={q.content} />
              </div>

              <div className="flex flex-col gap-2 pl-4">
                {(q.options || []).map((opt) => {
                  const isSelected = selected.includes(opt.id);
                  const isCorrectOption = graded?.correctOptionIds.includes(opt.id);
                  const showFeedback = Boolean(graded);

                  let feedbackClass = "";
                  if (showFeedback) {
                    if (isCorrectOption) feedbackClass = "border-green-400 bg-green-50";
                    else if (isSelected && !isCorrectOption)
                      feedbackClass = "border-red-400 bg-red-50";
                  }

                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer ${
                        feedbackClass || "border-gray-200"
                      } ${result ? "cursor-default" : "hover:border-blue-300"}`}
                    >
                      {multiple ? (
                        <Checkbox
                          checked={isSelected}
                          disabled={Boolean(result)}
                          onChange={() => handleSelect(q._id, opt.id, true)}
                        />
                      ) : (
                        <Radio
                          checked={isSelected}
                          disabled={Boolean(result)}
                          onChange={() => handleSelect(q._id, opt.id, false)}
                        />
                      )}
                      <div className="flex-1">
                        <ContentRenderer blocks={opt.content} />
                      </div>
                      {showFeedback && isCorrectOption && (
                        <CheckOutlined style={{ color: "#52c41a" }} />
                      )}
                      {showFeedback && isSelected && !isCorrectOption && (
                        <CloseOutlined style={{ color: "#ff4d4f" }} />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        {result ? (
          <>
            <span className="font-semibold text-gray-700">
              Kết quả lần này: {result.scorePercent}%
            </span>
            <Button onClick={handleRetry}>Làm lại</Button>
          </>
        ) : (
          <Button
            type="primary"
            loading={submitting}
            onClick={handleSubmit}
            disabled={questions.length === 0}
          >
            Nộp bài
          </Button>
        )}
      </div>
    </div>
  );
};

export default LessonPracticeQuizBlockView;
