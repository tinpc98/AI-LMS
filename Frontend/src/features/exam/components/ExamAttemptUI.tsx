import React, { useEffect, useState } from 'react';
import type { ExamAttempt, ExamAttemptQuestion } from '../exam.types';
import { ContentRenderer } from '../../../components/Content/ContentRenderer';

export interface ExamAttemptUIProps {
  attempt: ExamAttempt;
  onSaveAnswer: (questionId: string, answerData: any) => Promise<void>;
  onSubmit: () => Promise<void>;
  onCheatWarning: (type: string) => Promise<void>;
  isSubmitting?: boolean;
}

export const ExamAttemptUI: React.FC<ExamAttemptUIProps> = ({ 
  attempt, 
  onSaveAnswer, 
  onSubmit, 
  onCheatWarning,
  isSubmitting = false 
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (attempt.status !== 'IN_PROGRESS') return;

    const expiresAt = new Date(attempt.expiresAt).getTime();
    
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const diff = expiresAt - now;
      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        onSubmit(); // Auto submit when time is up
      } else {
        setTimeLeft(Math.floor(diff / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [attempt.expiresAt, attempt.status, onSubmit]);

  // Anti-cheat detection (simple mock)
  useEffect(() => {
    if (attempt.status !== 'IN_PROGRESS') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onCheatWarning('TAB_SWITCH');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [attempt.status, onCheatWarning]);

  const handleOptionChange = (question: ExamAttemptQuestion, optionId: string) => {
    const type = question.questionSnapshot.type;
    let newSelected: string[] = [];

    if (type === 'MCQ') {
      newSelected = [optionId]; 
    } else {
      const prev = question.answer?.selectedOptionIds || [];
      if (prev.includes(optionId)) {
        newSelected = prev.filter(id => id !== optionId);
      } else {
        newSelected = [...prev, optionId];
      }
    }

    onSaveAnswer(question.questionId, { selectedOptionIds: newSelected });
  };

  const handleTextAnswerChange = (question: ExamAttemptQuestion, text: string) => {
    onSaveAnswer(question.questionId, { 
      content: [{ id: 'ans1', type: 'TEXT', order: 1, text }] 
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow border border-slate-200">
      <div className="sticky top-0 bg-white z-10 pb-4 mb-6 border-b flex justify-between items-center shadow-sm p-4 rounded-md">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Bài thi (Lần {attempt.attemptNumber})
          </h2>
          {attempt.cheatWarnings > 0 && (
            <p className="text-red-600 text-sm font-semibold">
              Cảnh báo vi phạm: {attempt.cheatWarnings} / 5
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {attempt.status === 'IN_PROGRESS' ? (
            <div className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
              Thời gian: {formatTime(timeLeft)}
            </div>
          ) : (
            <span className="px-4 py-2 rounded-full font-bold bg-slate-100 text-slate-700">
              Trạng thái: {attempt.status}
            </span>
          )}
          {['GRADED', 'PARTIALLY_GRADED'].includes(attempt.status) && attempt.score !== undefined && (
            <span className="ml-3 font-bold text-lg text-green-700 bg-green-50 px-3 py-1 rounded">
              Điểm: {attempt.score}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {attempt.questions.map((aq, index) => (
          <div key={aq.questionId} className="border rounded-md p-5 bg-slate-50 relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-slate-800">Câu {index + 1}</h3>
              <span className="text-sm text-slate-500 font-medium">{aq.points} điểm</span>
            </div>
            
            <div className="prose max-w-none text-slate-700 mb-4">
              <ContentRenderer blocks={aq.questionSnapshot.content} />
            </div>

            {aq.questionSnapshot.options && aq.questionSnapshot.options.length > 0 ? (
              <div className="space-y-2 pl-4">
                {aq.questionSnapshot.options.map(opt => (
                  <label key={opt.id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-slate-100 rounded">
                    <input 
                      type="radio"
                      name={`question_${aq.questionId}`}
                      checked={aq.answer?.selectedOptionIds?.includes(opt.id) || false}
                      onChange={() => handleOptionChange(aq, opt.id)}
                      disabled={attempt.status !== 'IN_PROGRESS'}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <ContentRenderer blocks={opt.content} />
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="mt-4">
                <textarea 
                  className="w-full border rounded-md p-3 focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Nhập câu trả lời tự luận..."
                  disabled={attempt.status !== 'IN_PROGRESS'}
                  value={
                    aq.answer?.content && aq.answer.content.length > 0 && 'text' in aq.answer.content[0]
                      ? (aq.answer.content[0] as any).text 
                      : ''
                  }
                  onChange={(e) => handleTextAnswerChange(aq, e.target.value)}
                />
              </div>
            )}

            {attempt.status === 'GRADED' && (
              <div className={`mt-4 p-3 rounded-md ${aq.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Kết quả: {aq.isCorrect ? 'Đúng' : 'Sai'} ({aq.score} điểm)
              </div>
            )}
          </div>
        ))}
      </div>

      {attempt.status === 'IN_PROGRESS' && (
        <div className="mt-8 flex justify-end border-t pt-4">
          <button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isSubmitting ? 'Đang nộp...' : 'Nộp bài thi'}
          </button>
        </div>
      )}
    </div>
  );
};
