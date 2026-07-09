import { useState } from "react";
import axios from "axios";
import { lessonApi } from "../../api/lessonApi";
import type { ILesson } from "../../interface/lessonInterface";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onCreated: (lesson: ILesson) => void;
}

export default function CreateLessonModal({ isOpen, onClose, classId, onCreated }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setFiles([]);
    setErrorMsg("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    // Giới hạn tối đa 5 file
    setFiles(selectedFiles.slice(0, 5));
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const res = await lessonApi.createLesson({
        title: title.trim(),
        description: description.trim() || undefined,
        videoUrl: videoUrl.trim() || undefined,
        classId,
        files,
      });

      onCreated(res.data.lesson);
      resetForm();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || "Tạo bài giảng thất bại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      {/* Backdrop đóng modal */}
      <div className="absolute inset-0" onClick={handleClose}></div>

      {/* Thùng chứa Modal chính */}
      <div className="relative w-full max-w-lg p-6 bg-white rounded-2xl shadow-xl z-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto border border-outline-variant">
        {/* Header của Modal */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">add_box</span>
            <h3 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Hanken Grotesk" }}>
              Tạo bài giảng mới
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form nhập liệu nội dung */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Tiêu đề */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Tiêu đề bài giảng
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Chương 1 - Mệnh đề và Tập hợp"
              className="w-full px-4 py-2.5 border border-outline-variant bg-surface-container-low rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface text-sm transition-all placeholder:text-outline"
              required
              autoFocus
            />
          </div>

          {/* Mô tả ngắn */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Mô tả (không bắt buộc)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả ngắn gọn mục tiêu hoặc nội dung chính của bài giảng..."
              className="w-full px-4 py-2.5 border border-outline-variant bg-surface-container-low rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface text-sm transition-all resize-none placeholder:text-outline"
            />
          </div>

          {/* Link Video bài giảng */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Đường dẫn Video (YouTube / Drive...)
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-lg">link</span>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-2.5 border border-outline-variant bg-surface-container-low rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-on-surface text-sm transition-all placeholder:text-outline"
              />
            </div>
          </div>

          {/* Tệp tin học liệu đính kèm đè lên UI chuyên nghiệp */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Tài liệu đính kèm (Tối đa 5 files, ≤10MB/file)
            </label>

            <div className="relative border-2 border-dashed border-outline-variant hover:border-primary/50 rounded-xl p-4 transition-colors bg-surface-container-low flex flex-col items-center justify-center cursor-pointer group">
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
              />
              <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors text-3xl mb-1">
                cloud_upload
              </span>
              <p className="text-xs font-semibold text-on-surface-variant">Nhấp để chọn tệp tin bài giảng</p>
              <p className="text-[10px] text-outline mt-0.5">Chấp nhận định dạng .pdf, .doc, .docx hoặc hình ảnh</p>
            </div>

            {/* Danh sách tệp đã chọn có nút xóa trực quan */}
            {files.length > 0 && (
              <div className="mt-2 space-y-1 bg-surface-container-high/40 p-2 rounded-xl border border-outline-variant/40">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs text-on-surface-variant px-2 py-1 bg-white border border-outline-variant rounded-lg"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="material-symbols-outlined text-sm text-outline">description</span>
                      <span className="truncate max-w-[280px]">{file.name}</span>
                      <span className="text-[10px] text-outline flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-error hover:bg-error-container/10 p-1 rounded transition-colors flex items-center justify-center"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alert báo lỗi tập trung */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-error-container text-on-error-container rounded-xl text-xs font-medium border border-error/10 animate-shake">
              <span className="material-symbols-outlined text-sm flex-shrink-0">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Thanh Actions bên dưới footer modal */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant mt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 flex items-center gap-2 text-sm font-bold text-white bg-primary disabled:bg-primary/40 rounded-xl hover:bg-primary/95 shadow-sm active:scale-[0.98] transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">cloud_done</span>
                  <span>Tạo bài giảng</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
