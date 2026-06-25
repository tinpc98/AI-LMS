import React from "react";

const ClassroomDetailContent = () => {
  return (
    <main className="md:ml-[280px] min-h-screen flex flex-col">
      {/* TopNavBar (Classroom Detail) */}
      <header className="h-20 bg-surface border-b border-outline-variant flex items-center justify-between px-margin-desktop sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
        <div className="flex items-center gap-6 flex-1">
          <button className="md:hidden text-on-surface-variant">
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="hidden lg:flex items-center bg-surface-container-low border border-outline-variant px-4 py-2 rounded-full w-96 gap-3">
            <span className="material-symbols-outlined text-outline">
              search
            </span>
            <input
              className="bg-transparent border-none focus:ring-0 text-body-sm w-full outline-none"
              placeholder="Search lessons, members..."
              type="text"
            />
          </div>
        </div>

        <nav className="flex items-center gap-8 h-full">
          <a
            className="tab-link text-primary border-b-2 border-primary h-full flex items-center font-bold px-2"
            data-tab="lessons"
            href="#"
          >
            Lessons
          </a>
          <a
            className="tab-link text-on-surface-variant hover:text-primary transition-all h-full flex items-center px-2"
            data-tab="members"
            href="#"
          >
            Members
          </a>
          <a
            className="tab-link text-on-surface-variant hover:text-primary transition-all h-full flex items-center px-2"
            data-tab="assignments"
            href="#"
          >
            Assignments
          </a>
          <a
            className="tab-link text-on-surface-variant hover:text-primary transition-all h-full flex items-center px-2"
            data-tab="chat"
            href="#"
          >
            Class Chat
          </a>
        </nav>

        <div className="flex items-center gap-4 ml-8">
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-opacity active:opacity-80 relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
          </button>
          <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-opacity active:opacity-80">
            <span className="material-symbols-outlined">history_edu</span>
          </button>
          <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant">
            <img
              alt="Teacher Profile Picture"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtpMK47CGOiNU6U-a3P7DpCWw4uVNQF-A9BxaBX7vtW1ZHzwlCCiZ0HPViL7bM_PClyS_ABnNugPt76psSQ2aKHPLeKsfv2tAfiHwXGb9XNAAa_FoaezZLjEuekw76UgyoACCqzQEHk2NgXHjiAnMEi8kiN1TDKYfQx-uFfJzYMhwT-ln5G_Fr0N6eRVzKdTTrmubMhlof3KFpRpsgpo0QtVnW4WKpWGJw7x4LjuVTSkNozywK9LLaJ6okbCfyEJLyhTZUEGzxRuKF"
            />
          </div>
        </div>
      </header>

      {/* Content Canvas */}
      <div className="flex-1 px-margin-desktop py-8 max-w-max-content-width mx-auto w-full">
        {/* Hero Header */}
        <section className="relative rounded-3xl overflow-hidden mb-12 group">
          <div className="absolute inset-0 bg-gradient-to-r from-on-surface/80 to-transparent z-10"></div>
          <img
            alt="Classroom Cover"
            className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDUVDlZ7DIaScGj9T-kdiKcsWgvwG1TmzVPX7XuPHSo_ETL1AGde0LWF9NjiH34SiRAVUyJMRhyqagkBtzZbgHaWjkEYgShEcho4GlL6dZPx3IRQzL3no_CQEVYEgawyl8DK-zYbA3RiC3ULtuy6mnplJbWAq8M2g3hrkc2bgJcK6iRJIhOO8LjNUCaY8uPTgC6Q5_HBFD89ViIfa2ax8CSTMO_rVeleyT_iA8uBOHjTWxfAKqmkjORvjRlYwMHrVb8vsY2YWhu5Ib7"
          />
          <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-primary/20 backdrop-blur-md text-white px-3 py-1 rounded-full text-label-md font-medium border border-white/20">
                Active Semester
              </span>
              <span className="text-white/70 text-body-sm">•</span>
              <span className="text-white/90 text-body-sm">Grade 10</span>
            </div>
            <h2 className="text-white font-headline-lg text-headline-lg mb-2">
              Lớp 10A1 - Toán học
            </h2>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-white/80">
                <span className="material-symbols-outlined text-sm">key</span>
                <span className="font-code-sm text-code-sm uppercase tracking-widest">
                  MATH-10A1-XQ
                </span>
              </div>
              <div className="flex items-center gap-2 text-white/80">
                <span className="material-symbols-outlined text-sm">
                  groups
                </span>
                <span className="text-body-sm">42 Students</span>
              </div>
            </div>
          </div>
          <button className="absolute top-6 right-6 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 rounded-full text-white transition-colors">
            <span className="material-symbols-outlined">edit</span>
          </button>
        </section>

        {/* Tab Content: Lessons (Default) */}
        <div className="tab-pane" id="lessons-content">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">
                Bài giảng hiện tại
              </h3>
              <p className="text-on-surface-variant text-body-sm">
                Manage and organize your mathematics curriculum.
              </p>
            </div>
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-label-md flex items-center gap-2 hover:shadow-lg transition-all active:scale-95">
              <span className="material-symbols-outlined">add</span>
              Tạo bài giảng
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Lesson Card */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl hover:border-primary-container hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-secondary-container rounded-xl flex items-center justify-center text-secondary">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    functions
                  </span>
                </div>
                <span className="text-label-md bg-green-50 text-green-700 px-3 py-1 rounded-full">
                  Đã xuất bản
                </span>
              </div>
              <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                Chương 1: Mệnh đề và Tập hợp
              </h4>
              <p className="text-on-surface-variant text-body-sm mb-6 line-clamp-2">
                Khám phá các khái niệm cơ bản về logic toán học và cách biểu
                diễn tập hợp.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                    JD
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center text-[10px] font-bold">
                    AS
                  </div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400 flex items-center justify-center text-[10px] font-bold text-white">
                    +8
                  </div>
                </div>
                <button className="text-primary font-bold text-label-md flex items-center gap-1">
                  Chi tiết{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>

            {/* Lesson Card 2 */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl hover:border-primary-container hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary-container/10 rounded-xl flex items-center justify-center text-primary">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    show_chart
                  </span>
                </div>
                <span className="text-label-md bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                  Đang học
                </span>
              </div>
              <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                Chương 2: Hàm số bậc nhất và bậc hai
              </h4>
              <p className="text-on-surface-variant text-body-sm mb-6 line-clamp-2">
                Phân tích đồ thị và ứng dụng thực tế của các loại hàm số đa
                thức.
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300"></div>
                </div>
                <button className="text-primary font-bold text-label-md flex items-center gap-1">
                  Chi tiết{" "}
                  <span className="material-symbols-outlined text-sm">
                    arrow_forward
                  </span>
                </button>
              </div>
            </div>

            {/* Lesson Card 3 (AI Recommendation) */}
            <div className="bg-surface-container-lowest border border-dashed border-primary/40 p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">
                    auto_awesome
                  </span>
                </div>
                <span className="text-label-md bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
                  AI Gợi ý
                </span>
              </div>
              <h4 className="font-bold text-lg mb-2">
                Chương 3: Phương trình & Hệ phương trình
              </h4>
              <p className="text-on-surface-variant text-body-sm mb-6">
                AI đề xuất dựa trên tiến độ học tập của lớp 10A1 tuần vừa qua.
              </p>
              <button className="w-full bg-white border border-primary text-primary py-2 rounded-lg font-label-md hover:bg-primary hover:text-white transition-all">
                Tạo ngay
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content: Members (Hidden by default) */}
        <div className="tab-pane hidden" id="members-content">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Danh sách học sinh (42)
            </h3>
            <div className="flex gap-3">
              <button className="bg-surface-container-high text-on-surface-variant px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:bg-surface-container-highest transition-colors">
                <span className="material-symbols-outlined">how_to_reg</span>
                Điểm danh
              </button>
              <button className="bg-primary text-white px-4 py-2 rounded-lg font-label-md flex items-center gap-2 hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined">mail</span>
                Nhắn tin
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container border-b border-outline-variant">
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase text-xs">
                    Student Name
                  </th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase text-xs">
                    Student ID
                  </th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase text-xs">
                    Attendance
                  </th>
                  <th className="px-6 py-4 font-label-md text-on-surface-variant uppercase text-xs text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                        TN
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Trần Nam</p>
                        <p className="text-xs text-on-surface-variant">
                          nam.tran@school.edu.vn
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm font-code-sm">
                    STU00124
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      98% Regular
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary p-2">
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-700 font-bold text-xs">
                        LH
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Lê Hoa</p>
                        <p className="text-xs text-on-surface-variant">
                          hoa.le@school.edu.vn
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm font-code-sm">
                    STU00125
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      95% Regular
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary p-2">
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-xs">
                        PV
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">Phạm Văn</p>
                        <p className="text-xs text-on-surface-variant">
                          van.pham@school.edu.vn
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-sm font-code-sm">
                    STU00126
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-error-container text-error px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
                      82% Critical
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-on-surface-variant hover:text-primary p-2">
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-outline-variant">
              <span className="text-body-sm text-on-surface-variant">
                Showing 3 of 42 members
              </span>
              <div className="flex gap-2">
                <button className="w-8 h-8 border border-outline-variant flex items-center justify-center rounded-lg hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                </button>
                <button className="w-8 h-8 border border-outline-variant flex items-center justify-center rounded-lg hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content: Assignments (Hidden by default) */}
        <div className="tab-pane hidden" id="assignments-content">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline-md text-headline-md text-on-surface">
              Quản lý Bài tập & Thi
            </h3>
            <div className="flex gap-4">
              <button className="bg-white border border-outline-variant text-on-surface-variant px-6 py-2 rounded-xl font-label-md flex items-center gap-2">
                <span className="material-symbols-outlined">filter_list</span>{" "}
                Lọc
              </button>
              <button className="bg-primary text-white px-6 py-2 rounded-xl font-label-md flex items-center gap-2">
                <span className="material-symbols-outlined">add</span> Tạo mới
              </button>
            </div>
          </div>
          <div className="space-y-4">
            {/* Assignment Item */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">assignment</span>
                </div>
                <div>
                  <h5 className="font-bold text-on-surface">
                    Bài tập về nhà: Giải phương trình lượng giác
                  </h5>
                  <p className="text-body-sm text-on-surface-variant">
                    Deadline: 20/10/2023 • 23:59
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-48 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-primary"></div>
                    </div>
                    <span className="text-xs font-bold text-on-surface-variant">
                      32/42 đã nộp
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-primary font-bold hover:bg-primary/10 rounded-lg transition-colors">
                  Chấm điểm
                </button>
                <button className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                  Chi tiết
                </button>
              </div>
            </div>

            {/* Exam Item */}
            <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-error-container/20 rounded-full flex items-center justify-center text-error">
                  <span className="material-symbols-outlined">timer</span>
                </div>
                <div>
                  <h5 className="font-bold text-on-surface">
                    Kiểm tra giữa kỳ - Toán Giải tích
                  </h5>
                  <p className="text-body-sm text-on-surface-variant">
                    Thời gian: 90 phút • Trực tuyến
                  </p>
                  <span className="inline-block mt-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase">
                    Upcoming
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 bg-primary-container/10 text-primary font-bold rounded-lg transition-colors">
                  Thiết lập đề
                </button>
                <button className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition-colors">
                  Xem trước
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content: Chat (Hidden by default) */}
        <div className="tab-pane hidden" id="chat-content">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl h-[600px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-outline-variant flex items-center justify-between bg-surface-container-low">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-container text-white rounded-full flex items-center justify-center font-bold">
                  #
                </div>
                <div>
                  <h4 className="font-bold text-on-surface">
                    Thảo luận Lớp 10A1
                  </h4>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>{" "}
                    12 thành viên trực tuyến
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg">
                  <span className="material-symbols-outlined">search</span>
                </button>
                <button className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg">
                  <span className="material-symbols-outlined">settings</span>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              {/* Chat Bubble (Them) */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center font-bold text-blue-700">
                  TN
                </div>
                <div className="max-w-[70%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-sm">Trần Nam</span>
                    <span className="text-xs text-on-surface-variant">
                      09:42 AM
                    </span>
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-outline-variant shadow-sm text-body-sm">
                    Thầy ơi, bài toán chương 2 câu 5 em chưa hiểu lắm ạ. Có thể
                    hướng dẫn lại không thầy?
                  </div>
                </div>
              </div>

              {/* Chat Bubble (Me) */}
              <div className="flex gap-4 flex-row-reverse">
                <div className="w-10 h-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center font-bold text-white">
                  T
                </div>
                <div className="max-w-[70%] text-right">
                  <div className="flex items-center justify-end gap-2 mb-1">
                    <span className="text-xs text-on-surface-variant">
                      09:45 AM
                    </span>
                    <span className="font-bold text-sm text-primary">
                      Bạn (Giáo viên)
                    </span>
                  </div>
                  <div className="bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-sm text-body-sm text-left">
                    Chào Nam, câu đó cần áp dụng định lý Vi-et. Thầy sẽ gửi tài
                    liệu bổ trợ vào nhóm nhé.
                  </div>
                </div>
              </div>

              <div className="flex justify-center my-4">
                <span className="bg-surface-container px-4 py-1 rounded-full text-[10px] uppercase font-bold text-on-surface-variant">
                  New Messages
                </span>
              </div>

              {/* System Message */}
              <div className="flex justify-center italic text-on-surface-variant text-xs py-2">
                Lê Hoa đã tham gia cuộc thảo luận.
              </div>
            </div>

            <div className="p-4 border-t border-outline-variant bg-white">
              <div className="flex items-center gap-3 bg-surface-container rounded-2xl p-2 px-4 border border-transparent focus-within:border-primary/30 transition-all">
                <button className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined">add_circle</span>
                </button>
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 text-body-sm outline-none"
                  placeholder="Nhập tin nhắn..."
                  type="text"
                />
                <div className="flex gap-2">
                  <button className="text-on-surface-variant hover:text-primary">
                    <span className="material-symbols-outlined">
                      sentiment_satisfied
                    </span>
                  </button>
                  <button className="bg-primary text-white p-2 rounded-xl active:scale-90 transition-transform">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 bg-primary text-white flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl hover:bg-primary-container hover:scale-105 active:scale-95 transition-all z-50 group">
        <span
          className="material-symbols-outlined"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          videocam
        </span>
        <span className="font-bold text-label-md">Học trực tuyến</span>
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-error border-2 border-white rounded-full animate-ping"></span>
      </button>
    </main>
  );
};

export default ClassroomDetailContent;
