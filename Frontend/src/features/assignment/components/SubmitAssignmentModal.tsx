import React, { useState, type ChangeEvent } from "react";
import assignmentApi from "../../../api/assignmentApi";
import type { IAssignment } from "../../../interface/assignmentInterface";

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: IAssignment | null;
  onSuccess: (assignmentId: string) => void;
}

export default function SubmitAssignmentModal({
  isOpen,
  onClose,
  assignment,
  onSuccess,
}: SubmitAssignmentModalProps) {
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !assignment) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(e.target.files ?? []);
    if (!filesArray.length) return;

    if (selectedFiles.length + filesArray.length > 5) {
      setErrorMsg("Bạn chỉ có thể đính kèm tối đa 5 tệp bài làm.");
      e.target.value = "";
      return;
    }

    setErrorMsg("");
    setSelectedFiles((prev) => [...prev, ...filesArray]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedFiles.length === 0) {
      setErrorMsg("Vui lòng nhập nội dung bài làm hoặc đính kèm ít nhất 1 tệp.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const formData = new FormData();
      if (content.trim()) {
        formData.append("content", content.trim());
      }
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await assignmentApi.submitAssignment(assignment._id, formData);

      setContent("");
      setSelectedFiles([]);
      onSuccess(assignment._id);
      onClose();
    } catch (err: any) {
      console.error("Lỗi khi nộp bài:", err);
      const msg = err.response?.data?.message || "Không thể nộp bài tập. Vui lòng thử lại!";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-outline-variant">
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl">cloud_upload</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-xl font-bold text-on-surface">Nộp bài tập</h3>
            <p className="text-xs text-secondary truncate">{assignment.title}</p>
          </div>
        </div>

        {assignment.description && (
          <div className="p-3 bg-surface-container-low rounded-xl mb-4 text-xs text-secondary leading-relaxed">
            <strong>Mô tả bài tập:</strong> {assignment.description}
          </div>
        )}

        <div className="text-xs text-secondary mb-4 flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-error">schedule</span>
          <span>
            Hạn nộp: <strong>{new Date(assignment.deadline).toLocaleString("vi-VN")}</strong>
          </span>
        </div>

        {errorMsg && (
          <div className="p-3 bg-error-container/20 border border-error/20 rounded-xl text-error text-xs mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface mb-1">
              Nội dung / Ghi chú làm bài
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập ghi chú hoặc câu trả lời bài tập của bạn..."
              className="w-full p-3 text-sm rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary text-on-surface"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-on-surface">Đính kèm tệp bài làm</label>
              <span className="text-[11px] text-secondary">{selectedFiles.length}/5 tệp</span>
            </div>
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:bg-primary/5 transition text-xs text-primary font-medium">
              <input type="file" multiple className="hidden" onChange={handleFileChange} />
              <span className="material-symbols-outlined text-lg">attach_file</span>
              <span>Chọn hoặc kéo thả tệp (PDF, Word, Zip, Ảnh...)</span>
            </label>

            {selectedFiles.length > 0 && (
              <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2 bg-surface-container-low rounded-lg text-xs"
                  >
                    <span className="truncate max-w-[80%] text-on-surface">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-error hover:text-error/80"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl border border-outline-variant text-sm font-semibold text-secondary hover:bg-surface-container-high transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-sm">autorenew</span>
                  <span>Đang nộp...</span>
                </>
              ) : (
                "Xác nhận nộp bài"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
