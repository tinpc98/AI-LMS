import React, { useState } from "react";

const StudentAssignmentContent = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="ml-[280px] pt-16 h-screen flex flex-col bg-surface relative">
      {/* Content Area */}
      <div className="flex-1 pb-24 overflow-hidden flex">
        {/* Questions Column */}
        <section className="flex-1 overflow-y-auto custom-scrollbar px-10 py-8">
          <div className="max-w-[800px] mx-auto">
            {/* Assignment Info Header */}
            <div className="bg-white rounded-xl border border-outline-variant p-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-primary/10 text-primary text-body-sm font-semibold rounded-full uppercase tracking-wider">
                  Cấu trúc dữ liệu & Giải thuật
                </span>
                <span className="text-on-surface-variant text-body-sm">
                  Hạn nộp: 23:59 - 15/10/2023
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-4">
                Hướng dẫn làm bài
              </h3>
              <p className="text-on-surface-variant leading-relaxed mb-4">
                Bài tập này gồm 3 phần: Trắc nghiệm lý thuyết, câu hỏi ngắn và
                phân tích mã nguồn. Vui lòng đọc kỹ yêu cầu trước khi trả lời.
                Bạn có thể sử dụng AI Assistant để nhận gợi ý nếu gặp khó khăn,
                nhưng tuyệt đối không sao chép lời giải.
              </p>
              <div className="flex gap-4 p-4 bg-surface-container-low rounded-lg border border-primary/10">
                <span
                  className="material-symbols-outlined text-primary"
                  data-icon="info"
                >
                  info
                </span>
                <span className="text-body-sm text-on-surface">
                  Mỗi câu hỏi có số điểm khác nhau được ghi rõ ở góc phải. Tổng
                  điểm: 10.0
                </span>
              </div>
            </div>

            {/* Question List */}
            <div className="space-y-6">
              {/* Question 1: Multiple Choice */}
              <div className="bg-white rounded-xl border border-outline-variant p-8 transition-all hover:border-primary-container/30">
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">
                    1
                  </span>
                  <span className="text-on-surface-variant font-semibold text-body-sm">
                    2.0 Điểm
                  </span>
                </div>
                <h4 className="text-body-lg font-semibold text-on-surface mb-6">
                  Độ phức tạp thời gian trung bình của giải thuật Quicksort là
                  gì?
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant hover:bg-primary/5 cursor-pointer transition-all group">
                    <input
                      className="w-5 h-5 text-primary border-outline-variant focus:ring-primary"
                      name="q1"
                      type="radio"
                    />
                    <span className="text-on-surface group-hover:text-primary">
                      O(n)
                    </span>
                  </label>
                  <label className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant hover:bg-primary/5 cursor-pointer transition-all group">
                    <input
                      className="w-5 h-5 text-primary border-outline-variant focus:ring-primary"
                      name="q1"
                      type="radio"
                    />
                    <span className="text-on-surface group-hover:text-primary">
                      O(n log n)
                    </span>
                  </label>
                  <label className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant hover:bg-primary/5 cursor-pointer transition-all group">
                    <input
                      className="w-5 h-5 text-primary border-outline-variant focus:ring-primary"
                      name="q1"
                      type="radio"
                    />
                    <span className="text-on-surface group-hover:text-primary">
                      O(n²)
                    </span>
                  </label>
                </div>
              </div>

              {/* Question 2: Short Answer */}
              <div className="bg-white rounded-xl border border-outline-variant p-8 transition-all hover:border-primary-container/30">
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">
                    2
                  </span>
                  <span className="text-on-surface-variant font-semibold text-body-sm">
                    3.0 Điểm
                  </span>
                </div>
                <h4 className="text-body-lg font-semibold text-on-surface mb-6">
                  Giải thích ngắn gọn cơ chế 'Chia để trị' (Divide and Conquer)
                  trong giải thuật Merge Sort.
                </h4>
                <textarea
                  className="w-full h-32 rounded-xl border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all p-4 text-body-md"
                  placeholder="Nhập câu trả lời của bạn tại đây..."
                  style={{ resize: "none" }}
                />
              </div>

              {/* Question 3: Code Analysis */}
              <div className="bg-white rounded-xl border border-outline-variant p-8 transition-all hover:border-primary-container/30">
                <div className="flex justify-between items-start mb-6">
                  <span className="bg-primary text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold">
                    3
                  </span>
                  <span className="text-on-surface-variant font-semibold text-body-sm">
                    5.0 Điểm
                  </span>
                </div>
                <h4 className="text-body-lg font-semibold text-on-surface mb-6">
                  Đoạn mã sau đây thực hiện giải thuật sắp xếp nào? Hãy tối ưu
                  hóa vòng lặp bên trong.
                </h4>
                <div className="bg-slate-900 rounded-xl p-6 mb-6 font-code-sm text-white overflow-x-auto relative">
                  <span className="absolute top-4 right-4 text-slate-500 text-[12px] uppercase tracking-widest">
                    Python
                  </span>
                  <pre>
                    <code>{`def sort_array(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
    return arr`}</code>
                  </pre>
                </div>
                <div className="space-y-4">
                  <label className="block text-label-md text-on-surface-variant mb-2">
                    Tên giải thuật:
                  </label>
                  <input
                    className="w-full rounded-xl border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all px-4 py-3 text-body-md"
                    placeholder="Tên giải thuật..."
                    type="text"
                  />
                  <label className="block text-label-md text-on-surface-variant mb-2 mt-4">
                    Đề xuất tối ưu hóa:
                  </label>
                  <textarea
                    className="w-full h-40 rounded-xl border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all p-4 font-code-sm"
                    placeholder="Nhập đoạn mã đã tối ưu hoặc giải thích..."
                    style={{ resize: "none" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Tutor Sidebar */}
        <aside className="w-[320px] bg-white border-l border-outline-variant flex flex-col">
          <div className="p-6 border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="auto_awesome"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <h5 className="font-bold text-on-surface">AI Scholar Tutor</h5>
            </div>
            <button className="text-on-surface-variant hover:text-primary">
              <span className="material-symbols-outlined" data-icon="settings">
                settings
              </span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* AI Suggestion Card */}
            <div className="ai-gradient-border p-5 shadow-sm">
              <p className="text-body-sm text-on-surface mb-3 leading-relaxed">
                Chào bạn! Tôi thấy bạn đang xem câu 3 về thuật toán nổi bọt
                (Bubble Sort). Bạn có cần một gợi ý về cách tối ưu hóa không?
              </p>
              <button className="text-primary font-bold text-body-sm flex items-center gap-2 hover:underline">
                <span
                  className="material-symbols-outlined text-[18px]"
                  data-icon="lightbulb"
                >
                  lightbulb
                </span>
                Cho tôi gợi ý
              </button>
            </div>
            {/* Chat History (Empty placeholder) */}
            <div className="text-center py-10 opacity-30">
              <span
                className="material-symbols-outlined text-[48px] mb-2"
                data-icon="chat_bubble"
              >
                chat_bubble
              </span>
              <p className="text-body-sm italic">
                Hỏi AI để nhận gợi ý học tập
              </p>
            </div>
          </div>
          <div className="p-4 border-t border-outline-variant">
            <div className="relative flex items-center">
              <input
                className="w-full pr-12 pl-4 py-3 bg-surface-container-low border-none rounded-xl focus:ring-2 focus:ring-primary text-body-md"
                placeholder="Hỏi AI về bài tập..."
                type="text"
              />
              <button className="absolute right-3 text-primary hover:scale-110 transition-transform">
                <span className="material-symbols-outlined" data-icon="send">
                  send
                </span>
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-3 text-center px-4">
              AI Scholar sẽ không trực tiếp đưa ra lời giải mà chỉ hướng dẫn bạn
              tư duy.
            </p>
          </div>
        </aside>
      </div>

      {/* Submission Bar */}
      <footer className="fixed bottom-0 right-0 left-[280px] bg-white border-t border-outline-variant h-20 px-10 flex items-center justify-between z-40">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-[12px] uppercase font-bold tracking-widest">
              Tiến độ
            </span>
            <div className="flex items-center gap-3">
              <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-primary rounded-full"></div>
              </div>
              <span className="text-body-sm font-bold text-on-surface">
                2/3 Câu
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="px-6 py-2 border border-outline-variant text-on-surface font-bold rounded-xl hover:bg-slate-50 transition-colors">
            Lưu nháp
          </button>
          <button
            className="px-8 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all active:scale-95 shadow-md shadow-primary/20"
            onClick={() => setIsModalOpen(true)}
          >
            Nộp bài
          </button>
        </div>
      </footer>

      {/* Confirmation Dialog */}
      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center ${isModalOpen ? "" : "hidden"}`}
        id="confirm-modal"
      >
        <div className="bg-white rounded-2xl w-[480px] p-8 shadow-2xl scale-100 transform transition-transform duration-300">
          <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mb-6">
            <span
              className="material-symbols-outlined text-primary text-[32px]"
              data-icon="cloud_upload"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cloud_upload
            </span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
            Bạn có chắc muốn nộp bài?
          </h3>
          <p className="text-on-surface-variant mb-8 leading-relaxed text-body-md">
            Bạn đã hoàn thành 2 trên 3 câu hỏi. Sau khi nộp, bạn sẽ không thể
            chỉnh sửa câu trả lời. Hệ thống sẽ chấm điểm và gửi kết quả về
            dashboard.
          </p>
          <div className="flex gap-4">
            <button
              className="flex-1 py-3 border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-slate-50 transition-colors"
              onClick={() => setIsModalOpen(false)}
            >
              Quay lại
            </button>
            <button className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-all shadow-lg shadow-primary/30">
              Xác nhận nộp
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StudentAssignmentContent;
