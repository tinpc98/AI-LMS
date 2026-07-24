import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { useNavigate } from "react-router-dom";

const ExamManagement = () => {
  const navigate = useNavigate();
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    upcoming: 0,
    completed: 0,
  });
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedExamDetail, setSelectedExamDetail] = useState<any>(null);

  // 1. STATE FORM TẠO KỲ THI
  const initialFormState = {
    title: "",
    topic: "",
    duration: 0,
    startTime: "",
    mcqCount: 0,
    mcqPoints: 0,
    essayCount: 0,
    essayPoints: 0,
    classId: "",
  };
  const [examForm, setExamForm] = useState<any>(initialFormState);

  // HÀM TÍNH TOÁN TRẠNG THÁI REAL-TIME (Dựa vào thời gian và DB)
  const getExamStatusInfo = (exam: any) => {
    if (!exam) return { id: "unknown", label: "Không xác định", color: "bg-gray-100 text-gray-700" };
    const now = new Date().getTime();
    const start = new Date(exam.startTime).getTime();
    const end = start + exam.duration * 60000;

    // Giả sử sau này bạn chấm điểm xong, đổi status thành GRADED trong DB
    if (exam.status === "GRADED")
      return {
        id: "completed",
        label: "Hoàn thành",
        color: "bg-gray-100 text-gray-700",
      };

    if (now < start)
      return {
        id: "upcoming",
        label: "Chưa diễn ra",
        color: "bg-blue-100 text-blue-700",
      };
    if (now >= start && now <= end)
      return {
        id: "ongoing",
        label: "Đang diễn ra",
        color: "bg-green-100 text-green-700",
      };

    // Đã qua thời gian end nhưng chưa được chấm (DB đang là COMPLETED)
    return {
      id: "grading",
      label: "Kết thúc chưa chấm",
      color: "bg-orange-100 text-orange-700",
    };
  };

  // LOGIC LỌC DANH SÁCH KỲ THI
  const filteredExams = exams.filter((exam) => {
    const matchClass = filterClass === "all" || exam.classId === filterClass;
    const matchStatus =
      filterStatus === "all" || getExamStatusInfo(exam).id === filterStatus;
    return matchClass && matchStatus;
  });
  // 2. STATE VALIDATE LỖI INPUT
  const [errors, setErrors] = useState({});

  // 3. STATE POPUP THÔNG BÁO CHUNG (Thay thế alert)
  const [popup, setPopup] = useState({
    isOpen: false,
    type: "success", // 'success' hoặc 'error'
    message: "",
  });

  // LẤY DANH SÁCH LỚP KHI MỞ TRANG
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await axiosClient.get("/api/classes");
        setClasses(response.data.data || response.data || []);
      } catch (error) {
        console.error("Lỗi khi tải danh sách lớp học:", error);
      }
    };
    const fetchExams = async () => {
      try {
        // Đổi endpoint này cho khớp với API lấy danh sách kỳ thi của GV bên backend
        const response = await axiosClient.get("/api/exams");
        const examData = response.data.data || response.data || [];
        setExams(examData);

        const now = new Date().getTime();
        let ongoing = 0,
          upcoming = 0,
          completed = 0;

        examData.forEach((exam) => {
          const start = new Date(exam.startTime).getTime();
          const end = start + exam.duration * 60000; // Đổi phút ra milliseconds

          if (now < start) upcoming++;
          else if (now >= start && now <= end) ongoing++;
          else completed++;
        });

        setStats({
          total: examData.length,
          ongoing,
          upcoming,
          completed,
        });
      } catch (error) {
        console.error("Lỗi khi tải danh sách kỳ thi:", error);
      }
    };
    fetchClasses();
    fetchExams();
  }, []);

  // XỬ LÝ ĐÓNG MODAL VÀ XÓA TRẮNG DỮ LIỆU
  const handleCloseModal = () => {
    setIsExamModalOpen(false);
    setExamForm(initialFormState); // Trả form về rỗng
    setErrors({}); // Xóa hết cảnh báo lỗi
  };

  // XỬ LÝ NHẬP LIỆU REAL-TIME (Gõ đến đâu, xóa lỗi đến đó)
  const handleInputChange = (field, value) => {
    setExamForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  // 4. HÀM VALIDATE VÀ TẠO KỲ THI
  const handleCreateExam = async () => {
    let newErrors = {};

    // Validate các trường input cơ bản
    if (!examForm.title.trim()) newErrors.title = "Vui lòng nhập tên kỳ thi.";
    if (!examForm.topic) newErrors.topic = "Vui lòng chọn chủ đề đề thi.";
    if (!examForm.classId) newErrors.classId = "Vui lòng chọn lớp tham gia.";
    if (!examForm.startTime)
      newErrors.startTime = "Vui lòng chọn thời gian bắt đầu.";
    if (examForm.duration <= 0)
      newErrors.duration = "Thời lượng phải lớn hơn 0 phút.";

    // Nếu có lỗi ở các trường input, dừng lại và hiển thị lỗi qua thẻ <p>
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Validate Logic Nghiệp vụ: Tổng điểm tối đa = 10 (Sử dụng Popup)
    const totalScore =
      parseFloat(examForm.mcqPoints) + parseFloat(examForm.essayPoints);
    if (totalScore > 10) {
      setPopup({
        isOpen: true,
        type: "error",
        message: `Tổng điểm hiện tại là ${totalScore}. Điểm số không được vượt quá mốc 10 điểm!`,
      });
      return;
    }

    try {
      await axiosClient.post("/api/exams/generate-auto", examForm);

      setPopup({
        isOpen: true,
        type: "success",
        message: "Tuyệt vời! Kỳ thi đã được tạo thành công.",
      });

      handleCloseModal(); // Đóng popup và tự động reset form

      // TODO: Có thể gọi lại API fetch danh sách kỳ thi ở đây
    } catch (error) {
      setPopup({
        isOpen: true,
        type: "error",
        message:
          "Lỗi hệ thống: " + (error.response?.data?.message || error.message),
      });
    }
  };

  return (
    <main className="ml-[280px] pt-16 min-h-screen">
      <div className="max-w-[1440px] mx-auto p-8">
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
          <button
            onClick={() => setIsExamModalOpen(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 shadow-lg shadow-primary/10 transition-all"
          >
            <span className="material-symbols-outlined" data-icon="add">
              add
            </span>
            Tạo kỳ thi mới
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2 bg-primary/10 text-primary rounded-lg material-symbols-outlined">
                list_alt
              </span>
              <span className="text-label-md text-primary font-bold">+12%</span>
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Tổng số kỳ thi
            </p>
            <h3 className="text-headline-md font-bold text-on-surface">
              {stats.total.toString().padStart(2, "0")}
            </h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2 bg-green-100 text-green-700 rounded-lg material-symbols-outlined">
                pause
              </span>
              <span className="text-label-md text-green-600 font-bold">
                Hoạt động
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Đang diễn ra
            </p>
            <h3 className="text-headline-md font-bold text-on-surface">
              {stats.ongoing.toString().padStart(2, "0")}
            </h3>{" "}
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2 bg-blue-100 text-blue-700 rounded-lg material-symbols-outlined">
                calendar_month
              </span>
              <span className="text-label-md text-blue-600 font-bold">
                Sắp tới
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Sắp diễn ra
            </p>
            <h3 className="text-headline-md font-bold text-on-surface">
              {stats.upcoming.toString().padStart(2, "0")}
            </h3>{" "}
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant hover:border-primary/30 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2 bg-secondary-container text-secondary rounded-lg material-symbols-outlined">
                check_circle
              </span>
              <span className="text-label-md text-on-surface-variant font-bold">
                Lưu trữ
              </span>
            </div>
            <p className="text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
              Đã hoàn thành
            </p>
            <h3 className="text-headline-md font-bold text-on-surface">
              {stats.completed.toString().padStart(2, "0")}
            </h3>{" "}
          </div>
        </div>

        {/* Filter & Search Section */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-label-md font-bold text-on-surface mb-2">
                Lọc theo Lớp
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full border-outline-variant rounded-lg text-body-sm focus:ring-primary p-2"
              >
                <option value="all">Tất cả các lớp</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-label-md font-bold text-on-surface mb-2">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full border-outline-variant rounded-lg text-body-sm focus:ring-primary p-2"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="upcoming">Chưa diễn ra</option>
                <option value="ongoing">Đang diễn ra</option>
                <option value="grading">Kết thúc chưa chấm điểm</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exam List Table */}
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant">
                <th className="px-6 py-4 border-b border-outline-variant">
                  Tên kỳ thi
                </th>
                <th className="px-6 py-4 border-b border-outline-variant">
                  Lớp
                </th>
                <th className="px-6 py-4 border-b border-outline-variant">
                  Trạng thái
                </th>
                <th className="px-6 py-4 border-b border-outline-variant">
                  Bắt đầu
                </th>
                <th className="px-6 py-4 border-b border-outline-variant text-center">
                  Số thí sinh
                </th>
                <th className="px-6 py-4 border-b border-outline-variant text-right">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {filteredExams.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-8 text-center text-secondary"
                  >
                    Không tìm thấy kỳ thi nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredExams.map((exam) => {
                  const statusInfo = getExamStatusInfo(exam);
                  // Tìm tên lớp từ classId
                  const clsName =
                    classes.find((c) => c._id === exam.classId)?.className ||
                    "Không xác định";

                  return (
                    <tr
                      key={exam._id}
                      onClick={() => setSelectedExamDetail(exam)} // Bấm vào dòng để xem chi tiết
                      className="hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-5 font-bold text-primary hover:underline">
                        {exam.title}
                      </td>
                      <td className="px-6 py-5">{clsName}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`${statusInfo.color} px-3 py-1 rounded-full text-xs font-bold`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        {new Date(exam.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        , {new Date(exam.startTime).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-6 py-5 text-center">--</td>{" "}
                      {/* Tạm để trống số thí sinh do chưa có API */}
                      <td className="px-6 py-5 text-right">
                        <button className="p-2 text-primary hover:bg-primary-fixed rounded-lg">
                          <span className="material-symbols-outlined">
                            visibility
                          </span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-body-sm text-on-surface-variant border-t border-outline-variant pt-6">
          <p>© 2024 AI-LMS Portal - Module Quản lý thi.</p>
        </footer>
      </div>

      {/* ========================================= */}
      {/* MODAL 1: FORM TẠO KỲ THI (ĐÃ CẬP NHẬT GIAO DIỆN) */}
      {/* ========================================= */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl my-8">
            <div className="p-6 border-b border-outline-variant flex justify-between items-center">
              <h3 className="text-xl font-bold">Tạo kỳ thi mới</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Hàng 1: Tên kỳ thi & Chủ đề */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Tên kỳ thi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className={`w-full p-2.5 bg-surface-container-low border ${errors.title ? "border-red-500 focus:ring-red-500" : "border-outline-variant"} rounded-lg`}
                    placeholder="VD: Kiểm tra 15p - Unit 8"
                    value={examForm.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      {errors.title}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Chủ đề <span className="text-red-500">*</span>
                  </label>
                  <select
                    className={`w-full p-2.5 bg-surface-container-low border ${errors.topic ? "border-red-500" : "border-outline-variant"} rounded-lg`}
                    value={examForm.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                  >
                    <option value="">-- Chọn chủ đề --</option>
                    <option value="Unit 8: Ordering a meal in a restaurant">
                      Unit 8: Restaurant
                    </option>
                    <option value="Unit 9">Unit 9</option>
                  </select>
                  {errors.topic && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      {errors.topic}
                    </p>
                  )}
                </div>
              </div>

              {/* Chọn lớp tham gia (Single Select) */}
              <div>
                <label className="block text-sm font-bold mb-1">
                  Chọn lớp tham gia <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full p-2.5 bg-surface-container-low border ${errors.classId ? "border-red-500" : "border-outline-variant"} rounded-lg`}
                  value={examForm.classId}
                  onChange={(e) => handleInputChange("classId", e.target.value)}
                >
                  <option value="">-- Chọn một lớp học --</option>
                  {classes.length === 0 ? (
                    <option disabled>Đang tải danh sách lớp...</option>
                  ) : (
                    classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.className || `Lớp ID: ${cls._id.slice(-4)}`}
                      </option>
                    ))
                  )}
                </select>
                {errors.classId && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    {errors.classId}
                  </p>
                )}
              </div>

              {/* Thời gian & Thời lượng */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    className={`w-full p-2.5 bg-surface-container-low border ${errors.startTime ? "border-red-500" : "border-outline-variant"} rounded-lg`}
                    value={examForm.startTime}
                    onChange={(e) =>
                      handleInputChange("startTime", e.target.value)
                    }
                  />
                  {errors.startTime && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      {errors.startTime}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">
                    Thời lượng (phút) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={`w-full p-2.5 bg-surface-container-low border ${errors.duration ? "border-red-500" : "border-outline-variant"} rounded-lg`}
                    value={examForm.duration}
                    onChange={(e) =>
                      handleInputChange(
                        "duration",
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                  {errors.duration && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      {errors.duration}
                    </p>
                  )}
                </div>
              </div>

              {/* Cấu trúc đề thi */}
              <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant">
                <p className="font-bold text-primary mb-3">
                  Ma trận đề thi (Tự động Random)
                </p>

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <label className="block text-sm font-bold mb-1">
                      Số câu Trắc nghiệm
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 border border-outline-variant rounded-lg"
                      value={examForm.mcqCount}
                      onChange={(e) =>
                        handleInputChange(
                          "mcqCount",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">
                      Tổng điểm Trắc nghiệm
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-full p-2 border border-outline-variant rounded-lg"
                      value={examForm.mcqPoints}
                      onChange={(e) =>
                        handleInputChange(
                          "mcqPoints",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">
                      Số câu Tự luận
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 border border-outline-variant rounded-lg"
                      value={examForm.essayCount}
                      onChange={(e) =>
                        handleInputChange(
                          "essayCount",
                          parseInt(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold mb-1">
                      Tổng điểm Tự luận
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="w-full p-2 border border-outline-variant rounded-lg"
                      value={examForm.essayPoints}
                      onChange={(e) =>
                        handleInputChange(
                          "essayPoints",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>

                <p className="text-right text-sm font-bold mt-4">
                  Tổng điểm dự kiến:{" "}
                  <span
                    className={`${examForm.mcqPoints + examForm.essayPoints > 10 ? "text-red-500" : "text-primary"} text-lg ml-1`}
                  >
                    {(examForm.mcqPoints + examForm.essayPoints).toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-surface-container flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 font-bold hover:bg-gray-200 rounded-lg transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleCreateExam}
                className="px-8 py-2.5 bg-primary text-white rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-md"
              >
                Tạo kỳ thi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* MODAL 2: POPUP THÔNG BÁO */}
      {/* ========================================= */}
      {popup.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl border border-outline-variant">
            <span
              className={`material-symbols-outlined text-5xl mb-3 ${popup.type === "error" ? "text-red-500" : "text-green-500"}`}
            >
              {popup.type === "error" ? "error" : "check_circle"}
            </span>
            <h3
              className={`text-xl font-bold mb-2 ${popup.type === "error" ? "text-red-600" : "text-green-600"}`}
            >
              {popup.type === "error" ? "Có lỗi xảy ra!" : "Thành công!"}
            </h3>
            <p className="text-gray-700 font-medium mb-6">{popup.message}</p>
            <button
              onClick={() => setPopup({ ...popup, isOpen: false })}
              className={`w-full py-2.5 text-white font-bold rounded-xl transition-colors ${popup.type === "error" ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
      {/* ========================================= */}
      {/* MODAL 3: XEM CHI TIẾT KỲ THI */}
      {/* ========================================= */}
      {selectedExamDetail && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-outline-variant">
            <div className="p-6 border-b border-outline-variant flex justify-between items-start bg-surface-container-lowest">
              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${getExamStatusInfo(selectedExamDetail).color}`}
                >
                  {getExamStatusInfo(selectedExamDetail).label}
                </span>
                <h3 className="text-2xl font-bold text-primary">
                  {selectedExamDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 text-on-surface">
              <div className="flex items-center justify-between py-2 border-b border-dashed border-outline-variant">
                <span className="text-secondary font-medium">
                  Lớp tham gia:
                </span>
                <span className="font-bold">
                  {classes.find((c) => c._id === selectedExamDetail.classId)
                    ?.className || "Không xác định"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dashed border-outline-variant">
                <span className="text-secondary font-medium">
                  Chủ đề (Topic):
                </span>
                <span className="font-bold text-right">
                  {selectedExamDetail.topic}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dashed border-outline-variant">
                <span className="text-secondary font-medium">Bắt đầu:</span>
                <span className="font-bold">
                  {new Date(selectedExamDetail.startTime).toLocaleString(
                    "vi-VN",
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-dashed border-outline-variant">
                <span className="text-secondary font-medium">Thời lượng:</span>
                <span className="font-bold">
                  {selectedExamDetail.duration} phút
                </span>
              </div>

              <div className="bg-surface-container p-4 rounded-xl mt-4">
                <p className="font-bold text-sm mb-2 text-primary">
                  Ma trận điểm số:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>
                    Trắc nghiệm:{" "}
                    <b>
                      {selectedExamDetail.questions?.filter(
                        (q) => q.type === "MCQ",
                      ).length || 0}{" "}
                      câu
                    </b>
                  </p>
                  <p>
                    Tự luận:{" "}
                    <b>
                      {selectedExamDetail.questions?.filter(
                        (q) => q.type === "ESSAY",
                      ).length || 0}{" "}
                      câu
                    </b>
                  </p>
                  <p className="col-span-2 pt-2 mt-2 border-t border-outline-variant">
                    Tổng điểm:{" "}
                    <b className="text-error">
                      {selectedExamDetail.maxScore || 10} điểm
                    </b>
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-surface-container flex justify-end">
              <button
                onClick={() =>
                  navigate(`/teacher/examresults/${selectedExamDetail._id}`)
                }
                className="px-5 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 flex items-center gap-2 shadow-sm transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">
                  assignment_ind
                </span>
                Xem chi tiết
              </button>
              <button
                onClick={() => setSelectedExamDetail(null)}
                className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default ExamManagement;
