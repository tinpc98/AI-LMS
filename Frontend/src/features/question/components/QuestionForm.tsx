import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { 
  Question, 
  QuestionType, 
  SelectionMode, 
  Difficulty, 
  ContentBlock, 
  QuestionOption,
  FormulaDisplayMode
} from '../question.types';
import { ContentRenderer } from '../../../components/Content/ContentRenderer';
import { FormulaEditor } from '../../../components/Editor/FormulaEditor';

export interface QuestionFormProps {
  initialData?: Partial<Question>;
  onSubmit: (data: Partial<Question>) => Promise<void>;
  isSubmitting?: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({ 
  initialData, 
  onSubmit,
  isSubmitting = false
}) => {
  const [topicId, setTopicId] = useState(initialData?.topicId || '');
  const [type, setType] = useState<QuestionType>(initialData?.type || 'MCQ');
  const [selectionMode, setSelectionMode] = useState<SelectionMode>(initialData?.selectionMode || 'SINGLE');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialData?.difficulty || 'MEDIUM');
  const [points, setPoints] = useState(initialData?.points || 1);
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  
  const [content, setContent] = useState<ContentBlock[]>(initialData?.content || []);
  const [options, setOptions] = useState<QuestionOption[]>(initialData?.options || []);
  const [explanation, setExplanation] = useState<ContentBlock[]>(initialData?.explanation || []);

  const [activeEditor, setActiveEditor] = useState<{
    target: 'content' | 'option' | 'explanation';
    targetId?: string; // optionId if target is option
    mode: 'FORMULA';
  } | null>(null);

  const addTextBlock = (target: 'content' | 'explanation' | 'option', targetId?: string) => {
    const textStr = window.prompt("Nhập nội dung văn bản:");
    if (!textStr) return;

    const newBlock: ContentBlock = {
      id: uuidv4(),
      type: 'TEXT',
      order: Date.now(),
      text: textStr
    };

    if (target === 'content') setContent([...content, newBlock]);
    if (target === 'explanation') setExplanation([...explanation, newBlock]);
    if (target === 'option' && targetId) {
      setOptions(options.map(opt => 
        opt.id === targetId ? { ...opt, content: [...opt.content, newBlock] } : opt
      ));
    }
  };

  const handleSaveFormula = (latex: string, displayMode: FormulaDisplayMode) => {
    if (!activeEditor) return;

    const newBlock: ContentBlock = {
      id: uuidv4(),
      type: 'FORMULA',
      order: Date.now(),
      latex,
      displayMode
    };

    if (activeEditor.target === 'content') {
      setContent([...content, newBlock]);
    } else if (activeEditor.target === 'explanation') {
      setExplanation([...explanation, newBlock]);
    } else if (activeEditor.target === 'option' && activeEditor.targetId) {
      setOptions(options.map(opt => 
        opt.id === activeEditor.targetId ? { ...opt, content: [...opt.content, newBlock] } : opt
      ));
    }
    setActiveEditor(null);
  };

  const removeBlock = (target: 'content' | 'explanation' | 'option', blockId: string, targetId?: string) => {
    if (target === 'content') setContent(content.filter(b => b.id !== blockId));
    if (target === 'explanation') setExplanation(explanation.filter(b => b.id !== blockId));
    if (target === 'option' && targetId) {
      setOptions(options.map(opt => 
        opt.id === targetId ? { ...opt, content: opt.content.filter(b => b.id !== blockId) } : opt
      ));
    }
  };

  const addOption = () => {
    setOptions([...options, {
      id: uuidv4(),
      content: [],
      isCorrect: false,
      order: options.length
    }]);
  };

  const removeOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
  };

  const toggleOptionCorrect = (id: string) => {
    if (selectionMode === 'SINGLE') {
      setOptions(options.map(opt => ({ ...opt, isCorrect: opt.id === id })));
    } else {
      setOptions(options.map(opt => opt.id === id ? { ...opt, isCorrect: !opt.isCorrect } : opt));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.length === 0) {
      alert("Phải có ít nhất 1 nội dung cho câu hỏi!");
      return;
    }
    if (type === 'MCQ' && options.length < 2) {
      alert("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn!");
      return;
    }
    if (type === 'MCQ' && !options.some(opt => opt.isCorrect)) {
      alert("Phải chọn ít nhất 1 đáp án đúng!");
      return;
    }

    onSubmit({
      topicId,
      type,
      selectionMode: type === 'MCQ' ? selectionMode : undefined,
      difficulty,
      points,
      status,
      content,
      options: type === 'MCQ' ? options : [],
      explanation
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Tạo / Chỉnh sửa Câu hỏi</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề (Topic ID)</label>
          <input type="text" required value={topicId} onChange={e => setTopicId(e.target.value)} className="w-full rounded border-gray-300 p-2 border" placeholder="Nhập ID chủ đề" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Loại Câu hỏi</label>
          <select value={type} onChange={e => setType(e.target.value as QuestionType)} className="w-full rounded border-gray-300 p-2 border">
            <option value="MCQ">Trắc nghiệm (MCQ)</option>
            <option value="ESSAY">Tự luận (ESSAY)</option>
            <option value="TRUE_FALSE">Đúng / Sai</option>
            <option value="SHORT_ANSWER">Điền khuyết</option>
          </select>
        </div>

        {type === 'MCQ' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chế độ chọn</label>
            <select value={selectionMode} onChange={e => setSelectionMode(e.target.value as SelectionMode)} className="w-full rounded border-gray-300 p-2 border">
              <option value="SINGLE">Một đáp án đúng</option>
              <option value="MULTIPLE">Nhiều đáp án đúng</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó</label>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)} className="w-full rounded border-gray-300 p-2 border">
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Điểm</label>
          <input type="number" min="0" step="0.5" required value={points} onChange={e => setPoints(Number(e.target.value))} className="w-full rounded border-gray-300 p-2 border" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full rounded border-gray-300 p-2 border">
            <option value="DRAFT">Bản nháp</option>
            <option value="PUBLISHED">Công khai</option>
            <option value="ARCHIVED">Lưu trữ</option>
          </select>
        </div>
      </div>

      {/* NỘI DUNG CÂU HỎI */}
      <div className="border border-gray-200 rounded p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-2">Nội dung Câu hỏi</h3>
        <div className="mb-4 p-3 bg-white border rounded min-h-[100px]">
          <ContentRenderer blocks={content} />
          {content.length > 0 && (
            <div className="mt-2 text-right">
              <button type="button" onClick={() => removeBlock('content', content[content.length - 1].id)} className="text-xs text-red-500 hover:underline">Xóa block cuối</button>
            </div>
          )}
        </div>
        
        {activeEditor?.target === 'content' ? (
          <FormulaEditor onSave={handleSaveFormula} onCancel={() => setActiveEditor(null)} />
        ) : (
          <div className="flex space-x-2">
            <button type="button" onClick={() => addTextBlock('content')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">Thêm Văn bản</button>
            <button type="button" onClick={() => setActiveEditor({ target: 'content', mode: 'FORMULA' })} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-sm">Thêm Công thức Toán</button>
          </div>
        )}
      </div>

      {/* LỰA CHỌN (NẾU LÀ MCQ) */}
      {type === 'MCQ' && (
        <div className="border border-gray-200 rounded p-4 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-800">Các lựa chọn (Options)</h3>
            <button type="button" onClick={addOption} className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium">+ Thêm Lựa chọn</button>
          </div>

          <div className="space-y-3 mt-4">
            {options.map((opt, index) => (
              <div key={opt.id} className="flex flex-col bg-white border rounded p-3 relative">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type={selectionMode === 'SINGLE' ? 'radio' : 'checkbox'} 
                      checked={opt.isCorrect} 
                      onChange={() => toggleOptionCorrect(opt.id)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="font-medium text-sm text-gray-700">Lựa chọn {index + 1} {opt.isCorrect && '(Đáp án đúng)'}</span>
                  </div>
                  <button type="button" onClick={() => removeOption(opt.id)} className="text-red-500 hover:text-red-700 text-sm">Xóa</button>
                </div>
                
                <div className="min-h-[50px] mb-2 p-2 bg-gray-50 rounded">
                  <ContentRenderer blocks={opt.content} />
                </div>

                {activeEditor?.target === 'option' && activeEditor.targetId === opt.id ? (
                  <FormulaEditor onSave={handleSaveFormula} onCancel={() => setActiveEditor(null)} />
                ) : (
                  <div className="flex space-x-2">
                    <button type="button" onClick={() => addTextBlock('option', opt.id)} className="px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-xs">Thêm Chữ</button>
                    <button type="button" onClick={() => setActiveEditor({ target: 'option', targetId: opt.id, mode: 'FORMULA' })} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 text-xs">Thêm Công thức</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LỜI GIẢI (EXPLANATION) */}
      <div className="border border-gray-200 rounded p-4 bg-gray-50">
        <h3 className="font-semibold text-gray-800 mb-2">Lời giải chi tiết (Tùy chọn)</h3>
        <div className="mb-4 p-3 bg-white border rounded min-h-[80px]">
          <ContentRenderer blocks={explanation} />
        </div>
        
        {activeEditor?.target === 'explanation' ? (
          <FormulaEditor onSave={handleSaveFormula} onCancel={() => setActiveEditor(null)} />
        ) : (
          <div className="flex space-x-2">
            <button type="button" onClick={() => addTextBlock('explanation')} className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">Thêm Văn bản</button>
            <button type="button" onClick={() => setActiveEditor({ target: 'explanation', mode: 'FORMULA' })} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 text-sm">Thêm Công thức Toán</button>
          </div>
        )}
      </div>

      <div className="flex justify-end border-t pt-4">
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6 py-2 bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 font-medium disabled:opacity-50"
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu Câu hỏi'}
        </button>
      </div>
    </form>
  );
};
