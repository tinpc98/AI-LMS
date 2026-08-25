import React from 'react';
import type { AssignmentAttempt, AttemptQuestion } from '../assignment.types';
import { ContentRenderer } from '../../../components/Content/ContentRenderer';

export interface AttemptUIProps {
  attempt: AssignmentAttempt;
  onSaveAnswer: (questionId: string, answerData: any) => Promise<void>;
  onSubmit: () => Promise<void>;
  isSubmitting?: boolean;
}

export const AttemptUI: React.FC<AttemptUIProps> = ({ 
  attempt, 
  onSaveAnswer, 
  onSubmit, 
  isSubmitting = false 
}) => {
  const handleOptionChange = (question: AttemptQuestion, optionId: string) => {
    const type = question.questionSnapshot.type;
    let newSelected: string[] = [];

    if (type === 'MCQ' /* Assuming Single choice for simplicity in mockup */) {
      // In real scenario, distinguish SINGLE vs MULTIPLE from question properties
      // if available in snapshot, or assume SINGLE if not explicitly MULTIPLE.
      newSelected = [optionId]; 
    } else {
      // For MULTIPLE
      const prev = question.answer?.selectedOptionIds || [];
      if (prev.includes(optionId)) {
        newSelected = prev.filter(id => id !== optionId);
      } else {
        newSelected = [...prev, optionId];
      }
    }

    onSaveAnswer(question.questionId, { selectedOptionIds: newSelected });
  };

  const handleTextAnswerChange = (question: AttemptQuestion, text: string) => {
    onSaveAnswer(question.questionId, { 
      content: [{ id: 'ans1', type: 'TEXT', order: 1, text }] 
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow border border-slate-200">
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          Bài làm của bạn (Lần {attempt.attemptNumber})
        </h2>
        <div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            attempt.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
            attempt.status === 'SUBMITTED' ? 'bg-yellow-100 text-yellow-700' :
            'bg-green-100 text-green-700'
          }`}>
            {attempt.status}
          </span>
          {attempt.status === 'GRADED' && (
            <span className="ml-3 font-bold text-lg text-green-700">
              Điểm: {attempt.score}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {attempt.questions.map((aq, index) => (
          <div key={aq.questionId} className="border rounded-md p-5 bg-slate-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-slate-800">Câu {index + 1}</h3>
              <span className="text-sm text-slate-500">{aq.points} điểm</span>
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
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang nộp...' : 'Nộp bài'}
          </button>
        </div>
      )}
    </div>
  );
};
