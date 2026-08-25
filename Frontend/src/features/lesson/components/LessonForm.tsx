import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Lesson } from '../lesson.types';
import type { ContentBlock } from '../../question/question.types';
import { ContentRenderer } from '../../../components/Content/ContentRenderer';
import { FormulaEditor } from '../../../components/Editor/FormulaEditor';

export interface LessonFormProps {
  initialData?: Partial<Lesson>;
  onSubmit: (data: Partial<Lesson>) => Promise<void>;
  isSubmitting?: boolean;
}

export const LessonForm: React.FC<LessonFormProps> = ({ 
  initialData, 
  onSubmit,
  isSubmitting = false
}) => {
  const [topicId, setTopicId] = useState(initialData?.topicId || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState(initialData?.status || 'DRAFT');
  const [order, setOrder] = useState(initialData?.order || 0);
  const [content, setContent] = useState<ContentBlock[]>(initialData?.content || []);
  
  const [activeEditor, setActiveEditor] = useState<boolean>(false);

  const addTextBlock = () => {
    const textStr = window.prompt("Nhập nội dung văn bản:");
    if (!textStr) return;

    const newBlock: ContentBlock = {
      id: uuidv4(),
      type: 'TEXT',
      order: Date.now(),
      text: textStr
    };
    setContent([...content, newBlock]);
  };

  const handleFormulaSubmit = (latex: string, displayMode: "INLINE" | "BLOCK") => {
    const newBlock: ContentBlock = {
      id: uuidv4(),
      type: 'FORMULA',
      order: Date.now(),
      latex,
      displayMode
    };
    setContent([...content, newBlock]);
    setActiveEditor(false);
  };

  const removeBlock = (id: string) => {
    setContent(content.filter(b => b.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      topicId,
      title,
      description,
      status,
      order: Number(order),
      content
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-xl font-semibold mb-4 text-slate-800">
        {initialData?._id ? 'Sửa bài giảng' : 'Tạo bài giảng mới'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Topic ID (*)</label>
            <input 
              type="text" 
              value={topicId}
              onChange={e => setTopicId(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự hiển thị (Order)</label>
            <input 
              type="number" 
              value={order}
              onChange={e => setOrder(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tiêu đề bài giảng (*)</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả ngắn</label>
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
          <select 
            value={status}
            onChange={e => setStatus(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="DRAFT">DRAFT (Bản nháp)</option>
            <option value="PUBLISHED">PUBLISHED (Xuất bản)</option>
            <option value="ARCHIVED">ARCHIVED (Lưu trữ)</option>
          </select>
        </div>

        {/* Content Block Editor */}
        <div className="border rounded-md p-4 bg-slate-50">
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Nội dung bài học (Lý thuyết)
          </label>
          
          <div className="space-y-3 mb-4">
            {content.map((block) => (
              <div key={block.id} className="relative group border bg-white p-3 rounded-md shadow-sm">
                <ContentRenderer blocks={[block]} />
                <button 
                  type="button"
                  onClick={() => removeBlock(block.id)}
                  className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button 
              type="button" 
              onClick={addTextBlock}
              className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md"
            >
              + Thêm Text
            </button>
            <button 
              type="button" 
              onClick={() => setActiveEditor(true)}
              className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-md"
            >
              + Thêm Công thức Toán
            </button>
          </div>
        </div>

        {activeEditor && (
          <div className="border p-4 rounded-md shadow-sm bg-white mt-4 relative">
            <h3 className="font-medium text-purple-700 mb-2">Chèn Công Thức</h3>
            <FormulaEditor 
              initialLatex="" 
              onSave={handleFormulaSubmit} 
              onCancel={() => setActiveEditor(false)} 
            />
          </div>
        )}

        {/* Note: Tạm bỏ qua field Video/Document upload component chi tiết cho bản mockup */}

        <div className="flex justify-end pt-4 border-t">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Đang lưu...' : 'Lưu Bài Giảng'}
          </button>
        </div>
      </form>
    </div>
  );
};
