import React from "react";

const ExamManagementContent = () => {
  return (
    <main className="ml-[280px] pt-16 min-h-screen">
      <div className="max-w-max-content-width mx-auto p-margin-desktop">
        {/* Page Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface">
              Quản lý kỳ thi
            </h1>
            <p className="text-body-md text-on-surface-variant mt-1">
              Quản lý, theo dõi và đánh giá các kỳ thi trong học kỳ này.
            </p>
          </div>
          <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 shadow-lg shadow-primary/10 transition-all">
            <span className="material-symbols-outlined" data-icon="add">
              add
            </span>
            Tạo kỳ thi mới
          </button>
        </div>

        {/* Summary Cards (Bento Grid Style) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter mb-10">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span
                className="p-2 bg-primary/10 text-primary rounded-lg material-symbols-outlined"
                data-icon="list_alt"
              >
                list_alt
              </span>
              <span className="text-label-md text-primary font-bold">+12%</span>
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Tổng số kỳ thi
            </p>
            <h3 className="text-headline-md font-bold text-on-surface">48</h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span
                className="p-2 bg-green-100 text-green-700 rounded-lg material-symbols-outlined"
                data-icon="pulse"
              >
                pause
              </span>
              <span className="text-label-md text-green-600 font-bold">
                Hoạt động
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Đang diễn ra
            </p>
            <h3 className="text-headline-md font-bold text-on-surface">03</h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span
                className="p-2 bg-blue-100 text-blue-700 rounded-lg material-symbols-outlined"
                data-icon="calendar_month"
              >
                calendar_month
              </span>
              <span className="text-label-md text-blue-600 font-bold">
                Sắp tới
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Sắp diễn ra
            </p>
            <h3 className="text-headline-md font-bold text-on-surface">08</h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <span
                className="p-2 bg-secondary-container text-secondary rounded-lg material-symbols-outlined"
                data-icon="check_circle"
              >
                check_circle
              </span>
              <span className="text-label-md text-on-surface-variant font-bold">
                Lưu trữ
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Đã hoàn thành
            </p>
            <h3 className="text-headline-md font-bold text-on-surface">37</h3>
          </div>
        </div>

        {/* Filter & Search Section */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-label-md font-bold text-on-surface mb-2">
                Học kỳ
              </label>
              <select className="w-full border-outline-variant rounded-lg text-body-sm focus:ring-primary">
                <option>Học kỳ I - 2023-2024</option>
                <option>Học kỳ II - 2023-2024</option>
                <option>Hè 2024</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-label-md font-bold text-on-surface mb-2">
                Trạng thái
              </label>
              <select className="w-full border-outline-variant rounded-lg text-body-sm focus:ring-primary">
                <option>Tất cả trạng thái</option>
                <option>Đang diễn ra</option>
                <option>Kết thúc</option>
                <option>Bản nháp</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-label-md font-bold text-on-surface mb-2">
                Lớp học
              </label>
              <select className="w-full border-outline-variant rounded-lg text-body-sm focus:ring-primary">
                <option>Tất cả lớp</option>
                <option>Lớp 10A1</option>
                <option>Lớp 10A2</option>
                <option>Lớp 11B3</option>
              </select>
            </div>
            <div className="flex items-end h-full self-end">
              <button className="bg-surface-container text-primary px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-primary hover:text-on-primary transition-all">
                <span
                  className="material-symbols-outlined"
                  data-icon="filter_list"
                >
                  filter_list
                </span>
                Lọc kết quả
              </button>
            </div>
          </div>
        </div>

        {/* Exam List Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant">
                <th className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant">
                  Tên kỳ thi
                </th>
                <th className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant">
                  Lớp
                </th>
                <th className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant">
                  Trạng thái
                </th>
                <th className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant">
                  Thời gian bắt đầu
                </th>
                <th className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant text-center">
                  Số thí sinh
                </th>
                <th className="px-6 py-4 font-label-md text-label-md border-b border-outline-variant text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* Row 1: Ongoing */}
              <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-bold text-on-surface">
                        Kiểm tra giữa kỳ I - Toán 10
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        ID: EXAM-2023-001
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-body-md">10A1, 10A2</td>
                <td className="px-6 py-5">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-label-md font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-700 rounded-full animate-pulse"></span>
                    Đang diễn ra
                  </span>
                </td>
                <td className="px-6 py-5 text-body-sm text-on-surface-variant">
                  08:00, 15/10/2023
                </td>
                <td className="px-6 py-5 text-center font-code-sm">84 / 90</td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-all"
                      title="Xem báo cáo"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="bar_chart"
                      >
                        bar_chart
                      </span>
                    </button>
                    <button
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="edit"
                      >
                        edit
                      </span>
                    </button>
                    <button
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-all"
                      title="Xóa"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="delete"
                      >
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 2: Ended */}
              <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-secondary-fixed-dim rounded-full"></div>
                    <div>
                      <p className="font-bold text-on-surface">
                        Khảo sát năng lực Tiếng Anh đầu năm
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        ID: EXAM-2023-002
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-body-md">Khối 10</td>
                <td className="px-6 py-5">
                  <span className="bg-surface-variant text-on-secondary-fixed-variant px-3 py-1 rounded-full text-label-md font-bold">
                    Đã kết thúc
                  </span>
                </td>
                <td className="px-6 py-5 text-body-sm text-on-surface-variant">
                  09:30, 01/09/2023
                </td>
                <td className="px-6 py-5 text-center font-code-sm">
                  450 / 450
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-all"
                      title="Xem báo cáo"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="bar_chart"
                      >
                        bar_chart
                      </span>
                    </button>
                    <button
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="edit"
                      >
                        edit
                      </span>
                    </button>
                    <button
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-all"
                      title="Xóa"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="delete"
                      >
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 3: Draft */}
              <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-outline rounded-full"></div>
                    <div>
                      <p className="font-bold text-on-surface">
                        Kiểm tra 15p Chương 1 - Lý 11
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        ID: EXAM-2023-005
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-body-md">11B3</td>
                <td className="px-6 py-5">
                  <span className="bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1 rounded-full text-label-md font-bold">
                    Bản nháp
                  </span>
                </td>
                <td className="px-6 py-5 text-body-sm text-on-surface-variant">
                  --/--/----
                </td>
                <td className="px-6 py-5 text-center font-code-sm">0 / 42</td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-all"
                      disabled
                      title="Xem báo cáo"
                    >
                      <span
                        className="material-symbols-outlined opacity-30"
                        data-icon="bar_chart"
                      >
                        bar_chart
                      </span>
                    </button>
                    <button
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="edit"
                      >
                        edit
                      </span>
                    </button>
                    <button
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-all"
                      title="Xóa"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="delete"
                      >
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* Row 4: Ongoing */}
              <tr className="hover:bg-surface-container-low transition-colors group cursor-pointer">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-10 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-bold text-on-surface">
                        Thi thử THPT Quốc gia đợt 1
                      </p>
                      <p className="text-body-sm text-on-surface-variant">
                        ID: EXAM-2023-009
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-body-md">Khối 12</td>
                <td className="px-6 py-5">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-label-md font-bold inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-700 rounded-full animate-pulse"></span>
                    Đang diễn ra
                  </span>
                </td>
                <td className="px-6 py-5 text-body-sm text-on-surface-variant">
                  07:30, 20/10/2023
                </td>
                <td className="px-6 py-5 text-center font-code-sm">
                  512 / 515
                </td>
                <td className="px-6 py-5 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-all"
                      title="Xem báo cáo"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="bar_chart"
                      >
                        bar_chart
                      </span>
                    </button>
                    <button
                      className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-lg transition-all"
                      title="Chỉnh sửa"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="edit"
                      >
                        edit
                      </span>
                    </button>
                    <button
                      className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container rounded-lg transition-all"
                      title="Xóa"
                    >
                      <span
                        className="material-symbols-outlined"
                        data-icon="delete"
                      >
                        delete
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-6 py-4 bg-surface-container flex justify-between items-center">
            <p className="text-body-sm text-on-surface-variant">
              Hiển thị 1-10 trong số 48 kỳ thi
            </p>
            <div className="flex gap-2">
              <button className="p-2 rounded border border-outline-variant hover:bg-surface-bright transition-colors">
                <span
                  className="material-symbols-outlined"
                  data-icon="chevron_left"
                >
                  chevron_left
                </span>
              </button>
              <button className="px-3 py-1 rounded bg-primary text-on-primary font-bold">
                1
              </button>
              <button className="px-3 py-1 rounded hover:bg-surface-container-high transition-colors">
                2
              </button>
              <button className="px-3 py-1 rounded hover:bg-surface-container-high transition-colors">
                3
              </button>
              <button className="p-2 rounded border border-outline-variant hover:bg-surface-bright transition-colors">
                <span
                  className="material-symbols-outlined"
                  data-icon="chevron_right"
                >
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <footer className="mt-12 text-center text-body-sm text-on-surface-variant border-t border-outline-variant pt-6">
          <p>
            © 2024 AI-LMS Portal - Academic Exam Management Module. All Rights
            Reserved.
          </p>
        </footer>
      </div>
    </main>
  );
};

export default ExamManagementContent;
