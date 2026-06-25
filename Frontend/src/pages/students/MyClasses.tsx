import React from "react";

const MyClassesContent = () => {
  return (
    <main className="ml-[280px] min-h-screen flex flex-col pt-8">
      {/* Content Canvas */}
      <div className="p-margin-desktop max-w-max-content-width mx-auto w-full flex-1">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Lớp học của tôi
            </h2>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'opsz' 20" }}
              >
                info
              </span>
              <p className="font-body-md text-body-md">
                Bạn có <span className="font-bold text-primary">4 lớp học</span>{" "}
                đang diễn ra trong học kỳ này.
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex p-1 bg-surface-container rounded-xl">
            <button className="px-6 py-2 rounded-lg bg-surface-container-lowest text-primary font-bold shadow-sm transition-all text-label-md">
              Đang học
            </button>
            <button className="px-6 py-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-all text-label-md">
              Đã hoàn thành
            </button>
          </div>
        </div>

        {/* Class Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {/* Card 1: Math */}
          <div className="glass-card rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-outline-variant hover:border-primary-container/30">
            <div className="h-40 relative overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBhbEkoHvrsCTB7ST1zlXzRbepF8dIvQjtTaSrmIYWTPdkA8ASmYemmZ-1lWrzqhbaYpPJUbxhKxtb0QIG4ih_Tv3W6sLmIJ0OnxcMb5uSNVRkNxUIu-8dJvu13g__3HY8NaOybuEDPGURur79kDSmiuZUyA7U3pEIq_jWFIYMQjAke2CgKtU-zXGpq-u2ufKp81ExxEX7ybKXkWOVCwejNxxOKGlvpzh3JNZm7I7uPCp7i_WDwS38ZjLBp0QAdQZ4uP6cevkAfplGQ')",
                }}
              ></div>
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[12px] font-bold text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">
                  bolt
                </span>
                AI Recommended
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
                  Toán học 10 - Nâng cao
                </h3>
                <button className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  className="w-8 h-8 rounded-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKMT6_lXHc3Y8K9rxeN6ruhopgl0kCRuY1CstB4ZR5jSoGZq8nTtqJZBTOye6NvLpVACIJagCaAL43peuutlkP21I9jKGEpHxF4QLc5K7QOHK9Vfvb98DFcDwRCkSv6yz3ghR9BnMOLQuw_tnzvcdUrbIx4FB4s7WT3h00ZMvg9E_jyhrlDnihNvKD-RqQw9XKqwe-N5WwwY2_gxMPkjdJ_uSbQBT-akJCFxwvLBds0GRmQqVayJuMtqffnSZej39XNz2LR90GwnOJ"
                  alt="Teacher"
                />
                <span className="text-body-sm text-on-surface-variant">
                  Thầy Trần Hoàng Nam
                </span>
              </div>
              <div className="flex items-center gap-4 text-body-sm text-on-surface-variant mb-6">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_today
                  </span>
                  <span>T2, T4</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    schedule
                  </span>
                  <span>08:00 - 09:30</span>
                </div>
              </div>
              {/* Progress */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">
                    Tiến độ học tập
                  </span>
                  <span className="font-bold text-primary">65%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "65%" }}
                  ></div>
                </div>
              </div>
              <button className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <span>Vào lớp học</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Card 2: Physics */}
          <div className="glass-card rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-outline-variant hover:border-primary-container/30">
            <div className="h-40 relative overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA7G3POu-PW9DcyDxURL8-Vb4306OdIbFx630B5iX4OT6ni1sdxEcd47owAwHmOc2MizITfTUUWI3nLMSKYi_SqCXGD1xv1wBv6QfP0yYDaHvoulWED0lw75l1WXiIhonRdediKFTZQAjj_WVh9AricwflmpNNugooHKdntnslwa6h1-grQve6nUXGCIk-lKqRCgEsNrF5GWegZbz75CfxNY9ZIJpwScseDne25feIsEiMFBCGHwtDQpL9n11Y1mW08FUjk77_eH9h5')",
                }}
              ></div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
                  Vật lý 10 - Cơ học
                </h3>
                <button className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  className="w-8 h-8 rounded-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPwE4pC9ArNJhRkmvSwMRDIw11jiPh1ejC4W1L2XMTEqNl9osj4RY3rGoPXiBnkIShhQ-9iHi3YKvn0KOJnnF0-5OvIvM3NoJQp_Rtv3raQ7iKGevQqo3uErGOx9-0IfkEHWm3Y9xyHNZd4X_ufHHEmGrKarcXxgXVpaep2tIl1pxWzCrUGbPlGu64kN7B5KeRERiK_SGoFPnnCeuPug6rRdMkN11w7_DS1rLBTCfXE1shZ30EOSadklIMQFoLNqHzGP95EV0h27N1"
                  alt="Teacher"
                />
                <span className="text-body-sm text-on-surface-variant">
                  Cô Lê Minh Anh
                </span>
              </div>
              <div className="flex items-center gap-4 text-body-sm text-on-surface-variant mb-6">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_today
                  </span>
                  <span>T3, T5</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    schedule
                  </span>
                  <span>14:00 - 15:30</span>
                </div>
              </div>
              {/* Progress */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">
                    Tiến độ học tập
                  </span>
                  <span className="font-bold text-primary">42%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "42%" }}
                  ></div>
                </div>
              </div>
              <button className="w-full py-3 bg-surface-container-low text-primary border border-primary-container/20 rounded-lg font-bold hover:bg-primary-container/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <span>Vào lớp học</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Card 3: Literature */}
          <div className="glass-card rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-outline-variant hover:border-primary-container/30">
            <div className="h-40 relative overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuATL37lA-EQ5MZcMXyzaYsPApLkgYWFPiCDc0HZP003TXUfKxqZV7NDviIqhC2b8nLTItNogArV5tfLDB0UXh52aC863iF1TRydeiTDNj5k3E6S_X05U0eZfNLcL2UzCKAKdXKy18F7Cyzxg4v7OZ73c_KKbxxoTH7d8qWi1S3xHkGbRIWv-NCqIrzuEa95FpXARJTw3abvj4sv_2hjpepCxNoxmOD4hNQzc0GzOLiTnpq7quNBpzTBnjYe7sx87g9ALEXetqIz2LQ6')",
                }}
              ></div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
                  Ngữ văn 10 - Hiện đại
                </h3>
                <button className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  className="w-8 h-8 rounded-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCysT6dzl1Hk_Mn1xteE7kPKFJ-WD7ByN-HnIyOjzMG61UcIt6w6IECurhmZWpK4nU5LzKbHaljN_beof1g_u1bn5M8Zs1X1HNuhlYQgTdtMrrtn4ZNWHbNCjel7YnOxitVoYVV3MGFzZqbHpXX0fkzQvP3Qt9tHueR8KGbYh0RK6b46BIICRoIMLHPT_8P5Q60Jz3Af0TqAGrKgqwwPXHB9LXel9jIygWiyyEeZPUn4lMoJVEO_nY9WBIvgk9tiSvygVbZuSCopWzr"
                  alt="Teacher"
                />
                <span className="text-body-sm text-on-surface-variant">
                  Cô Nguyễn Thu Hà
                </span>
              </div>
              <div className="flex items-center gap-4 text-body-sm text-on-surface-variant mb-6">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_today
                  </span>
                  <span>T4, T6</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    schedule
                  </span>
                  <span>09:45 - 11:15</span>
                </div>
              </div>
              {/* Progress */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">
                    Tiến độ học tập
                  </span>
                  <span className="font-bold text-primary">88%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "88%" }}
                  ></div>
                </div>
              </div>
              <button className="w-full py-3 bg-surface-container-low text-primary border border-primary-container/20 rounded-lg font-bold hover:bg-primary-container/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <span>Vào lớp học</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Card 4: English */}
          <div className="glass-card rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-outline-variant hover:border-primary-container/30">
            <div className="h-40 relative overflow-hidden">
              <div
                className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAKdkwqFEJCj0WkW7M4Feo29PQ3vcupsiNpz4Ps6NlhTbEgc4gGuX6Qaa8t3CNRk5PXVsovgojJStUTQp3qpz4Wr50lRH86U8KQ23c6-t5kVCTyLCzp3X8cmU0pKv30sxdhx6ERWTsupKGFNqP5cf0hYj5o9YQ-gx4tWGhnOV4UNv8KKuHmjVQzQZgi-6M7pJcIfNVAtK3LH5dsqoN7lZztQ7eZnAI0JEXa9hmncuLA8kH4kgPMCaNibaXMeGjCbOKtk3jGTCLhbYZX')",
                }}
              ></div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors">
                  Tiếng Anh - IELTS Focus
                </h3>
                <button className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  className="w-8 h-8 rounded-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsXbUwQlIK2T158-_PmAmAQW5eBoTt27CKpUcdO6xp0yNx6m37xkeGp1IkcJ5l0bpIPtMssKdEhpz0DvX3z2fvv4hkYDMWfBcKJpv3KddCW4iUCruvN6JmzhJtPsOwRIhpNzG2Tlse24bEQOAJmNsDdyg1VPXLLJz6qEXc-wowWX2l5OIUJRRQAUxg6drS4QEytQgoQas3TybxNVftwgeP7G9B3LIRu5ZmLOYoNCYQnmNEcxe9E1FCOjdWtVNWRRvl85wg_Q8VXQcr"
                  alt="Teacher"
                />
                <span className="text-body-sm text-on-surface-variant">
                  Thầy James Nguyễn
                </span>
              </div>
              <div className="flex items-center gap-4 text-body-sm text-on-surface-variant mb-6">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    calendar_today
                  </span>
                  <span>T3, T7</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px]">
                    schedule
                  </span>
                  <span>18:30 - 20:00</span>
                </div>
              </div>
              {/* Progress */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">
                    Tiến độ học tập
                  </span>
                  <span className="font-bold text-primary">15%</span>
                </div>
                <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "15%" }}
                  ></div>
                </div>
              </div>
              <button className="w-full py-3 bg-surface-container-low text-primary border border-primary-container/20 rounded-lg font-bold hover:bg-primary-container/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                <span>Vào lớp học</span>
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Add New Class (Bento Placeholder) */}
          <div className="border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-8 text-center group hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-[32px]">
                add
              </span>
            </div>
            <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-1">
              Thêm lớp học mới
            </h3>
            <p className="text-body-sm text-on-surface-variant max-w-[200px]">
              Sử dụng mã lớp học hoặc tìm kiếm khóa học mới
            </p>
          </div>
        </div>

        {/* AI Insight Section (Asymmetric) */}
        <div className="mt-16 bg-primary-container rounded-2xl p-8 text-white relative overflow-hidden flex flex-col lg:flex-row items-center gap-8">
          <div className="relative z-10 flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                auto_awesome
              </span>
              <span className="font-label-md tracking-widest uppercase opacity-80">
                AI Learning Insight
              </span>
            </div>
            <h3 className="font-headline-lg text-headline-lg mb-4">
              Dự đoán kết quả học tập
            </h3>
            <p className="font-body-lg text-body-lg mb-6 opacity-90 max-w-2xl">
              Dựa trên tiến độ hiện tại của bạn trong lớp{" "}
              <span className="font-bold">Toán học 10</span>, AI dự đoán bạn có
              thể đạt điểm A nếu duy trì tốc độ làm bài tập như tuần vừa qua.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:shadow-lg transition-all">
                Xem phân tích chi tiết
              </button>
              <button className="px-6 py-3 border border-white/30 hover:bg-white/10 text-white font-bold rounded-xl transition-all">
                Lịch học tiếp theo
              </button>
            </div>
          </div>
          <div className="w-full lg:w-72 aspect-square relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="h-full flex flex-col justify-between">
              <p className="text-label-md font-medium opacity-80">
                Chỉ số tập trung
              </p>
              <div className="flex items-end justify-between h-32 gap-2">
                <div className="w-full bg-white/20 rounded-t-sm h-[40%]"></div>
                <div className="w-full bg-white/20 rounded-t-sm h-[60%]"></div>
                <div className="w-full bg-white/40 rounded-t-sm h-[85%]"></div>
                <div className="w-full bg-white/20 rounded-t-sm h-[50%]"></div>
                <div className="w-full bg-white/60 rounded-t-sm h-[70%]"></div>
                <div className="w-full bg-white rounded-t-sm h-[95%]"></div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <span className="text-[24px] font-bold">92%</span>
                <span className="text-xs px-2 py-1 bg-green-500 rounded text-white font-bold">
                  Excellent
                </span>
              </div>
            </div>
          </div>
          {/* Abstract BG Decoration */}
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
        </div>
      </div>

      {/* Footer / Simple Spacer */}
      <footer className="mt-auto py-8 text-center text-on-surface-variant text-body-sm opacity-50">
        © 2024 Lumen AI - Hệ thống quản lý học tập thông minh
      </footer>
    </main>
  );
};

export default MyClassesContent;
