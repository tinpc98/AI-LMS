import React from "react";

const QuestionBankContent = () => {
  return (
    <div className="p-8 max-w-[1280px] mx-auto">
      {/* Hero Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface mb-2">
            Ngân hàng câu hỏi
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-2xl">
            Quản lý hệ thống câu hỏi đa phương thức. Sử dụng AI để tạo nhanh các
            bộ câu hỏi từ giáo trình hoặc tài liệu PDF chỉ trong vài giây.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-surface text-primary border border-primary font-label-md rounded-xl hover:bg-primary-fixed transition-all">
            <span className="material-symbols-outlined" data-icon="add">
              add
            </span>
            Tạo câu hỏi mới
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-label-md rounded-xl hover:bg-primary-container ai-glow transition-all">
            <span
              className="material-symbols-outlined"
              data-icon="auto_awesome"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>
            Tạo bằng AI
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-surface p-6 rounded-xl border border-outline-variant hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span
              className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg"
              data-icon="library_books"
            >
              library_books
            </span>
            <span className="text-label-md text-primary font-bold">+12%</span>
          </div>
          <p className="text-display-lg font-display-lg text-on-surface">
            1,284
          </p>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider">
            Tổng số câu hỏi
          </p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-outline-variant hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span
              className="material-symbols-outlined text-secondary p-2 bg-secondary-fixed rounded-lg"
              data-icon="category"
            >
              category
            </span>
          </div>
          <p className="text-display-lg font-display-lg text-on-surface">24</p>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider">
            Danh mục/Môn học
          </p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-outline-variant hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span
              className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-lg"
              data-icon="bolt"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bolt
            </span>
            <span className="text-label-md text-primary font-bold">60%</span>
          </div>
          <p className="text-display-lg font-display-lg text-on-surface">856</p>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider">
            Tạo bởi AI
          </p>
        </div>
        <div className="bg-surface p-6 rounded-xl border border-outline-variant hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <span
              className="material-symbols-outlined text-tertiary p-2 bg-tertiary-fixed rounded-lg"
              data-icon="check_circle"
            >
              check_circle
            </span>
          </div>
          <p className="text-display-lg font-display-lg text-on-surface">
            1,120
          </p>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider">
            Đã phê duyệt
          </p>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="bg-surface p-4 rounded-xl border border-outline-variant mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-grow min-w-[200px]">
          <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
            Môn học
          </label>
          <select className="w-full bg-surface-container-low border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary">
            <option>Tất cả môn học</option>
            <option>Toán học</option>
            <option>Vật lý</option>
            <option>Tiếng Anh</option>
          </select>
        </div>
        <div className="w-40">
          <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
            Khối lớp
          </label>
          <select className="w-full bg-surface-container-low border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary">
            <option>Tất cả</option>
            <option>Khối 10</option>
            <option>Khối 11</option>
            <option>Khối 12</option>
          </select>
        </div>
        <div className="w-40">
          <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
            Độ khó
          </label>
          <select className="w-full bg-surface-container-low border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary">
            <option>Tất cả</option>
            <option>Dễ</option>
            <option>Trung bình</option>
            <option>Khó</option>
          </select>
        </div>
        <div className="w-48">
          <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
            Loại câu hỏi
          </label>
          <select className="w-full bg-surface-container-low border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary">
            <option>Tất cả</option>
            <option>Trắc nghiệm</option>
            <option>Tự luận</option>
          </select>
        </div>
        <div className="flex items-end h-full self-end pb-1">
          <button className="p-2.5 bg-secondary-container text-on-secondary-container rounded-lg hover:bg-secondary-fixed transition-colors">
            <span className="material-symbols-outlined" data-icon="filter_list">
              filter_list
            </span>
          </button>
        </div>
      </section>

      {/* Question List Table */}
      <section className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                Nội dung câu hỏi
              </th>
              <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                Phân loại
              </th>
              <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                Độ khó
              </th>
              <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider text-right">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {/* Row 1 */}
            <tr className="hover:bg-surface-container-lowest transition-colors group">
              <td className="px-6 py-5">
                <p className="text-body-md font-bold text-on-surface line-clamp-1">
                  Cho hàm số f(x) = ax^3 + bx^2 + cx + d...
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  ID: Q-10293 • Cập nhật 2 giờ trước
                </p>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-body-sm text-on-surface">Toán học</span>
                  <span className="text-[12px] text-on-surface-variant">
                    Lớp 12 • Giải tích
                  </span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="px-2 py-1 bg-error-container text-on-error-container text-[12px] font-bold rounded-full uppercase">
                  Khó
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-body-sm font-medium">Sẵn sàng</span>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-primary"
                    title="Xem trước"
                  >
                    <span
                      className="material-symbols-outlined"
                      data-icon="visibility"
                    >
                      visibility
                    </span>
                  </button>
                  <button
                    className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-secondary"
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
                    className="p-2 hover:bg-error-container hover:text-error rounded-lg transition-colors"
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
            {/* Row 2 */}
            <tr className="hover:bg-surface-container-lowest transition-colors group">
              <td className="px-6 py-5">
                <p className="text-body-md font-bold text-on-surface line-clamp-1">
                  Nêu định luật II Newton và cho ví dụ minh họa trong thực tế.
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  ID: Q-10294 • Cập nhật 5 giờ trước
                </p>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-body-sm text-on-surface">Vật lý</span>
                  <span className="text-[12px] text-on-surface-variant">
                    Lớp 10 • Cơ học
                  </span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-[12px] font-bold rounded-full uppercase">
                  Trung bình
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-outline-variant rounded-full"></span>
                  <span className="text-body-sm font-medium">Bản nháp</span>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-primary"
                    title="Xem trước"
                  >
                    <span
                      className="material-symbols-outlined"
                      data-icon="visibility"
                    >
                      visibility
                    </span>
                  </button>
                  <button
                    className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-secondary"
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
                    className="p-2 hover:bg-error-container hover:text-error rounded-lg transition-colors"
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
            {/* Row 3 */}
            <tr className="hover:bg-surface-container-lowest transition-colors group border-b-0">
              <td className="px-6 py-5">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="material-symbols-outlined text-[16px] text-primary"
                    data-icon="auto_awesome"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  <p className="text-body-md font-bold text-on-surface line-clamp-1">
                    Complete the sentence with the correct tense: "If I..."
                  </p>
                </div>
                <p className="text-body-sm text-on-surface-variant">
                  ID: Q-10295 • Cập nhật 1 ngày trước
                </p>
              </td>
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-body-sm text-on-surface">
                    Tiếng Anh
                  </span>
                  <span className="text-[12px] text-on-surface-variant">
                    Lớp 11 • Ngữ pháp
                  </span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="px-2 py-1 bg-surface-variant text-primary text-[12px] font-bold rounded-full uppercase">
                  Dễ
                </span>
              </td>
              <td className="px-6 py-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  <span className="text-body-sm font-medium">Sẵn sàng</span>
                </div>
              </td>
              <td className="px-6 py-5 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-primary"
                    title="Xem trước"
                  >
                    <span
                      className="material-symbols-outlined"
                      data-icon="visibility"
                    >
                      visibility
                    </span>
                  </button>
                  <button
                    className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-secondary"
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
                    className="p-2 hover:bg-error-container hover:text-error rounded-lg transition-colors"
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
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
          <p className="text-body-sm text-on-surface-variant">
            Hiển thị 1-10 trên 1,284 câu hỏi
          </p>
          <div className="flex gap-2">
            <button
              className="p-2 border border-outline-variant rounded-lg hover:bg-surface transition-colors disabled:opacity-50"
              disabled
            >
              <span
                className="material-symbols-outlined"
                data-icon="chevron_left"
              >
                chevron_left
              </span>
            </button>
            <button className="px-4 py-2 bg-primary text-on-primary rounded-lg font-bold text-body-sm">
              1
            </button>
            <button className="px-4 py-2 hover:bg-surface-container-high rounded-lg text-body-sm transition-colors">
              2
            </button>
            <button className="px-4 py-2 hover:bg-surface-container-high rounded-lg text-body-sm transition-colors">
              3
            </button>
            <span className="px-2 py-2">...</span>
            <button className="px-4 py-2 hover:bg-surface-container-high rounded-lg text-body-sm transition-colors">
              129
            </button>
            <button className="p-2 border border-outline-variant rounded-lg hover:bg-surface transition-colors">
              <span
                className="material-symbols-outlined"
                data-icon="chevron_right"
              >
                chevron_right
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default QuestionBankContent;
