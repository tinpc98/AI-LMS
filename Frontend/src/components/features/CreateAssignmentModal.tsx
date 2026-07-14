import { useState, type ChangeEvent, type FormEvent } from "react";
import assignmentApi from "../../api/assignmentApi";
import type { IAssignment } from "../../interface/assignmentInterface";

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  lessonId?: string;
  onCreated: (newAssignment: IAssignment) => void;
}

const MAX_FILES = 5;

const CreateAssignmentModal = ({ isOpen, onClose, classId, lessonId, onCreated }: CreateAssignmentModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setSelectedFiles([]);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(event.target.files ?? []);
    if (!filesArray.length) return;

    if (selectedFiles.length + filesArray.length > MAX_FILES) {
      alert("Chỉ được đính kèm tối đa 5 file đề bài!");
      event.target.value = "";
      return;
    }

    setSelectedFiles((prev) => [...prev, ...filesArray]);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      alert("Vui lòng nhập tiêu đề bài tập!");
      return;
    }

    if (!deadline) {
      alert("Vui lòng chọn hạn nộp!");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", trimmedTitle);
      formData.append("description", trimmedDescription);
      formData.append("deadline", new Date(deadline).toISOString());
      formData.append("classId", classId);
      if (lessonId) {
        formData.append("lessonId", lessonId);
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const createdAssignment = await assignmentApi.createAssignment(formData);
      onCreated(createdAssignment);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Lỗi khi tạo bài tập:", error);
      alert("Tạo bài tập thất bại. Vui lòng kiểm tra lại dữ liệu gửi đi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[560px] overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl max-h-[90vh]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-on-surface">Giao bài tập mới</h3>
          <button type="button" onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Tiêu đề bài tập <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Ví dụ: Bài tập tuần 1 - Giải thuật nâng cao"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">Mô tả / Hướng dẫn chi tiết</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-28 w-full resize-none rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="Nhập yêu cầu, tiêu chí chấm điểm, cách thức làm bài..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Hạn nộp (Deadline) <span className="text-error">*</span>
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Tài liệu / File đề bài (Tối đa 5 files)
            </label>
            <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-outline-variant p-5 text-center transition-colors hover:border-primary">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span className="material-symbols-outlined mb-1 text-[32px] text-on-surface-variant">upload_file</span>
              <p className="text-sm font-medium text-on-surface">Nhấp hoặc kéo thả file đề bài vào đây</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">PDF, Word, Excel, ZIP hoặc ảnh...</p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-2"
                  >
                    <span className="max-w-[85%] truncate text-sm text-on-surface">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-error hover:text-error-container"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 border-t border-outline-variant pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-outline-variant px-4 py-2.5 font-bold text-on-surface transition-colors hover:bg-slate-50"
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex flex-1 items-center justify-center rounded-xl bg-[#3525cd] px-4 py-2.5 font-bold text-white transition-all hover:bg-primary-container"
              disabled={loading}
            >
              {loading ? "Đang tạo bài tập..." : "Giao bài tập"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
