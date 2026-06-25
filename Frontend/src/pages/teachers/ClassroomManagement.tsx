import React from "react";

const ClassManagementContent = () => {
  return (
    <main className="ml-[280px] flex-1 flex flex-col relative min-w-0 pt-16">
      {/* Content Canvas */}
      <div className="p-margin-desktop max-w-max-content-width mx-auto w-full">
        {/* Page Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">
              Quản lý lớp học
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Theo dõi và quản lý hiệu suất giảng dạy trong học kỳ này.
            </p>
          </div>
          <button className="bg-primary text-on-primary px-6 py-3 rounded-xl flex items-center gap-2 font-label-md text-label-md shadow-sm hover:shadow-md transition-all active:scale-95">
            <span className="material-symbols-outlined">add_circle</span>
            Tạo lớp học mới
          </button>
        </div>

        {/* Filters Area */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface-variant">
              filter_list
            </span>
            <span className="font-label-md text-label-md text-on-surface">
              Bộ lọc:
            </span>
          </div>
          <select className="bg-surface border-outline-variant rounded-lg font-label-md text-label-md px-4 py-2 focus:ring-primary focus:border-primary">
            <option>Học kỳ 1 (2023-2024)</option>
            <option>Học kỳ 2 (2023-2024)</option>
            <option>Tất cả học kỳ</option>
          </select>
          <select className="bg-surface border-outline-variant rounded-lg font-label-md text-label-md px-4 py-2 focus:ring-primary focus:border-primary">
            <option>Trạng thái: Đang hoạt động</option>
            <option>Trạng thái: Đã kết thúc</option>
            <option>Tất cả trạng thái</option>
          </select>
          <div className="ml-auto text-on-surface-variant font-body-sm text-body-sm italic">
            Hiển thị 6 lớp học
          </div>
        </div>

        {/* Class Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {/* Card 1 */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-primary-container hover:shadow-lg transition-all group">
            <div className="h-32 bg-primary-container relative">
              <div className="absolute inset-0 opacity-20 pointer-events-none"></div>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-label-md text-xs">
                Active
              </div>
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-label-md text-xs uppercase tracking-wider opacity-80">
                  MATH-10A1-XQ
                </p>
                <h3 className="text-white font-headline-md text-lg">
                  Lớp 10A1 - Toán học
                </h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    groups
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Sĩ số
                    </p>
                    <p className="font-label-md text-on-surface">42 học sinh</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    calendar_today
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Lịch học
                    </p>
                    <p className="font-label-md text-on-surface">
                      Thứ 2, Thứ 4
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Tiến độ giáo trình
                  </span>
                  <span className="font-code-sm text-code-sm text-primary">
                    65%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[65%] rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">
                  Vào lớp
                </button>
                <button className="p-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-primary-container hover:shadow-lg transition-all group">
            <div className="h-32 bg-secondary-container relative">
              <div className="absolute inset-0 opacity-20 pointer-events-none"></div>
              <div className="absolute top-4 right-4 bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-on-secondary-container font-label-md text-xs">
                Active
              </div>
              <div className="absolute bottom-4 left-4">
                <p className="text-on-secondary-container font-label-md text-xs uppercase tracking-wider opacity-80">
                  PHYS-12B2-ADV
                </p>
                <h3 className="text-on-secondary-container font-headline-md text-lg">
                  Lớp 12B2 - Vật Lý
                </h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    groups
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Sĩ số
                    </p>
                    <p className="font-label-md text-on-surface">38 học sinh</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    calendar_today
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Lịch học
                    </p>
                    <p className="font-label-md text-on-surface">
                      Thứ 3, Thứ 6
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Tiến độ giáo trình
                  </span>
                  <span className="font-code-sm text-code-sm text-primary">
                    82%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[82%] rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">
                  Vào lớp
                </button>
                <button className="p-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-primary-container hover:shadow-lg transition-all group">
            <div className="h-32 bg-tertiary-container relative">
              <div className="absolute inset-0 opacity-10 pointer-events-none"></div>
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-label-md text-xs">
                Active
              </div>
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-label-md text-xs uppercase tracking-wider opacity-80">
                  CHEM-11A5-ST
                </p>
                <h3 className="text-white font-headline-md text-lg">
                  Lớp 11A5 - Hóa học
                </h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    groups
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Sĩ số
                    </p>
                    <p className="font-label-md text-on-surface">45 học sinh</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    calendar_today
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Lịch học
                    </p>
                    <p className="font-label-md text-on-surface">
                      Thứ 5, Thứ 7
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Tiến độ giáo trình
                  </span>
                  <span className="font-code-sm text-code-sm text-primary">
                    30%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[30%] rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">
                  Vào lớp
                </button>
                <button className="p-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden hover:border-primary-container hover:shadow-lg transition-all group">
            <div className="h-32 bg-primary relative">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-label-md text-xs">
                Active
              </div>
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-label-md text-xs uppercase tracking-wider opacity-80">
                  BIO-10C1-BS
                </p>
                <h3 className="text-white font-headline-md text-lg">
                  Lớp 10C1 - Sinh học
                </h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    groups
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Sĩ số
                    </p>
                    <p className="font-label-md text-on-surface">40 học sinh</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    calendar_today
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Lịch học
                    </p>
                    <p className="font-label-md text-on-surface">
                      Thứ 4, Thứ 6
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Tiến độ giáo trình
                  </span>
                  <span className="font-code-sm text-code-sm text-primary">
                    48%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[48%] rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity">
                  Vào lớp
                </button>
                <button className="p-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined">settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 5 (Ended State example) */}
          <div className="bg-surface border border-outline-variant rounded-xl overflow-hidden grayscale-[0.6] opacity-80 hover:grayscale-0 hover:opacity-100 transition-all group">
            <div className="h-32 bg-outline relative">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white font-label-md text-xs">
                Ended
              </div>
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-label-md text-xs uppercase tracking-wider opacity-80">
                  HIST-12D3-OLD
                </p>
                <h3 className="text-white font-headline-md text-lg">
                  Lớp 12D3 - Lịch sử
                </h3>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    groups
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Sĩ số
                    </p>
                    <p className="font-label-md text-on-surface">35 học sinh</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">
                    calendar_today
                  </span>
                  <div>
                    <p className="text-[10px] text-on-surface-variant uppercase font-bold">
                      Lịch học
                    </p>
                    <p className="font-label-md text-on-surface">Hoàn thành</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Tiến độ giáo trình
                  </span>
                  <span className="font-code-sm text-code-sm text-success">
                    100%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[100%] rounded-full shadow-[0_0_8px_rgba(79,70,229,0.4)]"></div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button className="flex-1 border border-primary text-primary py-2.5 rounded-lg font-label-md text-label-md hover:bg-primary/5 transition-colors">
                  Xem báo cáo
                </button>
                <button className="p-2.5 border border-outline-variant text-on-surface-variant rounded-lg hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined">archive</span>
                </button>
              </div>
            </div>
          </div>

          {/* Add New Class Card */}
          <div className="border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-8 gap-4 hover:border-primary hover:bg-primary-container/5 transition-all cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl">add</span>
            </div>
            <div className="text-center">
              <p className="font-headline-md text-lg text-on-surface">
                Thêm lớp học mới
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant px-4">
                Tạo không gian học tập mới và bắt đầu bài giảng của bạn.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Quick Action for AI insights (Contextual) */}
      <button className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined">auto_awesome</span>
        <div className="absolute right-16 bg-on-surface text-white font-label-md text-xs py-2 px-4 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
          AI Suggestion: Class Optimization
        </div>
      </button>
    </main>
  );
};

export default ClassManagementContent;
