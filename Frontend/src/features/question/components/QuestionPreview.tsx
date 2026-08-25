import React from 'react';
import type { Question } from '../question.types';
import { ContentRenderer } from '../../../components/Content/ContentRenderer';

export interface QuestionPreviewProps {
  question: Question;
  showExplanation?: boolean;
}

export const QuestionPreview: React.FC<QuestionPreviewProps> = ({ question, showExplanation = false }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-4">
        <div className="flex space-x-2">
          <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded uppercase">
            {question.type}
          </span>
          <span className={`px-2 py-1 text-xs font-semibold rounded uppercase ${
            question.difficulty === 'EASY' ? 'bg-green-50 text-green-700' :
            question.difficulty === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700' :
            'bg-red-50 text-red-700'
          }`}>
            {question.difficulty}
          </span>
        </div>
        <div className="text-sm text-gray-500 font-medium">
          {question.points} Điểm
        </div>
      </div>

      {/* Content */}
      <div className="mb-6 text-gray-800 text-lg">
        <ContentRenderer blocks={question.content} />
      </div>

      {/* Options */}
      {question.type === 'MCQ' && question.options && question.options.length > 0 && (
        <div className="space-y-3">
          {question.options.sort((a, b) => a.order - b.order).map((opt, index) => {
            const letter = String.fromCharCode(65 + index); // A, B, C, D...
            return (
              <div 
                key={opt.id} 
                className={`flex items-start p-3 border rounded-lg transition-colors ${
                  showExplanation && opt.isCorrect 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5 mr-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    showExplanation && opt.isCorrect ? 'bg-green-500 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {letter}
                  </div>
                </div>
                <div className="flex-grow pt-0.5">
                  <ContentRenderer blocks={opt.content} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Explanation */}
      {showExplanation && question.explanation && question.explanation.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h4 className="text-blue-800 font-bold mb-2 flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Lời giải chi tiết
          </h4>
          <div className="text-gray-800">
            <ContentRenderer blocks={question.explanation} />
          </div>
        </div>
      )}
    </div>
  );
};
