import { useState, useEffect } from "react";
import axios from "axios";

const QuestionBank = () => {
  // 1. STATE QUẢN LÝ DỮ LIỆU & POPUP
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // States cho Popup Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("EDIT");
  const [editingId, setEditingId] = useState(null);

  // States cho Popup Xem Chi Tiết
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState(null);

  // States cho Popup Thông báo (Xanh/Đỏ)
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      [name]: value === "Tất cả" ? "" : value,
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

  // 5. CÁC HÀM XỬ LÝ POPUP VÀ API (THÊM, SỬA, XÓA, XEM CHI TIẾT)
  const initialForm = {
    topic: "",
    difficulty: "MEDIUM",
    type: "MCQ",
    content: "",
    options: ["", "", "", ""],
    correctAnswer: "",
  };
  const [formData, setFormData] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});

  // Mở popup Thêm mới
  const openAddModal = () => {
    setModalMode("ADD");
    setFormData(initialForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Mở popup Chỉnh sửa
  const openEditModal = (question) => {
    setModalMode("EDIT");
    setEditingId(question._id);

    const existingOptions = Array.isArray(question.options)
      ? question.options
      : [];
    const safeOptions = ["", "", "", ""].map((emptyStr, index) => {
      return existingOptions[index] !== undefined
        ? existingOptions[index]
        : emptyStr;
    });

    setFormData({
      topic: question.topic || "",
      difficulty: question.difficulty || "MEDIUM",
      type: question.type || "MCQ",
      content: question.content || "",
      options: safeOptions,
      correctAnswer: question.correctAnswer || "",
    });

    setFormErrors({});
    setIsModalOpen(true);
  };

  // Mở popup Xem chi tiết
  const openViewModal = (question) => {
    setViewingQuestion(question);
    setIsViewModalOpen(true);
  };

  // Gọi API Lưu (Thêm/Sửa)
  const handleSaveQuestion = async () => {
    const errors = {};
    let hasError = false;

    if (!formData.topic.trim()) {
      errors.topic = "Vui lòng nhập chủ đề!";
      hasError = true;
    }
    if (!formData.content.trim()) {
      errors.content = "Vui lòng nhập nội dung câu hỏi!";
      hasError = true;
    }
    if (formData.type === "MCQ" && !formData.correctAnswer) {
      errors.correctAnswer = "Vui lòng tích chọn một đáp án đúng!";
      hasError = true;
    }

    if (hasError) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    try {
      if (modalMode === "ADD") {
        await axios.post("http://localhost:5000/api/questions", formData);
        setSuccessMessage("Thêm câu hỏi thành công!");
      } else {
        await axios.put(
          `http://localhost:5000/api/questions/${editingId}`,
          formData,
        );
        setSuccessMessage("Cập nhật câu hỏi thành công!");
      }

      setIsModalOpen(false);
      fetchQuestions();

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Lỗi API chi tiết:", error.response?.data);
      const backendError =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Dữ liệu gửi lên không hợp lệ (Lỗi 400)";
      setErrorMessage(
        typeof backendError === "string"
          ? backendError
          : JSON.stringify(backendError),
      );
    }
  };

  // Hàm xóa câu hỏi
  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa câu hỏi này không?")) {
      try {
        await axios.delete(`http://localhost:5000/api/questions/${id}`);
        fetchQuestions();
        setSuccessMessage("Xóa câu hỏi thành công!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } catch (error) {
        setErrorMessage(
          error.response?.data?.message || "Có lỗi khi xóa câu hỏi!",
        );
      }
    }
  };

  // ==========================================
  // RENDER GIAO DIỆN CHÍNH
  // ==========================================
  return (
    <main className="ml-[280px] pt-16 min-h-screen p-8 max-w-[1280px] mx-auto">
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
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-6 py-2.5 bg-surface text-primary border border-primary font-label-md rounded-xl hover:bg-primary-fixed transition-all"
          >
            <span className="material-symbols-outlined">add</span> Tạo câu hỏi
            mới
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary font-label-md rounded-xl hover:bg-primary-container ai-glow transition-all">
            <span
              className="material-symbols-outlined"
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
            {totalQuestions}
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

      {/* Question List Table */}
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
                          onClick={() => openViewModal(q)}
                          className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-primary"
                          title="Xem trước"
                        >
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </button>
                        <button
                          onClick={() => openEditModal(q)}
                          className="p-2 hover:bg-surface-container-low rounded-lg transition-colors text-secondary"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined">
                            edit
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(q._id)}
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

        {/* Pagination */}
        <div className="p-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
          <p className="text-body-sm text-on-surface-variant">
            Hiển thị {questions.length > 0 ? 1 : 0}-{questions.length} trên{" "}
            {totalQuestions} câu hỏi
          </p>
        </div>
      </section>

      {/* ========================================== */}
      {/* POPUP 1: THÊM / SỬA CÂU HỎI */}
      {/* ========================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-xl font-bold text-on-surface">
                {modalMode === "ADD" ? "Tạo câu hỏi mới" : "Chỉnh sửa câu hỏi"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">
                    Chủ đề (Topic)
                  </label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => {
                      setFormData({ ...formData, topic: e.target.value });
                      setFormErrors({ ...formErrors, topic: "" });
                    }}
                    className={`w-full p-2.5 bg-surface-container-low border rounded-lg focus:ring-2 focus:outline-none ${formErrors.topic ? "border-red-500 focus:ring-red-500" : "border-outline-variant focus:ring-primary"}`}
                    placeholder="VD: Unit 1:..."
                  />
                  {formErrors.topic && (
                    <p className="text-red-500 text-sm mt-1.5 font-medium">
                      {formErrors.topic}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">
                    Độ khó
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value })
                    }
                    className="w-full p-2.5 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="EASY">Dễ</option>
                    <option value="MEDIUM">Trung bình</option>
                    <option value="HARD">Khó</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">
                  Nội dung câu hỏi
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    setFormErrors({ ...formErrors, content: "" });
                  }}
                  rows="3"
                  className={`w-full p-3 bg-surface-container-low border rounded-lg focus:ring-2 focus:outline-none resize-y ${formErrors.content ? "border-red-500 focus:ring-red-500" : "border-outline-variant focus:ring-primary"}`}
                  placeholder="Nhập nội dung câu hỏi vào đây..."
                ></textarea>
                {formErrors.content && (
                  <p className="text-red-500 text-sm mt-1.5 font-medium">
                    {formErrors.content}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-3">
                  Loại câu hỏi
                </label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q_type"
                      value="MCQ"
                      checked={formData.type === "MCQ"}
                      onChange={() => setFormData({ ...formData, type: "MCQ" })}
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-medium">Trắc nghiệm (MCQ)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="q_type"
                      value="ESSAY"
                      checked={formData.type === "ESSAY"}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          type: "ESSAY",
                          correctAnswer: "",
                          options: [],
                        })
                      }
                      className="w-5 h-5 text-primary"
                    />
                    <span className="font-medium">Tự luận (Essay)</span>
                  </label>
                </div>

                {formData.type === "MCQ" && (
                  <div
                    className={`bg-surface-container-lowest p-4 rounded-xl border ${formErrors.correctAnswer ? "border-red-500 bg-red-50" : "border-outline-variant"}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-sm font-bold text-primary mb-3">
                        Nhập các lựa chọn & Tích vào đáp án đúng:
                      </p>
                    </div>
                    {formErrors.correctAnswer && (
                      <p className="text-red-500 text-sm mb-3 font-medium">
                        {formErrors.correctAnswer}
                      </p>
                    )}
                    <div className="space-y-3">
                      {["A", "B", "C", "D"].map((label, index) => (
                        <div key={label} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="correct_ans"
                            checked={
                              formData.correctAnswer ===
                                formData.options[index] &&
                              formData.options[index] !== ""
                            }
                            onChange={() => {
                              setFormData({
                                ...formData,
                                correctAnswer: formData.options[index],
                              });
                              setFormErrors({
                                ...formErrors,
                                correctAnswer: "",
                              });
                            }}
                            className="w-5 h-5 text-green-500 cursor-pointer"
                          />
                          <span className="font-bold w-6">{label}.</span>
                          <input
                            type="text"
                            value={formData.options[index]}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[index] = e.target.value;
                              let newCorrect = formData.correctAnswer;
                              if (
                                formData.correctAnswer ===
                                formData.options[index]
                              ) {
                                newCorrect = e.target.value;
                              }
                              setFormData({
                                ...formData,
                                options: newOptions,
                                correctAnswer: newCorrect,
                              });
                            }}
                            className="flex-1 p-2 bg-white border border-outline-variant rounded-lg focus:border-primary focus:outline-none"
                            placeholder={`Nhập lựa chọn ${label}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 text-on-surface-variant font-bold hover:bg-surface-container-low rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all shadow-md"
              >
                {modalMode === "ADD" ? "Tạo câu hỏi" : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POPUP 2: XEM CHI TIẾT CÂU HỎI (PREVIEW) */}
      {/* ========================================== */}
      {isViewModalOpen && viewingQuestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">
                  visibility
                </span>
                Chi tiết câu hỏi
              </h3>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-2 hover:bg-surface-container-low rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {renderDifficultyBadge(viewingQuestion.difficulty)}
                <span className="px-3 py-1 bg-surface-container-high text-on-surface text-[12px] font-bold rounded-full uppercase border border-outline-variant">
                  {viewingQuestion.type === "MCQ" ? "Trắc nghiệm" : "Tự luận"}
                </span>
              </div>

              {/* Topic */}
              <div>
                <p className="text-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wide">
                  Chủ đề:
                </p>
                <p className="text-lg font-medium text-primary">
                  {viewingQuestion.topic || "Chưa phân loại"}
                </p>
              </div>

              {/* Content */}
              <div>
                <p className="text-sm font-bold text-on-surface-variant mb-2 uppercase tracking-wide">
                  Nội dung câu hỏi:
                </p>
                <div className="p-5 bg-surface-container-lowest border-2 border-outline-variant rounded-xl text-lg font-medium text-on-surface whitespace-pre-wrap">
                  {viewingQuestion.content}
                </div>
              </div>

              {/* Options (Nếu là Trắc nghiệm) */}
              {viewingQuestion.type === "MCQ" &&
                viewingQuestion.options &&
                viewingQuestion.options.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-on-surface-variant mb-3 uppercase tracking-wide">
                      Các đáp án:
                    </p>
                    <div className="space-y-3">
                      {viewingQuestion.options.map((opt, idx) => {
                        if (!opt) return null; // Bỏ qua nếu option trống
                        const isCorrect = opt === viewingQuestion.correctAnswer;
                        const label = String.fromCharCode(65 + idx); // A, B, C, D
                        return (
                          <div
                            key={idx}
                            className={`p-4 border-2 rounded-xl flex items-center gap-4 transition-colors ${
                              isCorrect
                                ? "border-green-500 bg-green-50/50"
                                : "border-outline-variant bg-surface-container-lowest"
                            }`}
                          >
                            <div
                              className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${
                                isCorrect
                                  ? "bg-green-500 text-white shadow-sm"
                                  : "bg-surface-container-high text-on-surface"
                              }`}
                            >
                              {label}
                            </div>
                            <span
                              className={`flex-1 text-lg font-medium ${isCorrect ? "text-green-800" : "text-on-surface"}`}
                            >
                              {opt}
                            </span>
                            {isCorrect && (
                              <span
                                className="material-symbols-outlined text-green-500 text-3xl"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                check_circle
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-lowest flex justify-end">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-8 py-2.5 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container-highest transition-colors"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POPUP 3: THÔNG BÁO THÀNH CÔNG (MÀU XANH)   */}
      {/* ========================================== */}
      {successMessage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center border-2 border-green-500 shadow-2xl">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span
                className="material-symbols-outlined text-4xl text-green-600 font-bold"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </div>
            <h3 className="text-xl font-bold text-green-600 mb-2">
              Tuyệt vời!
            </h3>
            <p className="mb-6 text-gray-700 font-medium">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage("")}
              className="px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors mx-auto block shadow-md"
            >
              Quay lại
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POPUP 4: THÔNG BÁO LỖI BACKEND (MÀU ĐỎ)    */}
      {/* ========================================== */}
      {errorMessage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center border-2 border-red-500 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span
                className="material-symbols-outlined text-4xl text-red-600 font-bold"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                error
              </span>
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Không thể thực hiện!
            </h3>
            <p className="mb-6 text-gray-700 font-medium">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage("")}
              className="px-8 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors mx-auto block shadow-md"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </main>
  );
};

export default QuestionBank;
