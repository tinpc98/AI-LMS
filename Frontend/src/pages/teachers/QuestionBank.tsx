import { useState, useEffect } from "react";
import axios from "axios";

const QuestionBank = () => {
  // 1. STATE QUẢN LÝ DỮ LIỆU
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // 2. STATE QUẢN LÝ BỘ LỌC (FILTERS)
  const [filters, setFilters] = useState({
    topic: "",
    difficulty: "",
    type: "",
  });

  // 3. HÀM GỌI API KÉO DỮ LIỆU TỪ BACKEND
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      // Gọi API với query params (ví dụ: ?difficulty=HARD&type=MCQ)
      const response = await axios.get("http://localhost:5000/api/questions", {
        params: filters,
      });

      setQuestions(response.data.data || []);
      setTotalQuestions(response.data.total || 0);
    } catch (error) {
      console.error("Lỗi khi tải ngân hàng câu hỏi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. CHẠY LẠI API MỖI KHI BỘ LỌC THAY ĐỔI
  useEffect(() => {
    fetchQuestions();
  }, [filters]);

  // Hàm xử lý đổi Filter
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value === "Tất cả" ? "" : value, // Nếu chọn "Tất cả" thì gửi chuỗi rỗng lên API
    }));
  };

  // Hàm Helper: Đổi màu Badge tùy theo độ khó
  const renderDifficultyBadge = (difficulty) => {
    switch (difficulty?.toUpperCase()) {
      case "HARD":
        return (
          <span className="px-2 py-1 bg-error-container text-on-error-container text-[12px] font-bold rounded-full uppercase">
            Khó
          </span>
        );
      case "MEDIUM":
        return (
          <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-[12px] font-bold rounded-full uppercase">
            Trung bình
          </span>
        );
      case "EASY":
      default:
        return (
          <span className="px-2 py-1 bg-surface-variant text-primary text-[12px] font-bold rounded-full uppercase">
            Dễ
          </span>
        );
    }
  };

  return (
    <main className="ml-[280px] pt-16 min-h-screen p-8 max-w-[1280px] mx-auto">
      {/* Hero Header (Giữ nguyên) */}
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
            <span className="material-symbols-outlined">add</span> Tạo câu hỏi
            mới
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-label-md rounded-xl hover:bg-primary-container ai-glow transition-all">
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_awesome
            </span>{" "}
            Tạo bằng AI
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        {/* Thẻ 1: Tổng số câu hỏi (Động) */}
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
            {totalQuestions}
          </p>
          <p className="text-label-md text-on-surface-variant uppercase tracking-wider">
            Tổng số câu hỏi
          </p>
        </div>

        {/* Thẻ 2: Danh mục/Môn học */}
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

        {/* Thẻ 3: Tạo bởi AI */}
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

        {/* Thẻ 4: Đã phê duyệt */}
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

      {/* Filters Bar (Đã kết nối onChange) */}
      <section className="bg-surface p-4 rounded-xl border border-outline-variant mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-grow min-w-[200px]">
          <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
            Chủ đề (Topic)
          </label>
          <select
            name="topic"
            onChange={handleFilterChange}
            className="w-full bg-surface-container-low border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary"
          >
            <option>Tất cả</option>
            <option value="Unit 8: Ordering a meal in a restaurant">
              Unit 8: Restaurant
            </option>
            <option value="Unit 9">Unit 9</option>
          </select>
        </div>
        <div className="w-40">
          <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
            Độ khó
          </label>
          <select
            name="difficulty"
            onChange={handleFilterChange}
            className="w-full bg-surface-container-low border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary"
          >
            <option>Tất cả</option>
            <option value="EASY">Dễ</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HARD">Khó</option>
          </select>
        </div>
        <div className="w-48">
          <label className="block text-label-md font-label-md text-on-surface-variant mb-1">
            Loại câu hỏi
          </label>
          <select
            name="type"
            onChange={handleFilterChange}
            className="w-full bg-surface-container-low border-outline-variant rounded-lg text-body-sm focus:ring-primary focus:border-primary"
          >
            <option>Tất cả</option>
            <option value="MCQ">Trắc nghiệm</option>
            <option value="ESSAY">Tự luận</option>
          </select>
        </div>
      </section>

      {/* Question List Table (Đã Map Dữ liệu) */}
      <section className="bg-surface rounded-xl border border-outline-variant overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                  Nội dung câu hỏi
                </th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                  Chủ đề
                </th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                  Độ khó
                </th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-4 text-label-md font-bold text-on-surface-variant uppercase tracking-wider text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {/* TRẠNG THÁI LOADING */}
              {isLoading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-on-surface-variant"
                  >
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : questions.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="text-center py-10 text-on-surface-variant"
                  >
                    Không tìm thấy câu hỏi nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                /* RENDER DỮ LIỆU THẬT TỪ MẢNG questions */
                questions.map((q) => (
                  <tr
                    key={q._id}
                    className="hover:bg-surface-container-lowest transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 mb-1">
                        {q.type === "MCQ" && (
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            format_list_bulleted
                          </span>
                        )}
                        {q.type === "ESSAY" && (
                          <span className="material-symbols-outlined text-[16px] text-secondary">
                            edit_note
                          </span>
                        )}
                        <p
                          className="text-body-md font-bold text-on-surface line-clamp-1"
                          title={q.content}
                        >
                          {q.content}
                        </p>
                      </div>
                      <p className="text-body-sm text-on-surface-variant">
                        ID: {q._id.slice(-6).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-body-sm text-on-surface line-clamp-2">
                        {q.topic || "Chưa phân loại"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {/* Dùng hàm render Badge */}
                      {renderDifficultyBadge(q.difficulty)}
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-body-sm font-medium">
                        {q.type === "MCQ" ? "Trắc nghiệm" : "Tự luận"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-primary"
                          title="Xem trước"
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </button>
                        <button
                          className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-secondary"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined">
                            edit
                          </span>
                        </button>
                        <button
                          className="p-2 hover:bg-error-container hover:text-error rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <span className="material-symbols-outlined">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Tạm thời giữ UI, ghép logic phân trang Backend vào sau nếu cần) */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
          <p className="text-body-sm text-on-surface-variant">
            Hiển thị {questions.length > 0 ? 1 : 0}-{questions.length} trên{" "}
            {totalQuestions} câu hỏi
          </p>
          {/* ... (Các nút phân trang giữ nguyên HTML cũ của bạn) ... */}
        </div>
      </section>
    </main>
  );
};

export default QuestionBank;
