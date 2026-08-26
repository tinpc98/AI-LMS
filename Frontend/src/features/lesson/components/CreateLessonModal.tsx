// Frontend/src/features/lesson/components/CreateLessonModal.tsx
import React, { useState } from "react";
import axios from "axios";
import { lessonApi } from "../../../api/lessonApi";
import type { Lesson } from "../lesson.types";

/**
 * Modal tạo bài giảng mới / đổi tên bài giảng — CHỈ quản lý tiêu đề + mô tả. Thêm/sửa nội dung
 * (block Video/Tài liệu/Quiz) làm ở trang chi tiết bài giảng (LectureDetailTeacherPage), giống
 * đúng cách Topic được tạo rỗng rồi quản lý nội dung riêng (TopicManagerModal).
 *
 * TÍNH NĂNG MỚI: dựng lại — bản cũ gửi {videoUrl, duration, isPublished, files} không khớp gì
 * với backend thật (Lesson giờ là tập hợp block, không còn field phẳng nào trong số đó).
 *
 * CHỈ ĐƯỢC GẮN KẾT KHI THẬT SỰ MỞ — xem lý do ở phiên bản trước, giữ nguyên nguyên tắc.
 */
interface Props {
  onClose: () => void;
  classId: string;
  lessonData?: Lesson | null;
  onCreated: (lesson: Lesson) => void;
  onUpdated?: (lesson: Lesson) => void;
}

export default function CreateLessonModal({
  onClose,
  classId,
  lessonData,
  onCreated,
  onUpdated,
}: Props) {
  const isEditMode = !!lessonData;

  const [title, setTitle] = useState(lessonData?.title ?? "");
  const [description, setDescription] = useState(lessonData?.description ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
        });
        onUpdated?.(res.data.lesson);
      } else {
        const res = await lessonApi.createLesson({
          title: title.trim(),
          description: description.trim() || undefined,
          classId,
          status: "DRAFT",
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
            {isEditMode ? "Sửa thông tin bài giảng" : "Tạo bài giảng mới"}
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

          {!isEditMode && (
            <p className="text-xs text-gray-500">
              Bài giảng được tạo ở trạng thái Bản nháp — sau khi tạo, hãy vào bài giảng để thêm
              Video/Tài liệu/Quiz rồi Xuất bản khi sẵn sàng.
            </p>
          )}

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
