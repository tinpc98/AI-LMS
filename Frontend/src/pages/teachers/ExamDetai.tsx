import React from "react";

const ExamResultReportContent = () => {
  return (
    <main className="ml-[280px] pt-16 h-screen flex flex-col">
      {/* Header: Student & Exam Summary */}
      <section className="p-8 pb-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                alt="Trần Quốc Quân"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-outline-variant shadow-sm"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2AlmBVkrJmhl91Rpra2ZRnubuc0VYFuofmwYi1Y91_m6YpzEiRmGr3mNxphxdDIv668x2VVtN5uI6YV4jeaB_n6lKYGiGxZwpQ1_Dsxktd-6hx-Bi4wjsxx1e2UhLGC_fD5pNYx-sXeYYwWYdnmgnRDBai-794AK4Rl3lW9RBpI5HFeRH8yr7JNIHIMHZiGqu0PLDHreTnagurDziGeoz7Oj34Q2kAK414p4J44cIRGgvo3oVvFt8TbbIjIxiOrhn8RPQ_Fisx_pD"
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  Trần Quốc Quân
                </h2>
                <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-[12px] font-bold">
                  ID: STU90214
                </span>
              </div>
              <p className="font-body-md text-primary font-semibold mt-1">
                Kiểm tra giữa kỳ - Giải thuật & Cấu trúc dữ liệu
              </p>
              <div className="flex items-center gap-4 mt-2 text-on-surface-variant font-label-md">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    schedule
                  </span>
                  Thời gian làm bài: 42 phút
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    event
                  </span>
                  Ngày nộp: 24/10/2023
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3 ai-shimmer p-[2px] rounded-full">
              <div className="bg-surface-container-lowest px-4 py-1 rounded-full flex items-center gap-2">
                <span
                  className="material-symbols-outlined text-primary text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  auto_awesome
                </span>
                <span className="font-label-md text-primary font-bold">
                  Chấm điểm tự động
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[48px] font-display-lg text-on-surface leading-none">
                8.5
                <span className="text-[24px] text-on-surface-variant">/10</span>
              </p>
              <p className="font-label-md text-green-600 font-bold uppercase tracking-wider mt-1">
                Vượt mục tiêu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Split View Content */}
      <section className="flex-1 px-8 pb-8 flex gap-gutter overflow-hidden">
        {/* Left: Exam Review (Scrollable) */}
        <div className="flex-[1.5] flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
            <h3 className="font-headline-md text-headline-md flex items-center gap-2">
              <span className="material-symbols-outlined">description</span>
              Chi tiết bài làm
            </h3>
            <div className="flex gap-2">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-medium">
                8 Đúng
              </span>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-sm font-medium">
                2 Sai
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Question 1: Correct */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="font-label-md text-primary font-bold">
                  Câu 1: Cấu trúc dữ liệu Stack
                </span>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[12px] font-bold">
                  1.0 / 1.0 Điểm
                </span>
              </div>
              <p className="font-body-md text-on-surface">
                Giải thuật nào sau đây sử dụng nguyên tắc LIFO (Last In First
                Out)?
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-4 border border-outline-variant rounded-lg font-body-md">
                  A. Hàng đợi (Queue)
                </div>
                <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg font-body-md flex justify-between items-center">
                  <span>B. Ngăn xếp (Stack)</span>
                  <span className="material-symbols-outlined">
                    check_circle
                  </span>
                </div>
                <div className="p-4 border border-outline-variant rounded-lg font-body-md">
                  C. Danh sách liên kết đơn
                </div>
                <div className="p-4 border border-outline-variant rounded-lg font-body-md">
                  D. Cây nhị phân
                </div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-lg flex gap-2 items-start">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  info
                </span>
                <p className="text-sm text-on-surface-variant italic">
                  AI Nhận xét: Học sinh nắm vững kiến thức cơ bản về cấu trúc dữ
                  liệu tuyến tính.
                </p>
              </div>
            </div>

            <div className="h-px bg-outline-variant opacity-50"></div>

            {/* Question 2: Incorrect */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="font-label-md text-primary font-bold">
                  Câu 2: Độ phức tạp thuật toán
                </span>
                <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[12px] font-bold">
                  0.0 / 1.0 Điểm
                </span>
              </div>
              <p className="font-body-md text-on-surface">
                Độ phức tạp thời gian của thuật toán QuickSort trong trường hợp
                xấu nhất là gì?
              </p>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-4 border border-outline-variant rounded-lg font-body-md">
                  A. O(n log n)
                </div>
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg font-body-md flex justify-between items-center">
                  <span>B. O(n) — Lựa chọn của SV</span>
                  <span className="material-symbols-outlined">cancel</span>
                </div>
                <div className="p-4 border-2 border-green-500 rounded-lg font-body-md flex justify-between items-center">
                  <span className="font-bold">C. O(n²) — Đáp án đúng</span>
                  <span className="material-symbols-outlined text-green-600">
                    verified
                  </span>
                </div>
                <div className="p-4 border border-outline-variant rounded-lg font-body-md">
                  D. O(log n)
                </div>
              </div>
            </div>

            <div className="h-px bg-outline-variant opacity-50"></div>

            {/* Question 3: Coding Correct */}
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="font-label-md text-primary font-bold">
                  Câu 3: Triển khai thuật toán (Code)
                </span>
                <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[12px] font-bold">
                  2.5 / 2.5 Điểm
                </span>
              </div>
              <p className="font-body-md text-on-surface">
                Viết hàm tìm kiếm nhị phân trên một mảng đã sắp xếp.
              </p>
              <div className="bg-inverse-surface rounded-xl p-6 font-code-sm text-surface overflow-x-auto shadow-inner">
                <pre className="text-[#c3c0ff]">
                  <span className="text-secondary-fixed">int</span>{" "}
                  binarySearch(<span className="text-secondary-fixed">int</span>{" "}
                  arr[], <span className="text-secondary-fixed">int</span> n,{" "}
                  <span className="text-secondary-fixed">int</span> x) {"{\n"}
                  {"    "}
                  <span className="text-secondary-fixed">int</span> left ={" "}
                  <span className="text-primary-fixed">0</span>, right = n -{" "}
                  <span className="text-primary-fixed">1</span>;{"\n"}
                  {"    "}
                  <span className="text-on-secondary-container">
                    // AI marked: Perfect implementation
                  </span>
                  {"\n"}
                  {"    "}
                  <span className="text-secondary-fixed">while</span> (left
                  &lt;= right) {"{\n"}
                  {"        "}
                  <span className="text-secondary-fixed">int</span> mid = left +
                  (right - left) / <span className="text-primary-fixed">2</span>
                  ;{"\n"}
                  {"        "}
                  <span className="text-secondary-fixed">if</span> (arr[mid] ==
                  x) <span className="text-secondary-fixed">return</span> mid;
                  {"\n"}
                  {"        "}
                  <span className="text-secondary-fixed">if</span> (arr[mid]
                  &lt; x) left = mid +{" "}
                  <span className="text-primary-fixed">1</span>;{"\n"}
                  {"        "}
                  <span className="text-secondary-fixed">else</span> right = mid
                  - <span className="text-primary-fixed">1</span>;{"\n"}
                  {"    }"}
                  {"\n"}
                  {"    "}
                  <span className="text-secondary-fixed">return</span> -
                  <span className="text-primary-fixed">1</span>;{"\n"}
                  {"}"}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Anti-Cheat Logs & Trust Score */}
        <div className="flex-1 flex flex-col gap-gutter">
          {/* Trust Score Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-md text-headline-md">
                Chỉ số tin cậy
              </h3>
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-sm font-bold">
                88% (Cao)
              </span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-3 mb-6 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: "88%" }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low p-4 rounded-xl text-center">
                <p className="text-[20px] font-bold text-on-surface">3</p>
                <p className="text-[12px] text-on-surface-variant uppercase tracking-tight">
                  Cảnh báo
                </p>
              </div>
              <div className="bg-surface-container-low p-4 rounded-xl text-center">
                <p className="text-[20px] font-bold text-on-surface">0</p>
                <p className="text-[12px] text-on-surface-variant uppercase tracking-tight">
                  Vi phạm nặng
                </p>
              </div>
            </div>
          </div>

          {/* Anti-Cheat Logs (Timeline) */}
          <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl flex flex-col overflow-hidden shadow-sm">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <h3 className="font-headline-md text-headline-md flex items-center gap-2">
                <span className="material-symbols-outlined">security</span>
                Báo cáo hành vi
              </h3>
              <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">
                filter_list
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar relative">
              {/* Timeline Line */}
              <div className="absolute left-9 top-6 bottom-6 w-px bg-outline-variant border-dashed border-l"></div>

              {/* Log 1 */}
              <div className="relative flex gap-4 pl-10 hover:translate-x-1 transition-transform duration-200 ease-out">
                <div className="absolute left-[-1px] w-3 h-3 bg-primary rounded-full border-2 border-white translate-x-[-33%] top-2"></div>
                <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-code-sm text-primary font-bold">
                      14:20:05
                    </span>
                    <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] uppercase">
                      Cảnh báo nhẹ
                    </span>
                  </div>
                  <p className="font-label-md font-bold">
                    Chuyển tab trình duyệt
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    Hệ thống phát hiện SV rời khỏi tab thi trong 4 giây.
                  </p>
                </div>
              </div>

              {/* Log 2 */}
              <div className="relative flex gap-4 pl-10 hover:translate-x-1 transition-transform duration-200 ease-out">
                <div className="absolute left-[-1px] w-3 h-3 bg-secondary rounded-full border-2 border-white translate-x-[-33%] top-2"></div>
                <div className="flex-1 bg-surface-container-low p-3 rounded-xl border border-outline-variant">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-code-sm text-secondary font-bold">
                      14:25:30
                    </span>
                  </div>
                  <p className="font-label-md font-bold">Mất focus</p>
                  <p className="text-sm text-on-surface-variant">
                    Cửa sổ thi bị thu nhỏ hoặc không còn ở trạng thái active.
                  </p>
                </div>
              </div>

              {/* Log 3: AI Critical */}
              <div className="relative flex gap-4 pl-10 hover:translate-x-1 transition-transform duration-200 ease-out">
                <div className="absolute left-[-1px] w-4 h-4 bg-error rounded-full border-2 border-white translate-x-[-38%] top-1.5 shadow-sm"></div>
                <div className="flex-1 bg-error-container text-on-error-container p-3 rounded-xl border border-error/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-code-sm font-bold">14:32:10</span>
                    <span className="bg-error text-on-error px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                      Cảnh báo AI
                    </span>
                  </div>
                  <p className="font-label-md font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">
                      person_add
                    </span>
                    Nhận diện nhiều khuôn mặt
                  </p>
                  <p className="text-sm opacity-90 mb-2">
                    Camera phát hiện có thêm 01 người xuất hiện trong khung hình
                    phía sau SV.
                  </p>
                  <div className="w-full h-24 bg-black/10 rounded-lg flex items-center justify-center overflow-hidden border border-black/5">
                    <img
                      alt="AI Monitoring Snapshot"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBas4IvYbB5lZMjRxhU0BR5WolSqUWByqjvHnSFd3YiR_2jnR0t3RZDomtwLAidTImsBWWOsmvllskil5UtlsmH5MUkmBULmh8OswuZbc7R_e4ahZ935YUNxT9azIgoGW53S881bHQkdZlxXdf8LtY1nhDom6QJhk4mNzXejAbws7OnQTdGWeRoyZ_hqAAjnbURs-8ZsxrOqkBZ_B7XSb3fBNd5TjNPQAVMqlf7lgIbhFTOjIUSvQRcM2JQBEQ0FUNlG_I-RHGnzEgi"
                    />
                  </div>
                </div>
              </div>

              {/* Log 4 */}
              <div className="relative flex gap-4 pl-10 opacity-60 hover:translate-x-1 transition-transform duration-200 ease-out">
                <div className="absolute left-[-1px] w-3 h-3 bg-outline rounded-full border-2 border-white translate-x-[-33%] top-2"></div>
                <div className="flex-1 bg-surface-container-low p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-code-sm text-outline font-bold">
                      15:02:42
                    </span>
                  </div>
                  <p className="font-label-md font-bold">Hoàn thành bài thi</p>
                  <p className="text-sm text-on-surface-variant">
                    SV nộp bài thủ công.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface-container-low border-t border-outline-variant">
              <div className="flex gap-4">
                <button className="flex-1 bg-surface-container-lowest border border-outline-variant text-on-surface py-2 rounded-lg font-label-md hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[20px]">
                    videocam
                  </span>
                  Xem lại Video
                </button>
                <button className="flex-1 bg-primary text-on-primary py-2 rounded-lg font-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">
                    verified
                  </span>
                  Phê duyệt kết quả
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default ExamResultReportContent;
