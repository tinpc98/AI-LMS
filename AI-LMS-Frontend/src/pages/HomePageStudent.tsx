import React from "react";

const HomePageStudent = () => {
  return (
    <>
      <main className="md:ml-[280px] min-h-screen flex flex-col">
        {/* <!-- Page Content --> */}
        <div className="mt-16 p-4 md:p-8 max-w-[1280px] w-full mx-auto space-y-8">
          {/* <!-- Welcome Header --> */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-on-surface">
                Chào mừng trở lại, Minh Anh! 👋
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Bạn đã hoàn thành 85% mục tiêu học tập tuần này. Tiếp tục phát
                huy nhé!
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex -space-x-2">
                <img
                  alt="Student"
                  className="w-8 h-8 rounded-full border-2 border-surface"
                  data-alt="Close-up portrait of a diverse female student with a warm, encouraging smile, set against a blurred academic background with soft morning sunlight filtering through library windows. The image style is professional and high-key, aligning with a modern educational aesthetic."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkQFxlJRTq8GL9fEZbHjA7Hc3jgJXxkKh1syAgR1lbJ4LHb6gEmXTueRbg4z90fzPh5dW1BCO886wPgWR-14JDQ4YcFII_wf3ScBfMuhxIv-6ZvZBY8JvqS4ejzaByjOs20chmkZ9jtycHZ-gRbauxuTQ2CN-nlhCbtaCiwtiugSZ0KscDgbQ23FSJoH_b8hvNXk3Ul3tQQR2xliBOyMYXAHeisMuZPZ6_3O6s7DHwA4j4cwbe4Y3OHwc7wLja71jezmhLsWWSUrtq"
                />
                <img
                  alt="Student"
                  className="w-8 h-8 rounded-full border-2 border-surface"
                  data-alt="A focused young male student wearing modern spectacles, looking thoughtfully at a digital tablet, illuminated by a clean blueish screen light in a minimalist study space. The overall color palette is composed of cool grays and soft blues to maintain professional LMS visual consistency."
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVNNzlGhy-GGItcerFxHk-epZGSAkBK1agzSvWs0mQJQd3cFAJxOn2qR-UcnymQJvT3f3dWfahGjZLN_Gb4FAnJ32kY79JW6MofSaohYHr3KeR6KfQM6o7u00zWrZXBXzocMcES_hS8YCw1zMpeTnWegTbOCuh3SbOy2HCGmwe4kYrWZzDU9ZPWVFKKxvlTo03haIlWcByJeBvDXWaa7oLbT1mjgUWLXCVJ4ge656MyWrUiJpwOFLZPKJYkXESAOVp6bYyIyVltXY9"
                />
                <div className="w-8 h-8 rounded-full border-2 border-surface bg-secondary-container flex items-center justify-center text-[10px] font-bold text-primary">
                  +12
                </div>
              </div>
              <p className="text-xs text-on-surface-variant self-center font-medium">
                Bạn học cùng đang trực tuyến
              </p>
            </div>
          </section>
          {/* <!-- Analytics Dashboard --> */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* <!-- Card 1: Tiến độ học tập --> */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex items-center justify-between hover:shadow-lg transition-all duration-300">
              <div className="space-y-1">
                <p className="text-on-surface-variant text-sm font-medium">
                  Tiến độ học tập
                </p>
                <h3 className="text-3xl font-bold text-on-surface">78%</h3>
                <p className="text-xs text-success flex items-center gap-1 text-green-600">
                  <span className="material-symbols-outlined text-sm">
                    trending_up
                  </span>
                  +5% so với tháng trước
                </p>
              </div>
              <div className="relative w-20 h-20">
                <svg className="w-full h-full">
                  <circle
                    className="text-surface-container-high"
                    cx="40"
                    cy="40"
                    fill="transparent"
                    r="32"
                    stroke="currentColor"
                    stroke-width="8"
                  ></circle>
                  <circle
                    className="text-primary progress-ring__circle"
                    cx="40"
                    cy="40"
                    fill="transparent"
                    r="32"
                    stroke="currentColor"
                    stroke-dasharray="201"
                    stroke-dashoffset="44"
                    stroke-linecap="round"
                    stroke-width="8"
                  ></circle>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
                  78%
                </span>
              </div>
            </div>
            {/* <!-- Card 2: Điểm số --> */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex flex-col justify-between hover:shadow-lg transition-all duration-300">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <p className="text-on-surface-variant text-sm font-medium">
                    Điểm trung bình (GPA)
                  </p>
                  <h3 className="text-3xl font-bold text-on-surface">8.4</h3>
                </div>
                <div className="p-2 bg-secondary-container/50 rounded-lg">
                  <span className="material-symbols-outlined text-primary">
                    analytics
                  </span>
                </div>
              </div>
              <div className="mt-4 h-12 flex items-end gap-1">
                {/* <!-- Mock Sparkline --> */}
                <div
                  className="flex-1 bg-primary/20 rounded-t-sm"
                  style={{ height: "40%" }}
                ></div>
                <div
                  className="flex-1 bg-primary/30 rounded-t-sm"
                  style={{ height: "60%" }}
                ></div>
                <div
                  className="flex-1 bg-primary/40 rounded-t-sm"
                  style={{ height: "55%" }}
                ></div>
                <div
                  className="flex-1 bg-primary/60 rounded-t-sm"
                  style={{ height: "80%" }}
                ></div>
                <div
                  className="flex-1 bg-primary/80 rounded-t-sm"
                  style={{ height: "70%" }}
                ></div>
                <div
                  className="flex-1 bg-primary rounded-t-sm"
                  style={{ height: "100%" }}
                ></div>
              </div>
            </div>
            {/* <!-- Card 3: Kỹ năng cần cải thiện --> */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl hover:shadow-lg transition-all duration-300">
              <p className="text-on-surface-variant text-sm font-medium mb-4">
                Kỹ năng cần cải thiện
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body-md">
                    Giải thuật tìm kiếm
                  </span>
                  <span className="px-2 py-1 bg-error-container text-error text-[10px] font-bold rounded">
                    Cần luyện tập
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full">
                  <div className="bg-error w-1/3 h-full rounded-full"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-body-md">
                    Kiến trúc Vi xử lý
                  </span>
                  <span className="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded">
                    Đang học
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-1.5 rounded-full">
                  <div className="bg-primary/50 w-1/2 h-full rounded-full"></div>
                </div>
              </div>
            </div>
          </section>
          {/* <!-- AI Features & To-Do Layout --> */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* <!-- AI Features Widget --> */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    auto_awesome
                  </span>
                  Trợ lý AI Scholar
                </h3>
                <a
                  className="text-primary text-sm font-bold hover:underline"
                  href="#"
                >
                  Khám phá tất cả
                </a>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="ai-gradient-border p-6 rounded-3xl group cursor-pointer hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span
                      className="material-symbols-outlined text-primary text-3xl"
                      style={{
                        fontVariationSettings: '"FILL" 1',
                      }}
                    >
                      smart_toy
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">AI Chatbot</h4>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Hỏi đáp kiến thức 24/7, giải bài tập và giải thích khái niệm
                    phức tạp.
                  </p>
                  <button className="flex items-center gap-2 text-primary font-bold text-sm">
                    Bắt đầu hỏi
                    <span className="material-symbols-outlined text-sm">
                      arrow_forward
                    </span>
                  </button>
                </div>
                <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl group cursor-pointer hover:border-primary/50 hover:-translate-y-1 transition-all">
                  <div className="w-12 h-12 bg-secondary-container/50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-primary text-3xl">
                      auto_stories
                    </span>
                  </div>
                  <h4 className="font-bold text-lg mb-2">AI Summary</h4>
                  <p className="text-sm text-on-surface-variant mb-4">
                    Tóm tắt nội dung bài giảng, video và tài liệu dài chỉ trong
                    vài giây.
                  </p>
                  <button className="flex items-center gap-2 text-primary font-bold text-sm">
                    Tải tài liệu lên
                    <span className="material-symbols-outlined text-sm">
                      upload_file
                    </span>
                  </button>
                </div>
              </div>
              <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10 relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-bold text-xl mb-2 text-primary">
                    Lộ trình học tập cá nhân hóa
                  </h4>
                  <p className="text-on-surface-variant max-w-md text-sm leading-relaxed">
                    AI đã phân tích kết quả bài thi hôm qua và đề xuất 3 bài
                    luyện tập mới để củng cố kiến thức về Hệ điều hành.
                  </p>
                  <button className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all active:scale-95">
                    Xem lộ trình mới
                  </button>
                </div>
                <span className="material-symbols-outlined absolute -right-8 -bottom-8 text-primary/10 text-[200px] select-none">
                  insights
                </span>
              </div>
            </div>
            {/* <!-- To-Do / Upcoming Section --> */}
            <div className="space-y-6">
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Việc cần làm
              </h3>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden divide-y divide-outline-variant">
                {/* <!-- Task Item --> */}
                <div className="p-4 hover:bg-surface-container-low transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <span className="material-symbols-outlined text-primary">
                        event_note
                      </span>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        Bài tập: Giải thuật sắp xếp
                      </h5>
                      <p className="text-xs text-on-surface-variant mb-3">
                        Môn: Cấu trúc dữ liệu &amp; Giải thuật
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-error-container text-error rounded text-[10px] font-bold uppercase">
                          <span className="material-symbols-outlined text-[12px]">
                            schedule
                          </span>
                          Còn 2 giờ
                        </div>
                        <button className="text-[10px] font-bold text-primary uppercase hover:underline">
                          Nộp bài
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <!-- Task Item --> */}
                <div className="p-4 hover:bg-surface-container-low transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-amber-500">
                      <span className="material-symbols-outlined">quiz</span>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        Kiểm tra: Database Design
                      </h5>
                      <p className="text-xs text-on-surface-variant mb-3">
                        Môn: Hệ quản trị CSDL
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold uppercase">
                          <span className="material-symbols-outlined text-[12px]">
                            calendar_today
                          </span>
                          Ngày mai
                        </div>
                        <button className="text-[10px] font-bold text-on-surface-variant uppercase hover:underline">
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {/* <!-- Task Item --> */}
                <div className="p-4 hover:bg-surface-container-low transition-colors group">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 text-green-600">
                      <span className="material-symbols-outlined">
                        assignment
                      </span>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                        Lab 4: Linux Commands
                      </h5>
                      <p className="text-xs text-on-surface-variant mb-3">
                        Môn: Hệ điều hành
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold uppercase">
                          <span className="material-symbols-outlined text-[12px]">
                            calendar_today
                          </span>
                          3 ngày nữa
                        </div>
                        <button className="text-[10px] font-bold text-on-surface-variant uppercase hover:underline">
                          Chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button className="w-full py-4 border-2 border-dashed border-outline-variant rounded-2xl text-on-surface-variant font-bold text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">add_task</span>
                Thêm việc mới
              </button>
            </div>
          </section>
        </div>
        {/* <!-- Mobile Bottom Nav (Suppressed for desktop via side nav) --> */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-outline-variant flex justify-around items-center h-16 px-2 z-40">
          <a className="flex flex-col items-center gap-1 text-primary" href="#">
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: '"FILL" 1',
              }}
            >
              dashboard
            </span>
            <span className="text-[10px] font-bold">Trang chủ</span>
          </a>
          <a
            className="flex flex-col items-center gap-1 text-on-surface-variant"
            href="#"
          >
            <span className="material-symbols-outlined">school</span>
            <span className="text-[10px]">Lớp học</span>
          </a>
          <a
            className="flex flex-col items-center gap-1 text-on-surface-variant"
            href="#"
          >
            <span className="material-symbols-outlined">edit_note</span>
            <span className="text-[10px]">Bài tập</span>
          </a>
          <a
            className="flex flex-col items-center gap-1 text-on-surface-variant"
            href="#"
          >
            <span className="material-symbols-outlined">forum</span>
            <span className="text-[10px]">Nhắn tin</span>
          </a>
        </nav>
      </main>
    </>
  );
};

export default HomePageStudent;
