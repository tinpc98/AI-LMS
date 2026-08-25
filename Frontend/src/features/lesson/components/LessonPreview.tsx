import React from 'react';
import type { Lesson } from '../lesson.types';
import { ContentRenderer } from '../../../components/Content/ContentRenderer';

export interface LessonPreviewProps {
  lesson: Lesson;
  onMarkComplete?: () => Promise<void>;
  isCompleted?: boolean;
}

export const LessonPreview: React.FC<LessonPreviewProps> = ({ 
  lesson, 
  onMarkComplete,
  isCompleted = false
}) => {
  return (
    <div className="max-w-4xl mx-auto bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-800">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-slate-600 mt-2">{lesson.description}</p>
        )}
      </div>

      {/* Lesson Content (Theory) */}
      <div className="px-6 py-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Lý thuyết</h2>
        {lesson.content && lesson.content.length > 0 ? (
          <div className="prose max-w-none text-slate-700">
            <ContentRenderer blocks={lesson.content} />
          </div>
        ) : (
          <p className="text-slate-500 italic">Không có nội dung lý thuyết.</p>
        )}
      </div>

      {/* Videos Section */}
      {lesson.videoIds && lesson.videoIds.length > 0 && (
        <div className="px-6 py-6 border-t bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Video Bài giảng</h2>
          <div className="space-y-4">
            {lesson.videoIds.map((video: any, index: number) => (
              <div key={typeof video === 'string' ? video : video._id} className="bg-white p-4 rounded-md border shadow-sm">
                <div className="font-medium text-slate-800 mb-2">
                  Video {index + 1}: {typeof video !== 'string' && video.title ? video.title : 'No Title'}
                </div>
                {/* Mockup Video Player */}
                <div className="aspect-video bg-black rounded flex items-center justify-center">
                  <span className="text-white">Video Player Placeholder</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Documents Section */}
      {lesson.documentIds && lesson.documentIds.length > 0 && (
        <div className="px-6 py-6 border-t">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Tài liệu tham khảo</h2>
          <ul className="space-y-2">
            {lesson.documentIds.map((doc: any, index: number) => (
              <li key={typeof doc === 'string' ? doc : doc._id} className="flex items-center gap-2 p-3 bg-slate-50 border rounded hover:bg-slate-100 transition-colors">
                <span className="text-blue-500">📄</span>
                <a href={typeof doc !== 'string' ? doc.fileUrl : '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {typeof doc !== 'string' && doc.title ? doc.title : `Tài liệu đính kèm ${index + 1}`}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer / Actions */}
      <div className="bg-slate-100 px-6 py-4 flex justify-end border-t">
        {isCompleted ? (
          <button 
            className="flex items-center gap-2 px-6 py-2 bg-green-100 text-green-700 font-medium rounded-md border border-green-200"
            disabled
          >
            ✓ Đã hoàn thành
          </button>
        ) : (
          <button 
            onClick={onMarkComplete}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Đánh dấu đã hoàn thành
          </button>
        )}
      </div>
    </div>
  );
};
