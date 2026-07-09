import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { lessonApi } from "../../api/lessonApi";
import type { ILesson } from "../../interface/lessonInterface";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  lessonData?: ILesson | null; // Thêm prop dữ liệu bài giảng cũ
  onCreated: (lesson: ILesson) => void;
  onUpdated?: (lesson: ILesson) => void; // Thêm callback cập nhật bài giảng
}

interface IFormInputs {
  title: string;
  description?: string;
  videoUrl?: string;
}

export default function CreateLessonModal({ isOpen, onClose, classId, lessonData, onCreated, onUpdated }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IFormInputs>();

  // Tự động nạp hoặc dọn sạch dữ liệu vào Form khi đóng/mở hoặc chuyển chế độ Tạo/Sửa
  useEffect(() => {
    if (isOpen) {
      if (lessonData) {
        reset({
          title: lessonData.title,
          description: lessonData.description || "",
          videoUrl: lessonData.videoUrl || "",
        });
      } else {
        reset({ title: "", description: "", videoUrl: "" });
      }
      setFiles([]);
      setErrorMsg("");
    }
  }, [isOpen, lessonData, reset]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(e.target.files ?? []).slice(0, 5));
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const onSubmitForm = async (data: IFormInputs) => {
    try {
      setIsSubmitting(true);
      setErrorMsg("");

      if (lessonData) {
        // --- LOGIC CHỈNH SỬA (Cập nhật bài giảng đã có) ---
        const res = await lessonApi.updateLesson(lessonData._id, {
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          videoUrl: data.videoUrl?.trim() || undefined,
          files, // Gửi các file tải lên bổ sung lên Server nếu Backend hỗ trợ
        });
        if (onUpdated) onUpdated(res.data.lesson);
      } else {
        // --- LOGIC TẠO MỚI ---
        const res = await lessonApi.createLesson({
          title: data.title.trim(),
          description: data.description?.trim() || undefined,
          videoUrl: data.videoUrl?.trim() || undefined,
          classId,
          files,
        });
        onCreated(res.data.lesson);
      }
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || "Thao tác bài giảng thất bại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-lg p-6 bg-white rounded-2xl shadow-xl z-10 flex flex-col gap-4 max-h-[90vh] overflow-y-auto border border-outline-variant">
        {/* Tiêu đề linh hoạt theo chế độ Tạo/Sửa */}
        <div className="flex items-center justify-between border-b border-outline-variant pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">{lessonData ? "edit_note" : "add_box"}</span>
            <h3 className="text-xl font-bold text-on-surface" style={{ fontFamily: "Hanken Grotesk" }}>
              {lessonData ? "Chỉnh sửa bài giảng" : "Tạo bài giảng mới"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmitForm)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Tiêu đề bài giảng *
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Chương 1 - Mệnh đề và Tập hợp"
              className={`w-full px-4 py-2.5 border rounded-xl outline-none text-on-surface text-sm transition-all ${
                errors.title
                  ? "border-error focus:ring-2 focus:ring-error"
                  : "border-outline-variant bg-surface-container-low focus:ring-2 focus:ring-primary"
              }`}
              {...register("title", {
                required: "Tiêu đề không được để trống",
                validate: (v) => !!v.trim() || "Tiêu đề không hợp lệ",
              })}
            />
            {errors.title && <span className="text-xs font-semibold text-error mt-0.5">{errors.title.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Mô tả (không bắt buộc)
            </label>
            <textarea
              rows={3}
              placeholder="Mô tả ngắn gọn mục tiêu bài giảng..."
              className="w-full px-4 py-2.5 border border-outline-variant bg-surface-container-low rounded-xl focus:ring-2 focus:ring-primary outline-none text-on-surface text-sm transition-all resize-none"
              {...register("description")}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Đường dẫn Video (YouTube / Drive...)
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-outline text-lg">link</span>
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-2.5 border border-outline-variant bg-surface-container-low rounded-xl focus:ring-2 focus:ring-primary outline-none text-on-surface text-sm transition-all"
                {...register("videoUrl", {
                  pattern: {
                    value: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?.*$/,
                    message: "URL sai định dạng",
                  },
                })}
              />
            </div>
            {errors.videoUrl && (
              <span className="text-xs font-semibold text-error mt-0.5">{errors.videoUrl.message}</span>
            )}
          </div>

          {/* Upload file */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              {lessonData ? "Tải lên tệp mới bổ sung (Tối đa 5 files)" : "Tài liệu đính kèm (Tối đa 5 files)"}
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
              <p className="text-xs font-semibold text-on-surface-variant">Nhập để chọn tệp tin</p>
            </div>

            {/* Hiển thị danh sách file đang chọn */}
            {files.length > 0 && (
              <div className="mt-2 space-y-1 bg-surface-container-high/40 p-2 rounded-xl border border-outline-variant/40">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs text-on-surface-variant px-2 py-1 bg-white border border-outline-variant rounded-lg"
                  >
                    <span className="truncate max-w-[280px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-error p-1 hover:bg-error-container/10 rounded"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {errorMsg && <p className="text-xs text-error font-medium">{errorMsg}</p>}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-on-surface-variant bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 flex items-center gap-2 text-sm font-bold text-white bg-[#3525cd] disabled:bg-primary/40 rounded-xl hover:bg-[#2a1db4] shadow-sm active:scale-[0.98] transition-all"
            >
              {isSubmitting ? "Đang xử lý..." : lessonData ? "Lưu thay đổi" : "Tạo bài giảng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
