import React from "react";

const LessonManagementContent = () => {
  return (
    <>
      <main className="ml-[280px] mt-16 p-margin-desktop min-h-screen">
        <div className="max-w-max-content-width mx-auto">
          {/* Page Header */}
          <section className="mb-8">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Quản lý bài giảng
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Quản lý và tổ chức các tài liệu học tập cho các lớp học của bạn.
              Sử dụng công cụ AI để tối ưu hóa lộ trình giảng dạy.
            </p>
          </section>

          {/* Filter Bar & AI Pulse Indicator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button className="px-4 py-2 rounded-full font-label-md text-label-md bg-primary text-white shadow-sm transition-all">
                Tất cả
              </button>
              <button className="px-4 py-2 rounded-full font-label-md text-label-md bg-white border border-outline-variant text-secondary hover:border-primary hover:text-primary transition-all">
                Video
              </button>
              <button className="px-4 py-2 rounded-full font-label-md text-label-md bg-white border border-outline-variant text-secondary hover:border-primary hover:text-primary transition-all">
                Tài liệu PDF
              </button>
              <button className="px-4 py-2 rounded-full font-label-md text-label-md bg-white border border-outline-variant text-secondary hover:border-primary hover:text-primary transition-all">
                Bản nháp
              </button>
            </div>
            <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              <span className="font-label-md text-label-md text-primary">
                AI đang phân tích hiệu quả bài giảng
              </span>
            </div>
          </div>

          {/* Bento Grid - Grouped Lessons */}
          <div className="space-y-12">
            {/* Group: Lớp 10A1 - Toán học */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-2">
                <span
                  className="material-symbols-outlined text-primary"
                  data-icon="menu_book"
                >
                  menu_book
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Lớp 10A1 - Toán học
                </h3>
                <span className="font-label-md text-label-md bg-surface-container px-2 py-0.5 rounded text-secondary">
                  2 bài giảng
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Lesson 1: Video */}
                <div className="group bg-white border border-outline-variant rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col">
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      data-alt="A cinematic educational video thumbnail for a high school math lesson about linear functions."
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZTHu3mVvIkDzo8oItu-7M4-ya2OB_rmUMAYzR2TM8TFqtTuKKdB8YzcadaBMPbqweFWt2bf8jwbt4DB9gx3uqmUdx3i4RdKCnxmhmkvvdF9IEqmRfbchdBtpwSGYk8_t3GzkjPTttC85p2d2IAiq5Xmm92OHzScaw2jTK1799DD_e5L4xcYuO8PDM5lIUU8_40f6GcEeDhA9mUTg7J2_xSMlWwcNcekVhFSFhL0FEZc3JVohkFverSAlnhtkLrp0H7z5yAwn0j-XE"
                      alt="Thumbnail"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-primary shadow-lg group-hover:scale-110 transition-transform">
                        <span
                          className="material-symbols-outlined text-3xl"
                          data-icon="play_arrow"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          play_arrow
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary">
                      Video
                    </div>
                  </div>
                  <div className="p-5 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-label-md text-body-md font-semibold text-on-surface line-clamp-1">
                        Hàm số bậc nhất
                      </h4>
                      <span className="bg-green-50 text-green-700 text-[11px] font-bold px-2 py-1 rounded border border-green-100 uppercase">
                        Đã xuất bản
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-secondary mb-4">
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-sm"
                          data-icon="calendar_today"
                        >
                          calendar_today
                        </span>
                        <span className="text-[12px]">12/10/2023</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-sm"
                          data-icon="visibility"
                        >
                          visibility
                        </span>
                        <span className="text-[12px]">245 lượt xem</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                      <button className="flex-1 py-2 bg-surface-container-low text-primary rounded-lg font-label-md text-label-md hover:bg-primary hover:text-white transition-colors">
                        Chỉnh sửa
                      </button>
                      <button className="p-2 text-secondary hover:bg-slate-100 rounded-lg transition-colors">
                        <span
                          className="material-symbols-outlined"
                          data-icon="more_vert"
                        >
                          more_vert
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Lesson 2: PDF */}
                <div className="group bg-white border border-outline-variant rounded-xl p-5 hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-indigo-50 text-primary rounded-lg flex items-center justify-center">
                        <span
                          className="material-symbols-outlined"
                          data-icon="description"
                        >
                          description
                        </span>
                      </div>
                      <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-1 rounded border border-slate-200 uppercase">
                        Bản nháp
                      </span>
                    </div>
                    <h4 className="font-label-md text-body-md font-semibold text-on-surface mb-2">
                      Bài tập tập hợp
                    </h4>
                    <p className="text-secondary text-body-sm line-clamp-2 mb-4">
                      Tài liệu bổ trợ kiến thức về các phép toán tập hợp, bao
                      gồm 20 bài tập tự luận và trắc nghiệm.
                    </p>
                    <div className="flex items-center gap-4 text-secondary mb-6">
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-sm"
                          data-icon="history"
                        >
                          history
                        </span>
                        <span className="text-[12px]">
                          Cập nhật 2 giờ trước
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-sm"
                          data-icon="attachment"
                        >
                          attachment
                        </span>
                        <span className="text-[12px]">2.4 MB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex-1 py-2 bg-primary text-white rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors">
                      Tiếp tục soạn
                    </button>
                    <button className="p-2 border border-outline-variant text-secondary hover:bg-slate-50 rounded-lg transition-colors">
                      <span
                        className="material-symbols-outlined"
                        data-icon="preview"
                      >
                        preview
                      </span>
                    </button>
                    <button className="p-2 border border-outline-variant text-error hover:bg-error-container/10 rounded-lg transition-colors">
                      <span
                        className="material-symbols-outlined"
                        data-icon="delete"
                      >
                        delete
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Group: Lớp 12B2 - Vật lý */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-2">
                <span
                  className="material-symbols-outlined text-primary"
                  data-icon="science"
                >
                  science
                </span>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  Lớp 12B2 - Vật lý
                </h3>
                <span className="font-label-md text-label-md bg-surface-container px-2 py-0.5 rounded text-secondary">
                  1 bài giảng
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Lesson 1: Video */}
                <div className="group bg-white border border-outline-variant rounded-xl overflow-hidden hover:shadow-md hover:border-primary/30 transition-all duration-300 flex flex-col">
                  <div className="h-40 bg-slate-100 relative overflow-hidden">
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      data-alt="A high-quality educational physics video thumbnail depicting simple harmonic motion."
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjdk_xGI3hfoa-qBcBpPeElHmBHqP5E-4b34wT6CwElk4xRKB1wPHMgTIbRclKel0ivQk7d6dXeD53KFb1g3ONCkMPIyix3ilG9fFiMXh_DFUE0ikXfl2N2gGd_l2TPhqh78datuvemGhzx0-0JOjGApculIL7CTM0lRt3FjS4RjC_mf7pKDvRtuf6AUALQx2r0k7yky8oE_yvqtK497br-IiikgQADUle031Cr8GGz1I39Qnc0uMikA4IvvWvRjKtyhaX1NDT8TeY"
                      alt="Thumbnail"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-primary shadow-lg group-hover:scale-110 transition-transform">
                        <span
                          className="material-symbols-outlined text-3xl"
                          data-icon="play_arrow"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          play_arrow
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-primary">
                      Video
                    </div>
                  </div>
                  <div className="p-5 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-label-md text-body-md font-semibold text-on-surface line-clamp-1">
                        Dao động điều hòa
                      </h4>
                      <span className="bg-green-50 text-green-700 text-[11px] font-bold px-2 py-1 rounded border border-green-100 uppercase">
                        Đã xuất bản
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-secondary mb-4">
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-sm"
                          data-icon="calendar_today"
                        >
                          calendar_today
                        </span>
                        <span className="text-[12px]">08/10/2023</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="material-symbols-outlined text-sm"
                          data-icon="analytics"
                        >
                          analytics
                        </span>
                        <span className="text-[12px]">Độ hoàn thành 82%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-4 border-t border-slate-50">
                      <button className="flex-1 py-2 bg-surface-container-low text-primary rounded-lg font-label-md text-label-md hover:bg-primary hover:text-white transition-colors">
                        Chỉnh sửa
                      </button>
                      <button className="p-2 text-secondary hover:bg-slate-100 rounded-lg transition-colors">
                        <span
                          className="material-symbols-outlined"
                          data-icon="share"
                        >
                          share
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State Contextual Hint (Minimalist) */}
          <div className="mt-20 py-12 border-2 border-dashed border-outline-variant rounded-2xl flex flex-col items-center text-center px-6">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4 text-primary">
              <span
                className="material-symbols-outlined text-4xl"
                data-icon="auto_awesome"
              >
                auto_awesome
              </span>
            </div>
            <h4 className="font-headline-md text-on-surface mb-2">
              Tạo bài giảng bằng AI?
            </h4>
            <p className="text-on-surface-variant text-body-md max-w-md mb-6">
              EduPortal có thể giúp bạn tạo đề cương bài giảng và slide tự động
              từ một chủ đề hoặc tệp PDF gốc.
            </p>
            <button className="flex items-center gap-2 text-primary font-bold hover:underline">
              Thử nghiệm công cụ soạn thảo AI
              <span
                className="material-symbols-outlined"
                data-icon="arrow_forward"
              >
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Contextual FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined text-2xl" data-icon="add">
          add
        </span>
        <span className="absolute right-16 bg-inverse-surface text-inverse-on-surface px-3 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Tạo nhanh bài giảng
        </span>
      </button>
    </>
  );
};

export default LessonManagementContent;
