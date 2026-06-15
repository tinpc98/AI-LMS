import React, { useState, useEffect, useRef, useCallback } from "react";
import "./HomePage.css";

// ==========================================================================
// TYPES & INTERFACES
// ==========================================================================
interface Todo {
  id: string;
  title: string;
  subject: string;
  deadline: string;
  deadlineType: "error" | "warning" | "info";
  completed: boolean;
}

interface ChatMessage {
  id: string;
  sender: "ai" | "user";
  text: string;
}

// Helper an toàn thay thế cho dangerouslySetInnerHTML để tránh XSS
const renderSafeMarkdown = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

export default function HomePageStudent() {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const [todos, setTodos] = useState<Todo[]>([
    {
      id: "t1",
      title: "Bài tập: Giải thuật sắp xếp",
      subject: "Cấu trúc dữ liệu & Giải thuật",
      deadline: "Còn 2 giờ",
      deadlineType: "error",
      completed: false,
    },
    {
      id: "t2",
      title: "Kiểm tra: Database Design",
      subject: "Hệ quản trị CSDL",
      deadline: "Ngày mai",
      deadlineType: "warning",
      completed: false,
    },
    {
      id: "t3",
      title: "Lab 4: Linux Commands",
      subject: "Hệ điều hành",
      deadline: "3 ngày nữa",
      deadlineType: "info",
      completed: false,
    },
  ]);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: "init-msg",
      sender: "ai",
      text: "Chào Minh Anh! Mình là **AI Scholar**. Mình có thể giúp gì cho bạn hôm nay?",
    },
  ]);

  const [chatInput, setChatInput] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hoveredGpaIndex, setHoveredGpaIndex] = useState<number | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  // Todo Modal Form State
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoSubject, setNewTodoSubject] = useState("");
  const [newTodoDeadline, setNewTodoDeadline] = useState("Ngày mai");

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // FIX lỗi ts(2503): Thay đổi NodeJS.Timeout bằng ReturnType an toàn cho Browser
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timers khi component unmount để tránh Memory Leak
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
    };
  }, []);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, aiTyping]);

  // ==========================================================================
  // TOAST HANDLER
  // ==========================================================================
  const triggerToast = useCallback((message: string, type: "success" | "info" | "error" = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // ==========================================================================
  // HANDLERS (useCallback Optimized)
  // ==========================================================================
  const handleToggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          triggerToast(
            nextCompleted ? `Đã hoàn thành: ${t.title}! 🎉` : `Đã mở lại: ${t.title}`,
            "success"
          );
          return { ...t, completed: nextCompleted };
        }
        return t;
      })
    );
  }, [triggerToast]);

  const handleSubmitTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          triggerToast(`Nộp bài tập thành công: ${t.title}! 📤`, "success");
          return { ...t, completed: true };
        }
        return t;
      })
    );
  }, [triggerToast]);

  const handleAddTodoSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || !newTodoSubject.trim()) {
      triggerToast("Vui lòng điền đầy đủ thông tin!", "error");
      return;
    }

    let type: "error" | "warning" | "info" = "info";
    if (newTodoDeadline.includes("giờ")) type = "error";
    else if (newTodoDeadline.includes("mai")) type = "warning";

    // Sử dụng mã hóa an toàn để tạo ID không trùng lặp
    const uniqueId = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : "t-" + Date.now() + Math.random().toString(36).substr(2, 4);

    const newTodo: Todo = {
      id: uniqueId,
      title: newTodoTitle.trim(),
      subject: newTodoSubject.trim(),
      deadline: newTodoDeadline,
      deadlineType: type,
      completed: false,
    };

    setTodos((prev) => [...prev, newTodo]);
    setIsTodoModalOpen(false);
    setNewTodoTitle("");
    setNewTodoSubject("");
    triggerToast(`Đã thêm việc cần làm: "${newTodoTitle}"!`, "success");
  }, [newTodoTitle, newTodoSubject, newTodoDeadline, triggerToast]);

  const handleSendChatMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    const userMsgId = "user-" + Date.now();
    setChatHistory((prev) => [...prev, { id: userMsgId, sender: "user", text }]);
    setAiTyping(true);

    if (aiTimerRef.current) clearTimeout(aiTimerRef.current);

    aiTimerRef.current = setTimeout(() => {
      setAiTyping(false);
      let response = "Mình đã lưu lại câu hỏi. Mình đề xuất bạn xem thêm bài giảng và tài liệu PDF tương ứng.";

      const query = text.toLowerCase();
      if (query.includes("chao") || query.includes("hello")) {
        response = "Chào Minh Anh! Mình có thể giúp gì cho mục tiêu học tập tuần này của bạn?";
      } else if (query.includes("linux") || query.includes("hệ điều hành")) {
        response = "Đối với **Linux**, các câu lệnh cần ghi nhớ bao gồm `ls` (liệt kê file), `cd` (di chuyển), và `grep` (tìm kiếm). Bạn có muốn mình soạn bài tập trắc nghiệm ngắn về Linux không?";
      } else if (query.includes("db") || query.includes("database") || query.includes("csdl")) {
        response = "Về chuẩn hóa **Database Design**, hãy ghi nhớ 3 mức chuẩn:\n1. **1NF:** Giá trị nguyên tố.\n2. **2NF:** Không có phụ thuộc bộ phận vào khóa chính.\n3. **3NF:** Không có phụ thuộc bắc cầu vào khóa chính.";
      } else if (query.includes("gpa") || query.includes("điểm")) {
        response = "Hiện tại GPA của bạn đang là **8.4**. Để nâng lên **8.8**, hãy luyện tập thêm phần *Giải thuật tìm kiếm* (hiện mới đạt 33%).";
      }

      const aiMsgId = "ai-" + Date.now();
      setChatHistory((prev) => [...prev, { id: aiMsgId, sender: "ai", text: response }]);
      triggerToast("Trợ lý AI vừa phản hồi!", "info");
    }, 1500);
  }, [triggerToast]);

  // Dynamic values
  const totalTodos = todos.length;
  const completedTodos = todos.filter((t) => t.completed).length;
  const todoProgress = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
  const gpaData = [7.2, 7.8, 8.0, 8.5, 8.2, 8.4];
  const activeGpaIndex = hoveredGpaIndex !== null ? hoveredGpaIndex : gpaData.length - 1;
  const activeGpa = gpaData[activeGpaIndex];

  return (
    <div className={`lms-theme-wrapper ${isDarkTheme ? "dark" : ""}`}>
      <div className="lms-app">
        {/* SIDEBAR */}
        <aside className="lms-sidebar">
          <div className="lms-logo-container">
            <div className="lms-logo-icon">
              <span className="material-symbols-outlined icon-filled">school</span>
            </div>
            <span className="lms-logo-text">Scholar LMS</span>
          </div>
          <nav className="lms-nav-menu">
            {/* FIX: Thêm cặp thẻ ul bọc ngoài các thẻ li để tránh lỗi Semantic HTML */}
            <ul>
              <li className="lms-nav-item active">
                <a href="#dashboard">
                  <span className="material-symbols-outlined icon-filled">dashboard</span>
                  <span>Trang chủ</span>
                </a>
              </li>
              <li className="lms-nav-item">
                <a href="#courses">
                  <span className="material-symbols-outlined">menu_book</span>
                  <span>Khóa học của tôi</span>
                </a>
              </li>
              <li className="lms-nav-item">
                <a href="#assignments">
                  <span className="material-symbols-outlined">edit_note</span>
                  <span>Nộp bài tập</span>
                </a>
              </li>
              <li className="lms-nav-item">
                <a href="#forum">
                  <span className="material-symbols-outlined">forum</span>
                  <span>Hộp thư thoại</span>
                </a>
              </li>
            </ul>
          </nav>
          <div className="lms-sidebar-footer">
            <div className="lms-profile-widget">
              <img
                className="lms-avatar"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkQFxlJRTq8GL9fEZbHjA7Hc3jgJXxkKh1syAgR1lbJ4LHb6gEmXTueRbg4z90fzPh5dW1BCO886wPgWR-14JDQ4YcFII_wf3ScBfMuhxIv-6ZvZBY8JvqS4ejzaByjOs20chmkZ9jtycHZ-gRbauxuTQ2CN-nlhCbtaCiwtiugSZ0KscDgbQ23FSJoH_b8hvNXk3Ul3tQQR2xliBOyMYXAHeisMuZPZ6_3O6s7DHwA4j4cwbe4Y3OHwc7wLja71jezmhLsWWSUrtq"
                alt="Avatar student"
              />
              <div className="lms-profile-info">
                <span className="lms-profile-name">Minh Anh</span>
                <span className="lms-profile-role">MSSV: SV8902</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN LAYOUT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <header className="lms-header">
            <div className="lms-header-left">
              <span className="lms-role-badge">Sinh Viên</span>
            </div>
            <div className="lms-header-right">
              <button
                onClick={() => {
                  setIsDarkTheme(!isDarkTheme);
                  triggerToast(`Đã đổi sang chế độ giao diện ${!isDarkTheme ? "Tối" : "Sáng"}!`, "info");
                }}
                className="lms-icon-btn"
                title="Đổi giao diện sáng/tối"
              >
                <span className="material-symbols-outlined">{isDarkTheme ? "light_mode" : "dark_mode"}</span>
              </button>
              <button className="lms-icon-btn" title="Thông báo mới">
                <span className="material-symbols-outlined">notifications</span>
                <span className="lms-badge-dot"></span>
              </button>
            </div>
          </header>

          <main className="lms-main">
            <section className="lms-welcome-section">
              <div>
                <h2 className="lms-welcome-title">Chào mừng trở lại, Minh Anh! 👋</h2>
                <p className="lms-welcome-subtitle">
                  Bạn đã hoàn thành {todoProgress}% mục tiêu bài tập được giao. Cố gắng giữ phong độ nhé!
                </p>
              </div>
            </section>

            <section className="lms-bento-grid">
              {/* Progress Circle */}
              <div className="lms-card lms-progress-circle-box">
                <div className="lms-progress-text-info">
                  <span className="lms-progress-label">Tiến độ học tập</span>
                  <span className="lms-progress-val-large">78%</span>
                  <span className="lms-progress-trend">
                    <span className="material-symbols-outlined text-[16px]">trending_up</span>
                    +5% so với tháng trước
                  </span>
                </div>

                <div className="lms-ring-svg-container">
                  <svg className="lms-ring-svg" width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                    <circle className="lms-ring-bg" cx="40" cy="40" fill="transparent" r="32" strokeWidth="5" />
                    <circle
                      className="lms-ring-fill"
                      cx="40"
                      cy="40"
                      fill="transparent"
                      r="32"
                      strokeWidth="5"
                      strokeLinecap="round"
                      style={{ strokeDashoffset: 201 - (201 * 78) / 100 }}
                    />
                  </svg>
                  <span className="lms-ring-text-center">78%</span>
                </div>
              </div>

              {/* GPA Chart */}
              <div className="lms-card">
                <div className="lms-gpa-container">
                  <div className="lms-gpa-header">
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span className="lms-progress-label">GPA Kỳ {activeGpaIndex + 1}</span>
                      <span className="lms-progress-val-large">{activeGpa.toFixed(1)}</span>
                    </div>
                    <span className="lms-gpa-tag">Học bạ</span>
                  </div>

                  <div className="lms-chart-bars">
                    {gpaData.map((val, idx) => {
                      const isActive = idx === activeGpaIndex;
                      return (
                        <div
                          key={idx}
                          className={`lms-chart-col ${isActive ? "active" : ""}`}
                          onMouseEnter={() => setHoveredGpaIndex(idx)}
                          onMouseLeave={() => setHoveredGpaIndex(null)}
                        >
                          <div className="lms-chart-bar-fill" style={{ height: `${(val / 10) * 40}px` }}></div>
                          <span className="lms-chart-tooltip">{val.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="lms-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <span className="lms-progress-label" style={{ marginBottom: "12px", display: "block" }}>Kỹ năng học tập</span>
                <div className="lms-skills-list">
                  <div className="lms-skill-row">
                    <div className="lms-skill-header">
                      <span>Giải thuật tìm kiếm</span>
                      <span className="lms-skill-badge error">Cần luyện tập</span>
                    </div>
                    <div className="lms-progress-track">
                      <div className="lms-progress-fill error" style={{ width: "33%" }}></div>
                    </div>
                  </div>
                  <div className="lms-skill-row">
                    <div className="lms-skill-header">
                      <span>Kiến trúc Vi xử lý</span>
                      <span className="lms-skill-badge brand">Đang học</span>
                    </div>
                    <div className="lms-progress-track">
                      <div className="lms-progress-fill brand" style={{ width: "60%" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="lms-dashboard-row">
              {/* AI Assist */}
              <div className="lms-card">
                <div className="lms-section-header">
                  <h3 className="lms-section-title">
                    <span className="material-symbols-outlined lms-pulse-icon icon-filled">auto_awesome</span>
                    Trợ lý AI Scholar
                  </h3>
                </div>
                <div className="lms-ai-cards-grid">
                  <div onClick={() => setIsChatOpen(true)} className="lms-ai-card">
                    <div className="lms-ai-card-icon">
                      <span className="material-symbols-outlined">smart_toy</span>
                    </div>
                    <h4 className="lms-ai-card-title">Hỏi đáp AI Chat</h4>
                    <p className="lms-ai-card-desc">Hỏi đáp kiến thức học thuật 24/7, hướng dẫn giải bài tập và làm rõ lý thuyết.</p>
                    <span className="lms-ai-card-link">
                      Trò chuyện ngay
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>arrow_forward</span>
                    </span>
                  </div>

                  <div
                    onClick={() => triggerToast("Tính năng tóm tắt tài liệu đang giả lập trong AI Chat Panel. Vui lòng mở chat!", "info")}
                    className="lms-ai-card"
                  >
                    <div className="lms-ai-card-icon" style={{ backgroundColor: "var(--lms-sky-light)", color: "var(--lms-sky)" }}>
                      <span className="material-symbols-outlined">auto_stories</span>
                    </div>
                    <h4 className="lms-ai-card-title">Tóm tắt AI Summary</h4>
                    <p className="lms-ai-card-desc">Tóm tắt bài giảng dài, tài liệu học tập PDF thành các gạch đầu dòng trong vài giây.</p>
                    <span className="lms-ai-card-link" style={{ color: "var(--lms-sky)" }}>
                      Tải tài liệu lên
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>upload_file</span>
                    </span>
                  </div>
                </div>

                <div className="lms-roadmap-banner">
                  <div className="lms-roadmap-text">
                    <h4 className="lms-roadmap-title">Lộ trình học tập cá nhân hóa</h4>
                    <p className="lms-roadmap-desc">
                      AI Scholar gợi ý bạn nên tập trung củng cố 3 bài tập mới về chủ đề <b>Kiến trúc Hệ điều hành</b> dựa trên kết quả thi tuần qua.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsChatOpen(true);
                      handleSendChatMessage("Giải thích lộ trình cá nhân hóa môn Hệ điều hành");
                    }}
                    className="lms-roadmap-btn"
                  >
                    Xem lộ trình mới
                  </button>
                  <span className="material-symbols-outlined lms-roadmap-bg-icon">insights</span>
                </div>
              </div>

              {/* Todo list */}
              <div className="lms-card lms-todo-box">
                <div className="lms-section-header">
                  <h3 className="lms-section-title">Việc cần làm</h3>
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--lms-text-secondary)" }}>
                    {completedTodos}/{totalTodos} bài tập
                  </span>
                </div>
                <ul className="lms-todo-list">
                  {todos.map((todo) => (
                    <li key={todo.id} className="lms-todo-item">
                      <button
                        onClick={() => handleToggleTodo(todo.id)}
                        className={`lms-checkbox ${todo.completed ? "checked" : ""}`}
                        aria-label="Toggle Todo"
                      />
                      <div className="lms-todo-details">
                        <h5 className={`lms-todo-title ${todo.completed ? "completed" : ""}`}>{todo.title}</h5>
                        <p className="lms-todo-subj">{todo.subject}</p>
                        <div className="lms-todo-footer">
                          <span className={`lms-todo-deadline ${todo.deadlineType}`}>{todo.deadline}</span>
                          {!todo.completed && (
                            <button onClick={() => handleSubmitTodo(todo.id)} className="lms-todo-btn">Nộp bài</button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  {todos.length === 0 && (
                    <div style={{ padding: "40px 0", textAlign: "center", color: "var(--lms-text-muted)", fontSize: "12px" }}>
                      Tất cả bài tập đã được dọn sạch! 🎉
                    </div>
                  )}
                </ul>
                <button onClick={() => setIsTodoModalOpen(true)} className="lms-dashed-btn">
                  <span className="material-symbols-outlined">add_task</span>
                  Thêm việc mới
                </button>
              </div>
            </section>
          </main>

          {/* Mobile footer nav */}
          {/* FIX: Thay thế danh sách phẳng thành cấu trúc ul/li chuẩn HTML Semantic */}
          <nav className="lms-mobile-nav" aria-label="Mobile Navigation">
            <ul>
              <li className="lms-mobile-item active">
                <button type="button">
                  <span className="material-symbols-outlined icon-filled">home</span>
                  <span>Trang chủ</span>
                </button>
              </li>
              <li className="lms-mobile-item">
                <button type="button">
                  <span className="material-symbols-outlined">school</span>
                  <span>Lớp học</span>
                </button>
              </li>
              <li className="lms-mobile-item">
                <button type="button">
                  <span className="material-symbols-outlined">edit_note</span>
                  <span>Bài tập</span>
                </button>
              </li>
              <li className="lms-mobile-item">
                <button type="button">
                  <span className="material-symbols-outlined">forum</span>
                  <span>Hộp thư</span>
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* AI DRAWER */}
        <div className={`lms-drawer ${isChatOpen ? "open" : ""}`}>
          <div className="lms-drawer-header">
            <div className="lms-drawer-title-box">
              <span className="material-symbols-outlined text-xl icon-filled lms-pulse-icon">auto_awesome</span>
              <span>AI Scholar Assistant</span>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="lms-close-btn">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="lms-drawer-chat">
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`lms-chat-msg ${msg.sender}`}>
                {renderSafeMarkdown(msg.text)}
              </div>
            ))}
            {aiTyping && (
              <div className="lms-chat-msg ai" style={{ width: "60px" }}>
                <div className="lms-typing-dots">
                  <span className="lms-typing-dot"></span>
                  <span className="lms-typing-dot"></span>
                  <span className="lms-typing-dot"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="lms-drawer-tags">
            <span onClick={() => handleSendChatMessage("Các lệnh Linux cơ bản")} className="lms-suggest-tag">Lệnh Linux</span>
            <span onClick={() => handleSendChatMessage("Mức chuẩn hóa CSDL")} className="lms-suggest-tag">Chuẩn CSDL</span>
            <span onClick={() => handleSendChatMessage("GPA hiện tại và gợi ý")} className="lms-suggest-tag">GPA hiện tại</span>
          </div>
          <div className="lms-drawer-input-box">
            <input
              className="lms-drawer-input"
              type="text"
              placeholder="Nhập câu hỏi học tập..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && chatInput.trim()) {
                  handleSendChatMessage(chatInput);
                  setChatInput("");
                }
              }}
            />
            <button
              onClick={() => {
                if (chatInput.trim()) {
                  handleSendChatMessage(chatInput);
                  setChatInput("");
                }
              }}
              className="lms-send-btn"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>send</span>
            </button>
          </div>
        </div>

        {/* Floating AI Orb */}
        <button onClick={() => setIsChatOpen(true)} className="lms-ai-trigger" aria-label="Open AI Assistant">
          <span className="lms-ai-pulse"></span>
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
        </button>

        {/* ADD TODO MODAL */}
        {isTodoModalOpen && (
          <div className="lms-modal-overlay">
            <div className="lms-modal">
              <div className="lms-modal-header">
                <span className="lms-modal-title">Thêm việc cần làm mới</span>
                <button onClick={() => setIsTodoModalOpen(false)} className="lms-modal-close">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <form onSubmit={handleAddTodoSubmit} className="lms-modal-body">
                <div className="lms-form-group">
                  <label>Tên bài tập / công việc</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Đọc chương 4 Hệ điều hành"
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="lms-form-group">
                  <label>Môn học tương ứng</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Hệ điều hành"
                    value={newTodoSubject}
                    onChange={(e) => setNewTodoSubject(e.target.value)}
                    required
                  />
                </div>
                <div className="lms-form-group">
                  <label>Thời hạn hoàn thành</label>
                  <select value={newTodoDeadline} onChange={(e) => setNewTodoDeadline(e.target.value)}>
                    <option value="Còn 1 giờ">Gấp (1 giờ nữa)</option>
                    <option value="Còn 4 giờ">Trong ngày (4 giờ nữa)</option>
                    <option value="Ngày mai">Ngày mai</option>
                    <option value="3 ngày nữa">3 ngày nữa</option>
                    <option value="Tuần sau">Tuần sau</option>
                  </select>
                </div>
                <div className="lms-modal-footer">
                  <button type="button" onClick={() => setIsTodoModalOpen(false)} className="lms-btn cancel">Hủy bỏ</button>
                  <button type="submit" className="lms-btn confirm">Xác nhận</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TOAST SYSTEM */}
        {toast && (
          <div className="lms-toast-container">
            <div className={`lms-toast ${toast.type}`}>
              <span className="material-symbols-outlined lms-toast-icon">
                {toast.type === "success" ? "check_circle" : toast.type === "info" ? "info" : "error"}
              </span>
              <span>{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}