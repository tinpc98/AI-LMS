import React, { useState } from "react";
import "../../assets/css/HomePage.css";
// ==========================================================================
// TYPES & INTERFACES
// ==========================================================================
interface ClassItem {
  id: string;
  name: string;
  code: string;
  size: number;
  progress: number;
  nextClass: string;
  attendanceStatus: "chua_diem_danh" | "da_diem_danh";
  iconClass: "toan" | "tin" | "ly";
  icon: string;
}
export default function HomePageTeacher() {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const [classes, setClasses] = useState<ClassItem[]>([
    {
      id: "c1",
      name: "Lớp 10A1 - Toán học",
      code: "TOAN10",
      size: 45,
      progress: 65,
      nextClass: "Thứ 2, 08:00 AM",
      attendanceStatus: "chua_diem_danh",
      iconClass: "toan",
      icon: "functions",
    },
    {
      id: "c2",
      name: "Lớp 11B2 - Tin học",
      code: "TIN11",
      size: 38,
      progress: 42,
      nextClass: "Thứ 3, 10:15 AM",
      attendanceStatus: "chua_diem_danh",
      iconClass: "tin",
      icon: "computer",
    },
    {
      id: "c3",
      name: "Lớp 12C3 - Vật lý",
      code: "LY12",
      size: 42,
      progress: 88,
      nextClass: "Thứ 4, 01:30 PM",
      attendanceStatus: "chua_diem_danh",
      iconClass: "ly",
      icon: "science",
    },
    {
      id: "c4",
      name: "Lớp 12A2 - Toán nâng cao",
      code: "TOAN12NC",
      size: 40,
      progress: 74,
      nextClass: "Thứ 5, 08:00 AM",
      attendanceStatus: "chua_diem_danh",
      iconClass: "toan",
      icon: "calculate",
    },
    {
      id: "c5",
      name: "Lớp 10B3 - Lập trình C++",
      code: "CPP10",
      size: 35,
      progress: 50,
      nextClass: "Thứ 6, 02:00 PM",
      attendanceStatus: "chua_diem_danh",
      iconClass: "tin",
      icon: "code",
    },
    {
      id: "c6",
      name: "Lớp 11C1 - Vật lý Cơ bản",
      code: "LY11",
      size: 39,
      progress: 30,
      nextClass: "Thứ 7, 09:30 AM",
      attendanceStatus: "chua_diem_danh",
      iconClass: "ly",
      icon: "bolt",
    },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const itemsPerPage = 3;
  // Modals visibility state
  const [modalType, setModalType] = useState<
    "class" | "homework" | "exam" | null
  >(null);
  // Form Fields
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassSize, setNewClassSize] = useState("40");
  const [newClassSchedule, setNewClassSchedule] = useState("Thứ 2, 08:00 AM");
  const [hwTitle, setHwTitle] = useState("");
  const [hwClassSelect, setHwClassSelect] = useState("");
  const [hwDeadline, setHwDeadline] = useState("Ngày mai");
  const [examTitle, setExamTitle] = useState("");
  const [examClassSelect, setExamClassSelect] = useState("");
  const [examQuestions, setExamQuestions] = useState("20");
  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info" | "error";
  } | null>(null);
  const triggerToast = (
    message: string,
    type: "success" | "info" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };
  // ==========================================================================
  // HANDLERS
  // ==========================================================================
  const handleAttendance = (id: string) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const wasChecked = c.attendanceStatus === "da_diem_danh";
          const nextStatus = wasChecked ? "chua_diem_danh" : "da_diem_danh";
          const nextSize = wasChecked ? c.size - 1 : c.size + 1; // attendance increment simulation
          triggerToast(
            !wasChecked
              ? `Điểm danh thành công lớp: ${c.name}. Sĩ số trực tuyến: ${nextSize}!`
              : `Đã hủy điểm danh lớp: ${c.name}`,
            "success",
          );
          return { ...c, attendanceStatus: nextStatus, size: nextSize };
        }
        return c;
      }),
    );
  };
  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newClassName.trim() ||
      !newClassCode.trim() ||
      !newClassSchedule.trim()
    ) {
      triggerToast("Vui lòng điền đầy đủ thông tin!", "error");
      return;
    }
    const newClass: ClassItem = {
      id: "c-" + Date.now(),
      name: newClassName,
      code: newClassCode.toUpperCase(),
      size: parseInt(newClassSize) || 40,
      progress: 0,
      nextClass: newClassSchedule,
      attendanceStatus: "chua_diem_danh",
      iconClass: newClassName.toLowerCase().includes("tin")
        ? "tin"
        : newClassName.toLowerCase().includes("lý")
          ? "ly"
          : "toan",
      icon: newClassName.toLowerCase().includes("tin")
        ? "computer"
        : newClassName.toLowerCase().includes("lý")
          ? "science"
          : "functions",
    };
    setClasses((prev) => [newClass, ...prev]);
    setModalType(null);
    setNewClassName("");
    setNewClassCode("");
    triggerToast(
      `Đã tạo thành công lớp học học phần: ${newClassName}!`,
      "success",
    );
  };
  const handleCreateHomeworkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) {
      triggerToast("Vui lòng điền tên bài tập cần giao!", "error");
      return;
    }
    setModalType(null);
    setHwTitle("");
    triggerToast(
      `Đã giao bài tập về nhà mới cho lớp: ${hwClassSelect || classes[0]?.name}!`,
      "success",
    );
  };
  const handleCreateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) {
      triggerToast("Vui lòng điền tên đề kiểm tra!", "error");
      return;
    }
    setModalType(null);
    setExamTitle("");
    triggerToast(
      `Đã công bố đề kiểm tra "${examTitle}" (${examQuestions} câu)!`,
      "success",
    );
  };
  // Filter & Pagination Calculations
  const query = searchQuery.toLowerCase().trim();
  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(query) ||
      c.code.toLowerCase().includes(query),
  );
  const totalItems = filteredClasses.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const clampedPage = Math.min(currentPage, totalPages);
  const startIndex = (clampedPage - 1) * itemsPerPage;
  const paginatedClasses = filteredClasses.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  return (
    <div className={`lms-theme-wrapper ${isDarkTheme ? "dark" : ""}`}>
      <div className="lms-app">
        {/* ==========================================================================
           SIDEBAR (Desktop)
           ========================================================================== */}
        <aside className="lms-sidebar">
          <div className="lms-logo-container">
            <div className="lms-logo-icon">
              <span className="material-symbols-outlined icon-filled">
                school
              </span>
            </div>
            <span className="lms-logo-text">Scholar LMS</span>
          </div>
          <nav className="lms-nav-menu">
            <li className="lms-nav-item active">
              <a href="#">
                <span className="material-symbols-outlined icon-filled">
                  dashboard
                </span>
                <span>Trang chủ</span>
              </a>
            </li>
            <li className="lms-nav-item">
              <a href="#">
                <span className="material-symbols-outlined">school</span>
                <span>Lớp học của tôi</span>
              </a>
            </li>
            <li className="lms-nav-item">
              <a href="#">
                <span className="material-symbols-outlined">edit_note</span>
                <span>Chấm điểm</span>
              </a>
            </li>
            <li className="lms-nav-item">
              <a href="#">
                <span className="material-symbols-outlined">forum</span>
                <span>Hộp thư thoại</span>
              </a>
            </li>
          </nav>
          <div className="lms-sidebar-footer">
            <div className="lms-profile-widget">
              <img
                className="lms-avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVNNzlGhy-GGItcerFxHk-epZGSAkBK1agzSvWs0mQJQd3cFAJxOn2qR-UcnymQJvT3f3dWfahGjZLN_Gb4FAnJ32kY79JW6MofSaohYHr3KeR6KfQM6o7u00zWrZXBXzocMcES_hS8YCw1zMpeTnWegTbOCuh3SbOy2HCGmwe4kYrWZzDU9ZPWVFKKxvlTo03haIlWcByJeBvDXWaa7oLbT1mjgUWLXCVJ4ge656MyWrUiJpwOFLZPKJYkXESAOVp6bYyIyVltXY9"
                alt="Avatar teacher"
              />
              <div className="lms-profile-info">
                <span className="lms-profile-name">Nguyễn An</span>
                <span className="lms-profile-role">Giảng viên chính</span>
              </div>
            </div>
          </div>
        </aside>
        {/* ==========================================================================
           MAIN LAYOUT
           ========================================================================== */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Top Header */}
          <header className="lms-header">
            <div className="lms-header-left">
              <span className="lms-role-badge">Giảng Viên</span>
            </div>
            <div className="lms-header-right">
              {/* Theme switcher */}
              <button
                onClick={() => {
                  setIsDarkTheme(!isDarkTheme);
                  triggerToast(
                    `Đã đổi sang chế độ giao diện ${!isDarkTheme ? "Tối" : "Sáng"}!`,
                    "info",
                  );
                }}
                className="lms-icon-btn"
                title="Đổi giao diện sáng/tối"
              >
                <span className="material-symbols-outlined">
                  {isDarkTheme ? "light_mode" : "dark_mode"}
                </span>
              </button>
              <button className="lms-icon-btn" title="Thông báo mới">
                <span className="material-symbols-outlined">notifications</span>
                <span className="lms-badge-dot"></span>
              </button>
            </div>
          </header>
          {/* Page Content */}
          <main className="lms-main">
            {/* Welcome Header */}
            <section className="lms-welcome-section">
              <div>
                <h2 className="lms-welcome-title">
                  Chào buổi sáng, Thầy Nguyễn An! ☕
                </h2>
                <p className="lms-welcome-subtitle">
                  Dưới đây là tóm tắt hoạt động giảng dạy của bạn trong ngày hôm
                  nay.
                </p>
              </div>
            </section>
            {/* Bento Stats Grid */}
            <section className="lms-bento-grid">
              {/* Stat Card 1: GPA */}
              <div className="lms-card lms-progress-circle-box">
                <div className="lms-progress-text-info">
                  <span className="lms-progress-label">
                    Điểm trung bình lớp
                  </span>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "4px",
                    }}
                  >
                    <span className="lms-progress-val-large">8.5</span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--lms-text-muted)",
                      }}
                    >
                      / 10.0
                    </span>
                  </div>
                  <span className="lms-progress-trend">
                    <span className="material-symbols-outlined text-[16px]">
                      trending_up
                    </span>
                    +0.4 so với đầu kỳ
                  </span>
                </div>
                <div className="lms-ring-svg-container">
                  <svg
                    className="lms-ring-svg"
                    width="80"
                    height="80"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      className="lms-ring-bg"
                      cx="40"
                      cy="40"
                      fill="transparent"
                      r="32"
                      strokeWidth="5"
                    />
                    <circle
                      className="lms-ring-fill"
                      cx="40"
                      cy="40"
                      fill="transparent"
                      r="32"
                      strokeWidth="5"
                      strokeLinecap="round"
                      style={{
                        strokeDashoffset: 201 - (201 * 85) / 100,
                      }}
                    />
                  </svg>
                  <span className="lms-ring-text-center">8.5</span>
                </div>
              </div>
              {/* Stat Card 2: Homework Rate */}
              <div className="lms-card lms-progress-circle-box">
                <div className="lms-progress-text-info">
                  <span className="lms-progress-label">
                    Tỷ lệ hoàn thành bài tập
                  </span>
                  <span className="lms-progress-val-large">92%</span>
                  <span
                    className="lms-progress-trend"
                    style={{ color: "var(--lms-sky)" }}
                  >
                    Ổn định ở mức cao
                  </span>
                </div>
                <div className="lms-ring-svg-container">
                  <svg
                    className="lms-ring-svg"
                    width="80"
                    height="80"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      className="lms-ring-bg"
                      cx="40"
                      cy="40"
                      fill="transparent"
                      r="32"
                      strokeWidth="5"
                    />
                    <circle
                      className="lms-ring-fill"
                      cx="40"
                      cy="40"
                      fill="transparent"
                      r="32"
                      strokeWidth="5"
                      strokeLinecap="round"
                      style={{
                        stroke: "var(--lms-sky)",
                        strokeDashoffset: 201 - (201 * 92) / 100,
                      }}
                    />
                  </svg>
                  <span
                    className="lms-ring-text-center"
                    style={{ color: "var(--lms-sky)" }}
                  >
                    92%
                  </span>
                </div>
              </div>
              {/* Stat Card 3: Online Attendance */}
              <div className="lms-card lms-progress-circle-box">
                <div className="lms-progress-text-info">
                  <span className="lms-progress-label">
                    Tỷ lệ online trực tuyến
                  </span>
                  <span className="lms-progress-val-large">95%</span>
                  <span
                    className="lms-progress-trend"
                    style={{ color: "var(--lms-success)" }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        backgroundColor: "var(--lms-success)",
                        borderRadius: "50%",
                        display: "inline-block",
                        animation: "ping 1.5s infinite",
                      }}
                    ></span>
                    Lớp đang trực tuyến
                  </span>
                </div>
                <div className="lms-ring-svg-container">
                  <svg
                    className="lms-ring-svg"
                    width="80"
                    height="80"
                    style={{ transform: "rotate(-90deg)" }}
                  >
                    <circle
                      className="lms-ring-bg"
                      cx="40"
                      cy="40"
                      fill="transparent"
                      r="32"
                      strokeWidth="5"
                    />
                    <circle
                      className="lms-ring-fill"
                      cx="40"
                      cy="40"
                      fill="transparent"
                      r="32"
                      strokeWidth="5"
                      strokeLinecap="round"
                      style={{
                        stroke: "var(--lms-success)",
                        strokeDashoffset: 201 - (201 * 95) / 100,
                      }}
                    />
                  </svg>
                  <span
                    className="lms-ring-text-center"
                    style={{ color: "var(--lms-success)" }}
                  >
                    95%
                  </span>
                </div>
              </div>
            </section>
            {/* Quick Actions Section */}
            <section
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <h3 className="lms-section-title">Thao tác nhanh</h3>
              <div className="lms-action-grid">
                {/* Button: Create class */}
                <button
                  onClick={() => setModalType("class")}
                  className="lms-action-card brand"
                >
                  <div className="lms-action-card-text">
                    <h4 className="lms-action-card-title">Tạo lớp học</h4>
                    <p className="lms-action-card-desc">
                      Thiết lập thêm một lớp học học phần mới
                    </p>
                  </div>
                  <span className="material-symbols-outlined lms-action-card-bg-icon">
                    add_business
                  </span>
                </button>
                {/* Button: Create homework */}
                <button
                  onClick={() => setModalType("homework")}
                  className="lms-action-card secondary"
                >
                  <div className="lms-action-card-text">
                    <h4 className="lms-action-card-title">Giao bài tập</h4>
                    <p className="lms-action-card-desc">
                      Giao nhiệm vụ tự học cho học sinh
                    </p>
                  </div>
                  <span className="material-symbols-outlined lms-action-card-bg-icon">
                    edit_document
                  </span>
                </button>
                {/* Button: Create exam */}
                <button
                  onClick={() => setModalType("exam")}
                  className="lms-action-card tertiary"
                >
                  <div className="lms-action-card-text">
                    <h4 className="lms-action-card-title">Tạo đề thi</h4>
                    <p className="lms-action-card-desc">
                      Kiểm tra đánh giá năng lực học sinh
                    </p>
                  </div>
                  <span className="material-symbols-outlined lms-action-card-bg-icon">
                    assignment_turned_in
                  </span>
                </button>
              </div>
            </section>
            {/* Active Classes Table Section */}
            <section className="lms-table-card">
              <div
                className="lms-table-header"
                style={{
                  padding: "24px 24px 18px",
                  borderBottom: "1px solid var(--lms-card-border)",
                }}
              >
                <h3 className="lms-section-title">Lớp học đang hoạt động</h3>

                {/* Search filter input */}
                <div className="lms-search-wrapper">
                  <input
                    type="text"
                    placeholder="Tìm kiếm lớp học..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="lms-search-input"
                  />
                  <span className="material-symbols-outlined lms-search-icon">
                    search
                  </span>
                </div>
              </div>
              <div className="lms-table-responsive">
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>Tên lớp học</th>
                      <th>Mã lớp</th>
                      <th>Sĩ số</th>
                      <th>Tiến độ bài học</th>
                      <th>Bài học tiếp theo</th>
                      <th style={{ textAlign: "right" }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedClasses.map((cls) => (
                      <tr key={cls.id}>
                        <td>
                          <div className="lms-class-info">
                            <div
                              className={`lms-class-icon-box ${cls.iconClass}`}
                            >
                              <span className="material-symbols-outlined">
                                {cls.icon}
                              </span>
                            </div>
                            <span className="lms-class-name">{cls.name}</span>
                          </div>
                        </td>
                        <td>
                          <code
                            style={{
                              fontSize: "11px",
                              backgroundColor: "var(--lms-bg-secondary)",
                              padding: "3px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {cls.code}
                          </code>
                        </td>
                        <td>{cls.size} học sinh</td>
                        <td>
                          <div className="lms-table-progress-container">
                            <div className="lms-table-progress-bg">
                              <div
                                className="lms-table-progress-fill"
                                style={{ width: `${cls.progress}%` }}
                              ></div>
                            </div>
                            <span className="lms-table-progress-text">
                              {cls.progress}%
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="lms-schedule-badge">
                            {cls.nextClass}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            onClick={() => handleAttendance(cls.id)}
                            className={`lms-table-btn ${cls.attendanceStatus === "da_diem_danh" ? "checked" : ""}`}
                          >
                            {cls.attendanceStatus === "da_diem_danh"
                              ? "Đã điểm danh"
                              : "Điểm danh"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {paginatedClasses.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "var(--lms-text-muted)",
                            fontSize: "12px",
                          }}
                        >
                          Không tìm thấy lớp học nào phù hợp!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              <div className="lms-pagination">
                <div className="lms-pagination-controls">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={clampedPage === 1}
                    className="lms-page-btn"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "16px" }}
                    >
                      chevron_left
                    </span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`lms-page-btn ${clampedPage === i + 1 ? "active" : ""}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={clampedPage === totalPages}
                    className="lms-page-btn"
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "16px" }}
                    >
                      chevron_right
                    </span>
                  </button>
                </div>
              </div>
            </section>
          </main>
          {/* Mobile bottom nav */}
          <nav className="lms-mobile-nav">
            <button className="lms-mobile-item active">
              <span className="material-symbols-outlined icon-filled">
                home
              </span>
              <span>Trang chủ</span>
            </button>
            <button className="lms-mobile-item">
              <span className="material-symbols-outlined">school</span>
              <span>Lớp học</span>
            </button>
            <button className="lms-mobile-item">
              <span className="material-symbols-outlined">edit_note</span>
              <span>Chấm điểm</span>
            </button>
            <button className="lms-mobile-item">
              <span className="material-symbols-outlined">forum</span>
              <span>Hộp thư</span>
            </button>
          </nav>
        </div>
        {/* ==========================================================================
           MODALS (Quick Actions Form popups)
           ========================================================================== */}

        {/* 1. Create Class Modal */}
        {modalType === "class" && (
          <div className="lms-modal-overlay">
            <div className="lms-modal">
              <div className="lms-modal-header">
                <span className="lms-modal-title">Thiết lập lớp học mới</span>
                <button
                  onClick={() => setModalType(null)}
                  className="lms-modal-close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                onSubmit={handleCreateClassSubmit}
                className="lms-modal-body"
              >
                <div className="lms-form-group">
                  <label>Tên môn học / lớp học</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Lớp 11A3 - Giải tích"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    required
                  />
                </div>
                <div className="lms-form-group">
                  <label>Mã lớp học phần</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: TOAN11GT"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    required
                  />
                </div>
                <div className="lms-form-group">
                  <label>Sĩ số lớp dự kiến</label>
                  <input
                    type="number"
                    value={newClassSize}
                    onChange={(e) => setNewClassSize(e.target.value)}
                    required
                  />
                </div>
                <div className="lms-form-group">
                  <label>Lịch dạy tiếp theo</label>
                  <input
                    type="text"
                    value={newClassSchedule}
                    onChange={(e) => setNewClassSchedule(e.target.value)}
                    required
                  />
                </div>
                <div className="lms-modal-footer">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="lms-btn cancel"
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="lms-btn confirm">
                    Xác nhận
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* 2. Create Homework Modal */}
        {modalType === "homework" && (
          <div className="lms-modal-overlay">
            <div className="lms-modal">
              <div className="lms-modal-header">
                <span className="lms-modal-title">Giao bài tập về nhà</span>
                <button
                  onClick={() => setModalType(null)}
                  className="lms-modal-close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                onSubmit={handleCreateHomeworkSubmit}
                className="lms-modal-body"
              >
                <div className="lms-form-group">
                  <label>Tên bài tập / nhiệm vụ tự học</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đọc chương 3 và làm bài tập 1, 2"
                    value={hwTitle}
                    onChange={(e) => setHwTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="lms-form-group">
                  <label>Chọn lớp giao bài</label>
                  <select
                    value={hwClassSelect}
                    onChange={(e) => setHwClassSelect(e.target.value)}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lms-form-group">
                  <label>Hạn nộp bài</label>
                  <select
                    value={hwDeadline}
                    onChange={(e) => setHwDeadline(e.target.value)}
                  >
                    <option value="Còn 4 giờ">
                      Trong ngày hôm nay (4 giờ nữa)
                    </option>
                    <option value="Ngày mai">Ngày mai</option>
                    <option value="3 ngày nữa">3 ngày nữa</option>
                    <option value="Tuần sau">Tuần sau</option>
                  </select>
                </div>
                <div className="lms-modal-footer">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="lms-btn cancel"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="lms-btn confirm"
                    style={{ backgroundColor: "var(--lms-sky)" }}
                  >
                    Giao bài tập
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* 3. Create Exam Modal */}
        {modalType === "exam" && (
          <div className="lms-modal-overlay">
            <div className="lms-modal">
              <div className="lms-modal-header">
                <span className="lms-modal-title">
                  Tạo đề thi trắc nghiệm mới
                </span>
                <button
                  onClick={() => setModalType(null)}
                  className="lms-modal-close"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form
                onSubmit={handleCreateExamSubmit}
                className="lms-modal-body"
              >
                <div className="lms-form-group">
                  <label>Tên đề thi / bài kiểm tra</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Kiểm tra 15 phút số 3"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="lms-form-group">
                  <label>Lớp đánh giá học vụ</label>
                  <select
                    value={examClassSelect}
                    onChange={(e) => setExamClassSelect(e.target.value)}
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lms-form-group">
                  <label>Số lượng câu hỏi trắc nghiệm</label>
                  <input
                    type="number"
                    value={examQuestions}
                    onChange={(e) => setExamQuestions(e.target.value)}
                    min="5"
                    max="100"
                    required
                  />
                </div>
                <div className="lms-modal-footer">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="lms-btn cancel"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    className="lms-btn confirm"
                    style={{ backgroundColor: "var(--lms-text-primary)" }}
                  >
                    Tạo đề thi
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* ==========================================================================
           TOAST SYSTEM
           ========================================================================== */}
        {toast && (
          <div className="lms-toast-container">
            <div className={`lms-toast ${toast.type}`}>
              <span className="material-symbols-outlined lms-toast-icon">
                {toast.type === "success"
                  ? "check_circle"
                  : toast.type === "info"
                    ? "info"
                    : "error"}
              </span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
