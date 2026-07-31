// Frontend/src/components/features/CreateLessonModal.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { lessonApi } from "../../../api/lessonApi";
import type { ILesson } from "../../../interface/lessonInterface";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  lessonData?: ILesson | null;
  onCreated: (lesson: ILesson) => void;
  onUpdated?: (lesson: ILesson) => void;
}

export default function CreateLessonModal({
  isOpen,
  onClose,
  classId,
  lessonData,
  onCreated,
  onUpdated,
}: Props) {
  const isEditMode = !!lessonData;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [duration, setDuration] = useState<number>(0);
  const [isPublished, setIsPublished] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Đồng bộ form mỗi khi mở modal / đổi bài giảng đang sửa
  useEffect(() => {
    if (isOpen) {
      setTitle(lessonData?.title ?? "");
      setDescription(lessonData?.description ?? "");
      setVideoUrl(lessonData?.videoUrl ?? "");
      setDuration(lessonData?.duration ?? 0);
      setIsPublished(lessonData?.isPublished ?? true);
      setFiles([]);
      setErrorMsg("");
    }
  }, [isOpen, lessonData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      if (isEditMode && lessonData) {
        const res = await lessonApi.updateLesson(lessonData._id, {
          title: title.trim(),
          description: description.trim(),
          videoUrl: videoUrl.trim(),
          duration,
          isPublished,
          files,
        });
        onUpdated?.(res.data.lesson); // BE trả về { lesson: {...} }
      } else {
        const res = await lessonApi.createLesson({
          title: title.trim(),
          description: description.trim() || undefined,
          videoUrl: videoUrl.trim() || undefined,
          classId,
          files,
          duration,
          isPublished,
        });
        onCreated(res.data.lesson);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(
          error.response?.data?.message ||
            (isEditMode ? "Cập nhật bài giảng thất bại." : "Tạo bài giảng thất bại.")
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-lg p-6 bg-white rounded-2xl shadow-xl z-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-bold text-gray-900">
            {isEditMode ? "Sửa bài giảng" : "Tạo bài giảng mới"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Tiêu đề bài giảng</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Chương 1 - Mệnh đề và Tập hợp"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Mô tả (không bắt buộc)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Link video (YouTube...)</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Thời lượng học dự kiến (phút)
            </label>
            <input
              type="number"
              min={0}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-black"
            />
          </div>

          {isEditMode && lessonData!.attachments.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Tệp đính kèm hiện có</label>
              <ul className="text-xs text-gray-500 list-disc pl-4">
                {lessonData!.attachments.map((f) => (
                  <li key={f.publicId}>{f.name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              {isEditMode
                ? "Thêm tệp mới (không bắt buộc)"
                : "Tệp đính kèm (tối đa 5 file, ≤10MB/file)"}
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,image/*"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 5))}
              className="w-full text-sm text-gray-600"
            />
            {files.length > 0 && (
              <ul className="text-xs text-gray-500 list-disc pl-4">
                {files.map((f) => (
                  <li key={f.name}>{f.name}</li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm font-semibold text-gray-700">
              Hiển thị cho học sinh (Công khai)
            </span>
          </label>

          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm disabled:bg-indigo-300"
            >
              {isSubmitting ? "Đang lưu..." : isEditMode ? "Lưu thay đổi" : "Tạo bài giảng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
