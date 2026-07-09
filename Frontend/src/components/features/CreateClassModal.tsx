import { useState } from "react";
import axios from "axios";
import { classApi } from "../../api/classApi";
import type { IClass } from "../../interface/classInterface";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newClass: IClass) => void; // callback đẩy lớp mới về danh sách ở trang cha
}

export default function CreateClassModal({ isOpen, onClose, onCreated }: Props) {
  const [className, setClassName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const res = await classApi.createClass({ className: className.trim() });

      onCreated(res.data.data); // trả lớp mới về component cha
      setClassName("");
      onClose();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || "Tạo lớp học thất bại, vui lòng thử lại!");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative w-full max-w-md p-6 bg-white rounded-2xl shadow-xl z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-bold text-gray-900">Tạo lớp học mới</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleCreateClass} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Tên lớp học</label>
            <input
              type="text"
              placeholder="Ví dụ: Lớp 10A1 - Toán học"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-black"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500">Hệ thống sẽ tự động sinh mã tham gia (Join Code) cho lớp.</p>
          </div>

          {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm disabled:bg-indigo-300"
            >
              {isSubmitting ? "Đang tạo..." : "Tạo lớp"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
