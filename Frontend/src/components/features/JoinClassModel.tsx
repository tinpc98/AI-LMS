import React, { useState } from "react";

export default function JoinClassModal({ isOpen, onClose }) {
  const [classCode, setClassCode] = useState("");

  // Nếu trạng thái là đóng, không hiển thị gì cả
  if (!isOpen) return null;

  const handleJoinClass = (e) => {
    e.preventDefault();
    if (classCode.trim()) {
      console.log("Đang gửi yêu cầu tham gia lớp với mã:", classCode);
      // Xử lý gọi API kiểm tra mã lớp học ở đây...

      // Reset ô nhập và đóng popup sau khi hoàn thành
      setClassCode("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      {/* Click ra ngoài vùng trắng để đóng popup */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Khung nội dung chính của Popup */}
      <div className="relative w-full max-w-md p-6 bg-white rounded-2xl shadow-xl z-10 flex flex-col gap-4">
        {/* Tiêu đề & Nút X */}
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-xl font-bold text-gray-900">Tham gia lớp học</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Nội dung Form nhập mã */}
        <form onSubmit={handleJoinClass} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Mã lớp học</label>
            <input
              type="text"
              placeholder="Ví dụ: XZ-1234-Y"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-black"
              required
              autoFocus
            />
            <p className="text-xs text-gray-500">Xin mã lớp học từ giảng viên của bạn để nhập vào đây.</p>
          </div>

          {/* Dưới chân popup */}
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
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
            >
              Tham gia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
