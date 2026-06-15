import React from "react";

export default function HomePageTeacher() {
  return (
    <main className="md:ml-[280px] p-margin-desktop max-w-max-content-width mx-auto">
      {/* Welcome Header */}
      <div className="mb-10">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">
          Chào buổi sáng, Thầy A
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Dưới đây là tóm tắt hoạt động giảng dạy của bạn trong ngày hôm nay.
        </p>
      </div>

      {/* Analytics Section: Bento Grid Style */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Analytics Card 1 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">school</span>
            </div>
            <span className="flex items-center text-emerald-600 text-body-sm font-bold gap-1 bg-emerald-50 px-2 py-1 rounded">
              <span className="material-symbols-outlined text-[18px]">
                trending_up
              </span>
              +0.4
            </span>
          </div>
          <h3 className="font-label-md text-label-md text-on-surface-variant">
            Điểm trung bình lớp
          </h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-lg text-headline-lg font-bold">
              8.5
            </span>
            <span className="font-body-sm text-on-surface-variant">/ 10.0</span>
          </div>
          <div className="mt-4 h-1 w-full bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[85%]"></div>
          </div>
        </div>

        {/* Analytics Card 2 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary/10 rounded-lg text-secondary">
              <span className="material-symbols-outlined">task_alt</span>
            </div>
            <div className="relative flex items-center justify-center w-12 h-12">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  className="text-surface-container"
                  cx="24"
                  cy="24"
                  fill="transparent"
                  r="20"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <circle
                  className="text-secondary"
                  cx="24"
                  cy="24"
                  fill="transparent"
                  r="20"
                  stroke="currentColor"
                  strokeDasharray="125.6"
                  strokeDashoffset="10"
                  strokeWidth="4"
                ></circle>
              </svg>
              <span className="absolute text-[10px] font-bold">92%</span>
            </div>
          </div>
          <h3 className="font-label-md text-label-md text-on-surface-variant">
            Tỷ lệ hoàn thành bài tập
          </h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-lg text-headline-lg font-bold">
              92%
            </span>
            <span className="font-body-sm text-on-surface-variant text-emerald-600">
              Ổn định
            </span>
          </div>
        </div>

        {/* Analytics Card 3 */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 hover:shadow-md transition-all group overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-tertiary/10 rounded-lg text-tertiary">
              <span className="material-symbols-outlined">query_stats</span>
            </div>
            <div className="flex gap-1 items-end h-10">
              <div className="w-2 bg-primary/20 rounded-t h-4"></div>
              <div className="w-2 bg-primary/40 rounded-t h-6"></div>
              <div className="w-2 bg-primary/30 rounded-t h-5"></div>
              <div className="w-2 bg-primary/60 rounded-t h-8"></div>
              <div className="w-2 bg-primary rounded-t h-10"></div>
            </div>
          </div>
          <h3 className="font-label-md text-label-md text-on-surface-variant">
            Tỷ lệ tham gia học
          </h3>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-headline-lg text-headline-lg font-bold">
              95%
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="font-body-sm text-emerald-600">Trực tuyến</span>
            </span>
          </div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="mb-10">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-6">
          Thao tác nhanh
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button className="active:scale-95 ai-glow group relative flex items-center justify-between p-8 bg-primary text-on-primary rounded-2xl overflow-hidden transition-all hover:scale-[1.02] shadow-lg">
            <div className="z-10 text-left">
              <p className="font-headline-md text-headline-md mb-1">
                Tạo lớp học
              </p>
              <p className="font-body-sm opacity-80">
                Thiết lập môi trường học mới
              </p>
            </div>
            <span className="material-symbols-outlined text-[64px] opacity-20 group-hover:scale-110 transition-transform">
              add_business
            </span>
          </button>

          <button className="active:scale-95 ai-glow group relative flex items-center justify-between p-8 bg-secondary text-on-secondary rounded-2xl overflow-hidden transition-all hover:scale-[1.02] shadow-lg">
            <div className="z-10 text-left">
              <p className="font-headline-md text-headline-md mb-1">
                Tạo bài tập
              </p>
              <p className="font-body-sm opacity-80">
                Giao nhiệm vụ cho sinh viên
              </p>
            </div>
            <span className="material-symbols-outlined text-[64px] opacity-20 group-hover:scale-110 transition-transform">
              edit_document
            </span>
          </button>

          <button className="active:scale-95 ai-glow group relative flex items-center justify-between p-8 bg-tertiary-container text-on-tertiary-container rounded-2xl overflow-hidden transition-all hover:scale-[1.02] shadow-lg">
            <div className="z-10 text-left">
              <p className="font-headline-md text-headline-md mb-1">
                Tạo đề thi
              </p>
              <p className="font-body-sm opacity-80">
                Kiểm tra đánh giá năng lực
              </p>
            </div>
            <span className="material-symbols-outlined text-[64px] opacity-20 group-hover:scale-110 transition-transform">
              assignment_turned_in
            </span>
          </button>
        </div>
      </section>

      {/* Active Classes Table */}
      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
          <h3 className="font-headline-md text-headline-md text-on-surface">
            Lớp học đang hoạt động
          </h3>
          <button className="text-primary font-label-md text-label-md flex items-center gap-1 hover:underline active:scale-95">
            Xem tất cả{" "}
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                  Tên lớp học
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                  Sĩ số
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                  Tiến độ
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant">
                  Bài học tiếp theo
                </th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Row 1 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">
                        functions
                      </span>
                    </div>
                    <span className="font-label-md text-on-surface font-bold">
                      Lớp 10A1 - Toán học
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 font-body-md">45 học sinh</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-grow bg-surface-container h-2 rounded-full overflow-hidden w-24">
                      <div className="bg-primary h-full w-[65%]"></div>
                    </div>
                    <span className="text-body-sm font-bold">65%</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[12px] rounded-full">
                    Thứ 2, 08:00 AM
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-on-secondary rounded-lg font-label-md text-label-md transition-all active:scale-95">
                    Điểm danh
                  </button>
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-secondary/10 flex items-center justify-center text-secondary">
                      <span className="material-symbols-outlined">
                        computer
                      </span>
                    </div>
                    <span className="font-label-md text-on-surface font-bold">
                      Lớp 11B2 - Tin học
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 font-body-md">38 học sinh</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-grow bg-surface-container h-2 rounded-full overflow-hidden w-24">
                      <div className="bg-secondary h-full w-[42%]"></div>
                    </div>
                    <span className="text-body-sm font-bold">42%</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[12px] rounded-full">
                    Thứ 3, 10:15 AM
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-on-secondary rounded-lg font-label-md text-label-md transition-all active:scale-95">
                    Điểm danh
                  </button>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-surface-container-low transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-tertiary/10 flex items-center justify-center text-tertiary">
                      <span className="material-symbols-outlined">science</span>
                    </div>
                    <span className="font-label-md text-on-surface font-bold">
                      Lớp 12C3 - Vật lý
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5 font-body-md">42 học sinh</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-grow bg-surface-container h-2 rounded-full overflow-hidden w-24">
                      <div className="bg-tertiary h-full w-[88%]"></div>
                    </div>
                    <span className="text-body-sm font-bold">88%</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-3 py-1 bg-surface-container text-on-surface-variant text-[12px] rounded-full">
                    Thứ 4, 01:30 PM
                  </span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="px-4 py-2 bg-secondary/10 text-secondary hover:bg-secondary hover:text-on-secondary rounded-lg font-label-md text-label-md transition-all active:scale-95">
                    Điểm danh
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 bg-surface-container-low/30 border-t border-outline-variant flex justify-center">
          <nav className="flex items-center gap-2">
            <button
              className="p-2 hover:bg-surface-container rounded-lg disabled:opacity-30 active:scale-95"
              disabled
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center bg-primary text-on-primary rounded-lg font-bold active:scale-95">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-lg active:scale-95">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded-lg active:scale-95">
              3
            </button>
            <button className="p-2 hover:bg-surface-container rounded-lg active:scale-95">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </nav>
        </div>
      </section>
    </main>
  );
}
