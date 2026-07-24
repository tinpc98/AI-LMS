import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import assignmentApi from "../../api/assignmentApi";
import { classApi } from "../../api/classApi";
import { lessonApi } from "../../api/lessonApi";
import axiosClient from "../../api/axiosClient";
import type { IClass } from "../../interface/classInterface";
import type { ILesson } from "../../interface/lessonInterface";

// Mock Data
const MOCK_ASSIGNMENTS = [
  {
    id: "1",
    title: "BTTL 01: Cài đặt danh sách liên kết đơn",
    deadline: "23:59 - 25/10/2024",
    status: "Chưa nộp",
  },
  {
    id: "2",
    title: "BTTL 02: Giải thuật sắp xếp nhanh QuickSort",
    submitTime: "10:15 - 18/10/2024",
    status: "Đã chấm điểm",
    score: "9.0/10",
  },
];

const MOCK_RANKINGS = [
  {
    rank: 1,
    name: "Trần Quốc Quân",
    short: "TQ",
    score: 9.8,
    bg: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  {
    rank: 2,
    name: "Lê Anh",
    short: "LA",
    score: 9.5,
    bg: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    rank: 12,
    name: "Bạn (Minh Quân)",
    short: "MQ",
    score: 8.5,
    bg: "bg-primary-container text-on-primary-container",
    isUser: true,
  },
];

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const [activeTab, setActiveTab] = useState("lessons");

  // State Logic dữ liệu thật
  const [classInfo, setClassInfo] = useState<IClass | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  // State hỗ trợ tab chat/thảo luận mẫu
  const [chatMessage, setChatMessage] = useState("");
  const navigate = useNavigate();
  // ==============================================
  // 1. STATE QUẢN LÝ LOBBY PHÒNG THI
  // ==============================================
  const [exams, setExams] = useState<any[]>([]); // Đã bỏ hardcode classExams, dùng state lấy từ DB
  const [examPopupState, setExamPopupState] = useState<
    "NONE" | "NO_EXAM" | "NOT_YET_TIME" | "COUNTDOWN" | "READY" | "LOADING"
  >("NONE");
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [countdown, setCountdown] = useState(0);

  // ==============================================
  // 2. LOGIC ĐẾM NGƯỢC THỜI GIAN TRONG LOBBY
  // ==============================================
  useEffect(() => {
    const fetchClassExams = async () => {
      if (!classId) return;

      // KHÔNG gọi setIsLoading(true) ở đây để tránh đụng độ với API load classInfo
      try {
        const response = await axiosClient.get(`/api/exams/class/${classId}`);
        setExams(response.data.data || response.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đề thi của lớp:", error);
        // KHÔNG dùng setErrorMsg() ở đây để tránh sập toàn bộ trang
        // Nếu API lỗi (VD: Backend chưa code xong), cứ mặc định gán mảng rỗng
        setExams([]);
      }
    };

    fetchClassExams();
  }, [classId]);
  // Lọc lấy đề thi phù hợp để hiển thị (Yêu cầu 2: chỉ hiển thị trước giờ thi 1 tiếng)
  const getVisibleExam = () => {
    if (!exams || exams.length === 0) return null;
    const now = new Date().getTime();

    return exams.find((exam) => {
      const startTime = new Date(exam.startTime).getTime();
      const oneHourBefore = startTime - 60 * 60 * 1000;

      // Giới hạn thời gian làm bài: sau khi kết thúc đề vẫn ẩn đi
      const durationMs = (exam.duration || 45) * 60 * 1000;
      const endTime = startTime + durationMs;

      // Hiển thị từ lúc 1 tiếng trước giờ bắt đầu đến khi bài thi kết thúc hoàn toàn
      return now >= oneHourBefore && now <= endTime;
    });
  };

  const visibleExam = getVisibleExam();

  // ==============================================
  // 3. HÀM XỬ LÝ KHI BẤM "VÀO THI" Ở TAB 3
  // ==============================================
  useEffect(() => {
    let timer: any;
    if (
      ["COUNTDOWN", "NOT_YET_TIME"].includes(examPopupState) &&
      countdown > 0
    ) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          const nextValue = prev - 1;

          // Nếu đang ở phòng chờ (COUNTDOWN) và đếm ngược hết -> Chuyển sang READY để học sinh bấm bắt đầu
          if (examPopupState === "COUNTDOWN" && nextValue <= 0) {
            setExamPopupState("READY");
          }

          // Học sinh đang treo popup "NOT_YET_TIME", nếu đếm ngược tự động chạm mốc 5 phút (300 giây)
          // Hệ thống tự đẩy học sinh vào phòng chờ đếm ngược thực tế cực kỳ mượt mà
          if (examPopupState === "NOT_YET_TIME" && nextValue <= 300) {
            setExamPopupState("COUNTDOWN");
          }

          return nextValue;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examPopupState, countdown]);
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");

    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  // ==============================================
  // 4. HÀM XỬ LÝ KHI BẤM "VÀO PHÒNG THI"
  // ==============================================
  const handleJoinExamClick = (exam: any) => {
    if (!exam) {
      setExamPopupState("NO_EXAM");
      setTimeout(() => setExamPopupState("NONE"), 3000);
      return;
    }

    const now = new Date();
    const startTime = new Date(exam.startTime);
    const diffSeconds = Math.floor(
      (startTime.getTime() - now.getTime()) / 1000,
    );

    setSelectedExam(exam);

    if (diffSeconds > 300) {
      // TRƯỜNG HỢP A: Thời gian chờ còn lớn hơn 5 phút -> Hiện popup chưa đến giờ thi (Yêu cầu 2)
      setCountdown(diffSeconds);
      setExamPopupState("NOT_YET_TIME");
    } else if (diffSeconds > 0 && diffSeconds <= 300) {
      // TRƯỜNG HỢP B: Còn dưới 5 phút -> Vào phòng chờ lấy chính xác thời gian còn lại (Yêu cầu 2)
      // Ví dụ: vào lúc 11:58 cho ca thi 12:00, đếm ngược sẽ là 2 phút (120 giây) thực tế
      setCountdown(diffSeconds);
      setExamPopupState("COUNTDOWN");
    } else {
      // TRƯỜNG HỢP C: Đã qua giờ bắt đầu thi -> Tự động bypass phòng chờ vào thẳng bài thi (Yêu cầu 3)
      handleStartAttemptDirectly(exam);
    }
  };

  // ==============================================
  // HÀM TIỆN ÍCH LẤY ID HỌC SINH TỪ LOCALSTORAGE
  // ==============================================
  const getStudentId = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) return null;

    try {
      // Giải mã payload (phần thứ 2 của chuỗi JWT sau dấu chấm)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const decodedToken = JSON.parse(jsonPayload);
      console.log("=== ĐÃ GIẢI MÃ TOKEN ===", decodedToken);

      // Lấy ID học sinh (tùy Backend của bạn lưu là _id hay id)
      return decodedToken._id || decodedToken.id || decodedToken.userId;
    } catch (error) {
      console.error("Lỗi giải mã token:", error);
      return null;
    }
  };

  // ==============================================
  // 5. GỌI API BẮT ĐẦU VÀ CHUYỂN TRANG (BYPASS HOẶC READY)
  // ==============================================
  const handleStartAttemptDirectly = async (exam: any) => {
    console.log("=== THÔNG TIN KỲ THI GỬI ĐI ===", exam);
    console.log("=== ID KỲ THI ===", exam._id);

    const studentId = getStudentId(); // Lấy ID học sinh

    if (!studentId) {
      setPopupMessage(
        "Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!",
      );
      setShowPopup(true);
      return;
    }

    setExamPopupState("LOADING");

    try {
      const response = await axiosClient.post("/api/exam-attempts/start", {
        examId: exam._id,
        studentId: studentId, // 👉 ĐÃ THÊM STUDENT ID VÀO ĐÂY
      });

      const attemptId = response.data.data._id;
      navigate(`/exam/${attemptId}`);
    } catch (error: any) {
      console.error("Lỗi khi tạo phiên làm bài:", error);
      setExamPopupState("NONE");

      const errorMsg =
        error.response?.data?.message || "Không thể bắt đầu bài thi.";
      console.log("🔥 LÝ DO BACKEND CHẶN:", errorMsg);
      setPopupMessage(errorMsg);
      setShowPopup(true);
    }
  };

  const handleStartAttemptFromLobby = () => {
    if (selectedExam) {
      handleStartAttemptDirectly(selectedExam);
    }
  };

  // ==============================================
  // 6. CHẶN HỌC SINH THI LẦN 2
  // ==============================================
  const handleStartExam = async () => {
    const studentId = getStudentId(); // Lấy ID học sinh

    if (!studentId) {
      setPopupMessage(
        "Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!",
      );
      setShowPopup(true);
      return;
    }

    try {
      const res = await axiosClient.post("/api/exam-attempts/start", {
        examId: id, // Kiểm tra biến id ở 컴포넌트 có đúng không
        studentId: studentId, // 👉 ĐÃ THÊM STUDENT ID VÀO ĐÂY
      });
      navigate(`/exam/${res.data.data._id}`);
    } catch (error: any) {
      if (error.response?.status === 400) {
        // Thay alert() bằng set State mở Popup
        setPopupMessage(error.response.data.message);
        setShowPopup(true);
      } else {
        setPopupMessage("Có lỗi xảy ra, vui lòng thử lại!");
        setShowPopup(true);
      }
    }
  };
  // ==============================================
  // FETCH DỮ LIỆU LỚP HỌC
  // ==============================================
  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;
      try {
        setIsLoading(true);
        setErrorMsg("");

        const [classRes, lessonRes, assignmentRes] = await Promise.all([
          classApi.getClassById(classId),
          lessonApi.getLessonsByClass(classId),
          assignmentApi.getAssignmentsByClass(classId),
        ]);

        setClassInfo(classRes.data.data);

        const publishedLessons = (lessonRes.data.lessons as ILesson[])
          .filter((l) => l.isPublished)
          .sort((a, b) => a.order - b.order);

        setLessons(publishedLessons);
        setAssignments(assignmentRes);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          setErrorMsg(
            error.response?.data?.message || "Không thể tải dữ liệu lớp học.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [classId]);

  if (isLoading) {
    return (
      <div className="bg-surface-bright min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-secondary">Đang tải dữ liệu lớp học thực tế...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !classInfo) {
    return (
      <div className="bg-surface-bright min-h-screen flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-5xl text-error">
          error
        </span>
        <p className="text-error font-semibold text-lg">
          {errorMsg || "Không tìm thấy thông tin lớp học này."}
        </p>
        <Link
          to="/myclasses"
          className="text-primary font-bold hover:underline flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>{" "}
          Quay lại danh sách lớp học
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-surface-bright text-on-surface font-body-md min-h-screen flex selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Nhúng CSS tùy biến hiệu ứng chuyển động */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }
        .ai-progress-gradient {
          background: linear-gradient(90deg, #4f46e5, #3b82f6, #4f46e5);
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* 1. SIDE NAVIGATION BAR */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface border-r border-outline-variant flex flex-col p-6 space-y-2 z-50">
        <div className="mb-8 px-2">
          <h1
            className="text-2xl font-bold text-primary"
            style={{ fontFamily: "Hanken Grotesk" }}
          >
            AI Academy
          </h1>
          <p className="text-sm text-secondary">Learning Portal</p>
        </div>
        <nav className="flex-1 space-y-1">
          <Link
            to="/"
            className="flex items-center space-x-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-colors rounded-lg"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            to="/myclasses"
            className="flex items-center space-x-3 px-4 py-3 bg-secondary-container text-on-secondary-container font-semibold rounded-lg"
          >
            <span className="material-symbols-outlined">school</span>
            <span className="text-sm">My Classes</span>
          </Link>
          <Link
            to="/studentassignment"
            className="flex items-center space-x-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-colors rounded-lg"
          >
            <span className="material-symbols-outlined">assignment</span>
            <span className="text-sm">Assignments</span>
          </Link>
          <Link
            to="/exam"
            className="flex items-center space-x-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-colors rounded-lg"
          >
            <span className="material-symbols-outlined">quiz</span>
            <span className="text-sm">Exams</span>
          </Link>
          <button
            onClick={() => setActiveTab("chat")}
            className="w-full flex items-center space-x-3 px-4 py-3 text-secondary hover:bg-surface-container-low transition-colors rounded-lg text-left"
          >
            <span className="material-symbols-outlined">forum</span>
            <span className="text-sm">Messaging</span>
          </button>
        </nav>
        <div className="mt-auto pt-6 border-t border-outline-variant">
          <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-transform active:scale-95 shadow-lg">
            <span className="material-symbols-outlined">video_call</span>
            <span className="text-sm">Join Online Class</span>
          </button>
          <div className="flex items-center mt-6 space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden flex-shrink-0">
              <img
                alt="User profile"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcXNfJy6RmJkbl-pgJcwHzo54a2COyoyiXR1NxWEIm7Sh1p9mI6ER4LhQiPHc225n4XTfkWrDy5Ef9Wr_6nGTSSm37X2aWjwDxp3zRVn_URu6PrD7ONi9ew0oFTOH5BNROuILCfqgRqpBFdfn_8aYeZoWiH1QnvdQIl1Gm-H_XQ_3JwaQ29_e6kdB-8C2BPDIwNNt7GQtX9SJcE6xSlb9exoX0WN620l-tKbsYwg4Vr8OyySmc1pwBT6Apt4jOSYKptaBFSLhnPF80"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-on-surface font-semibold truncate">
                Minh Quân
              </span>
              <span className="text-xs text-secondary">ID: 2024AI01</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. TOP NAVIGATION BAR */}
      <header className="fixed top-0 right-0 w-[calc(100%-280px)] h-16 bg-surface-bright flex items-center justify-between px-6 border-b border-outline-variant z-40">
        <div className="flex items-center space-x-4 min-w-0">
          <span
            className="text-xl font-bold text-primary truncate max-w-[300px]"
            style={{ fontFamily: "Hanken Grotesk" }}
          >
            {classInfo.className}
          </span>
          <div className="h-6 w-px bg-outline-variant mx-2 hidden sm:block"></div>
          <div className="relative hidden md:block">
            <input
              className="pl-10 pr-4 py-1.5 rounded-full bg-surface-container-low border-none focus:ring-2 focus:ring-primary w-64 text-sm"
              placeholder="Search lessons..."
              type="text"
            />
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-lg">
              search
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0">
          <button className="p-2 rounded-full hover:bg-surface-container-high text-secondary transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full border-2 border-surface-bright"></span>
          </button>
          <div className="h-8 w-px bg-outline-variant hidden sm:block"></div>
          <button className="px-4 py-1.5 rounded-full border border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-on-primary transition-all">
            Tham gia bằng mã
          </button>
        </div>
      </header>

      {/* 3. MAIN CONTENT CANVAS */}
      <main className="ml-[280px] mt-16 p-8 max-w-[1280px] w-full mx-auto box-border flex flex-col">
        {/* Banner tiêu đề dữ liệu thật */}
        <section className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-xl p-8 border border-outline-variant shadow-sm relative overflow-hidden">
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="inline-flex items-center px-3 py-1 bg-primary-container text-on-primary-container rounded-full text-xs font-semibold mb-4 uppercase tracking-wider">
                  {classInfo.status === "active" ? "Đang học" : "Đã kết thúc"}
                </div>
                <h2
                  className="text-3xl font-bold text-on-surface mb-2"
                  style={{ fontFamily: "Hanken Grotesk" }}
                >
                  {classInfo.className}
                </h2>
                <div className="flex flex-col gap-1 text-secondary">
                  <div className="flex items-center text-sm">
                    <span className="material-symbols-outlined text-base mr-2">
                      person
                    </span>
                    <span>
                      Giảng viên:{" "}
                      <strong>
                        {classInfo.teacherId?.fullName ?? "Chưa rõ"}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="material-symbols-outlined text-base mr-2">
                      groups
                    </span>
                    <span>
                      Sĩ số:{" "}
                      <strong>
                        {classInfo.students?.length ?? 0} học sinh
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
              {/* Progress Circle Mock-up */}
              <div className="flex flex-col items-center self-center sm:self-auto">
                <div className="relative w-24 h-24">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                      className="stroke-surface-container-high"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeWidth="3"
                    ></path>
                    <path
                      className="stroke-primary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      strokeDasharray="65, 100"
                      strokeLinecap="round"
                      strokeWidth="3"
                      style={{
                        transition: "stroke-dasharray 1.5s ease-in-out",
                      }}
                    ></path>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">65%</span>
                  </div>
                </div>
                <span className="text-xs font-semibold mt-2 text-secondary">
                  Tiến độ cá nhân
                </span>
              </div>
            </div>
          </div>

          <div className="col-span-12 md:col-span-4 flex flex-col">
            <div className="flex-1 bg-primary rounded-xl p-6 text-on-primary shadow-xl relative group cursor-pointer overflow-hidden transition-all hover:-translate-y-1">
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    video_chat
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-1">Phòng học trực tuyến</h3>
                <p className="text-xs opacity-90 mb-4">
                  Lớp học đang diễn ra hoặc có lịch hẹn. Vào lớp ngay để thảo
                  luận trực tiếp.
                </p>
                <div className="flex items-center text-xs font-bold uppercase tracking-widest mt-auto">
                  Vào Học Ngay{" "}
                  <span className="material-symbols-outlined ml-2 group-hover:translate-x-2 transition-transform text-sm">
                    arrow_forward
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. TABS MANAGEMENT SYSTEM */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden min-h-[500px] flex flex-col shadow-sm">
          {/* Tabs Thanh chọn điều hướng */}
          <div className="flex border-b border-outline-variant px-6 overflow-x-auto whitespace-nowrap">
            {[
              { key: "lessons", label: "Bài giảng" },
              { key: "assignments", label: "Bài tập của tôi" },
              { key: "exams", label: "Thi trực tuyến" },
              { key: "chat", label: "Thảo luận lớp học" },
            ].map((tab) => (
              <button
                key={tab.key}
                className={`px-6 py-4 font-semibold text-sm transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "text-primary border-primary"
                    : "text-secondary border-transparent hover:text-primary"
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vùng hiển thị nội dung chi tiết từng Tab */}
          <div className="p-6 flex-1">
            {/* TAB 1: BÀI GIẢNG — SỬ DỤNG DỮ LIỆU THẬT */}
            {activeTab === "lessons" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-on-surface">
                    Danh sách bài học
                  </h3>
                  <span className="px-3 py-1 bg-surface-container-high rounded text-xs text-secondary font-medium">
                    {lessons.length} bài học thực tế
                  </span>
                </div>

                {lessons.length === 0 ? (
                  <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 text-center text-secondary">
                    <span className="material-symbols-outlined text-4xl mb-2 text-outline">
                      description
                    </span>
                    <p className="text-sm">
                      Giảng viên chưa đăng tải giáo trình nào cho lớp này.
                    </p>
                  </div>
                ) : (
                  lessons.map((lesson) => (
                    <div
                      key={lesson._id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-outline-variant rounded-xl hover:border-primary/30 transition-all hover:shadow-md gap-4"
                    >
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors flex-shrink-0">
                          <span
                            className="material-symbols-outlined text-2xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            {lesson.videoUrl ? "play_circle" : "picture_as_pdf"}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-on-surface text-sm sm:text-base truncate">
                            {lesson.title}
                          </h4>
                          <p className="text-xs text-secondary line-clamp-1 mt-0.5">
                            {lesson.description ||
                              "Không có mô tả chi tiết cho bài học này."}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                        {lesson.videoUrl && (
                          <a
                            href={lesson.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-4 py-2 text-xs font-bold text-primary bg-primary-container/20 hover:bg-primary hover:text-white rounded-lg transition-colors"
                          >
                            Xem video
                          </a>
                        )}
                        {lesson.attachments &&
                          lesson.attachments.map((file) => (
                            <a
                              key={file.publicId}
                              href={file.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-secondary hover:bg-surface-container-high rounded-lg transition-colors"
                              title={file.name}
                            >
                              <span className="material-symbols-outlined text-xl">
                                download
                              </span>
                            </a>
                          ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: BÀI TẬP — KẾT HỢP LAYOUT MOCKUP ĐẸP MẮT */}
            {activeTab === "assignments" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-primary-container/10 border border-primary/20 rounded-xl">
                    <span className="text-xs uppercase font-bold text-primary">
                      Chưa nộp
                    </span>
                    <div className="text-2xl font-bold text-primary mt-1">
                      01
                    </div>
                  </div>
                  <div className="p-4 bg-secondary-container/20 border border-secondary/20 rounded-xl">
                    <span className="text-xs uppercase font-bold text-secondary">
                      Đã nộp
                    </span>
                    <div className="text-2xl font-bold text-secondary mt-1">
                      01
                    </div>
                  </div>
                  <div className="p-4 bg-surface-container-high rounded-xl">
                    <span className="text-xs uppercase font-bold text-on-surface-variant">
                      Điểm trung bình
                    </span>
                    <div className="text-2xl font-bold text-on-surface mt-1">
                      9.0
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-outline-variant rounded-xl divide-y divide-outline-variant">
                  {MOCK_ASSIGNMENTS.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base">
                          {item.title}
                        </h4>
                        <p className="text-xs text-secondary mt-0.5">
                          {item.deadline || `Nộp lúc: ${item.submitTime}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4 self-end sm:self-auto">
                        {item.score ? (
                          <div className="text-right">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container">
                              {item.status}
                            </span>
                            <div className="mt-1 font-bold text-primary text-sm">
                              {item.score}
                            </div>
                          </div>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container text-on-error-container">
                            {item.status}
                          </span>
                        )}
                        <button className="flex items-center space-x-1 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90">
                          <span className="material-symbols-outlined text-base">
                            upload
                          </span>
                          <span>Nộp bài</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    assignments.map((item) => (
                      <div
                        key={item._id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base">{item.title}</h4>
                          {item.description && <p className="text-xs text-secondary mt-1">{item.description}</p>}
                          <p className="text-xs text-secondary mt-0.5">
                            Hạn nộp: {new Date(item.deadline).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4 self-end sm:self-auto">
                          {submittedAssignmentIds.includes(item._id) ? (
                            <>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-container text-on-success-container">
                                Đã nộp
                              </span>
                              <button
                                onClick={() => handleCancelSubmission(item._id)}
                                className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface hover:bg-surface-container-low"
                              >
                                Hủy nộp bài
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-error-container text-on-error-container">
                                Chưa nộp
                              </span>
                              <button
                                onClick={() => openSubmitModal(item)}
                                className="flex items-center space-x-1 bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90"
                              >
                                <span className="material-symbols-outlined text-base">upload</span>
                                <span>Nộp bài</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: THI TRỰC TUYẾN - ĐÃ FIX THEO YÊU CẦU MỚI */}
            {activeTab === "exams" && (
              <div className="max-w-2xl mx-auto py-4">
                {!visibleExam ? (
                  /* YÊU CẦU 1: UI CỨNG KHÔNG CÓ BÀI KIỂM TRA NÀO */
                  <div className="bg-white border border-outline-variant rounded-2xl p-12 text-center shadow-lg">
                    <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">
                      assignment_late
                    </span>
                    <h3 className="text-xl font-bold text-gray-700">
                      Hiện tại chưa có bài kiểm tra nào cả
                    </h3>
                    <p className="text-sm text-gray-400 mt-2">
                      Các đề thi của lớp học sẽ hiển thị tại đây 1 tiếng trước
                      giờ thi bắt đầu.
                    </p>
                  </div>
                ) : (
                  /* YÊU CẦU 2: HIỂN THỊ ĐỀ THI ĐÁP ỨNG THỜI GIAN TRƯỚC 1 TIẾNG */
                  <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-lg">
                    <div className="h-2 ai-progress-gradient"></div>
                    <div className="p-6 sm:p-8">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                          <span className="inline-block px-3 py-1 bg-error-container text-on-error-container rounded-full text-xs font-bold mb-3 animate-pulse">
                            {new Date(visibleExam.startTime).getTime() >
                            new Date().getTime()
                              ? "Sắp diễn ra"
                              : "Đang diễn ra"}
                          </span>
                          <h3 className="text-xl font-bold text-on-surface">
                            {visibleExam.title}
                          </h3>
                          <p className="text-xs text-secondary mt-1">
                            Thời gian làm bài: {visibleExam.duration || 45} phút
                            | Hình thức:{" "}
                            {visibleExam.format || "Trắc nghiệm & Tự luận"}
                          </p>
                        </div>
                        <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-2">
                          <div className="text-2xl font-mono font-bold text-primary">
                            {new Date(visibleExam.startTime).toLocaleTimeString(
                              [],
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </div>
                          <span className="text-[10px] text-secondary uppercase font-bold tracking-wider">
                            Bắt đầu:{" "}
                            {new Date(visibleExam.startTime).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 bg-surface-container-high rounded-xl mb-6 flex items-start space-x-3">
                        <span className="material-symbols-outlined text-error mt-0.5">
                          info
                        </span>
                        <p className="text-xs text-on-surface-variant">
                          Lưu ý quan trọng: Hệ thống sẽ kích hoạt AI giám sát và
                          tự động nộp bài khi hết giờ. Hãy kiểm tra kết nối mạng
                          trước khi vào phòng.
                        </p>
                      </div>
                      <div className="flex gap-4">
                        <button
                          onClick={() => handleJoinExamClick(visibleExam)}
                          className="flex-1 bg-primary text-on-primary py-3 rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                        >
                          Vào phòng thi
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: THẢO LUẬN LỚP HỌC */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full space-y-4">
                <div className="bg-surface-container-low rounded-xl p-4 flex flex-col space-y-4 min-h-[300px]">
                  {/* Tin nhắn từ người khác */}
                  <div className="flex items-start space-x-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-bold">
                      TT
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold">Thanh Thảo</span>
                        <span className="text-[10px] text-secondary">
                          09:12 AM
                        </span>
                      </div>
                      <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm text-xs sm:text-sm">
                        Mọi người ơi, tài liệu chương mới thầy cập nhật nằm ở
                        mục nào vậy ạ?
                      </div>
                    </div>
                  </div>

                  {/* AI Suggestion */}
                  <div className="flex items-center justify-center my-2">
                    <div className="bg-surface-container-highest border border-primary/20 px-4 py-1.5 rounded-full text-xs flex items-center space-x-2 text-primary">
                      <span className="material-symbols-outlined text-sm animate-pulse">
                        auto_awesome
                      </span>
                      <span>
                        AI khuyên dùng: Bạn có thể xem các slide PDF tải về trực
                        tiếp tại Tab <b>Bài giảng</b>.
                      </span>
                    </div>
                  </div>

                  {/* Tin nhắn Giảng viên lấy tên từ API */}
                  <div className="flex items-start space-x-3 max-w-[85%]">
                    <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex-shrink-0 flex items-center justify-center text-xs font-bold">
                      GV
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-bold text-primary">
                          Thầy {classInfo.teacherId?.fullName || "Nguyễn Văn A"}
                        </span>
                        <span className="text-[10px] text-secondary">
                          09:20 AM
                        </span>
                      </div>
                      <div className="bg-primary-container/10 border border-primary/10 p-3 rounded-2xl rounded-tl-none text-xs sm:text-sm">
                        Chào các em, thầy vừa bổ sung các tệp đính kèm mới vào
                        danh sách bài học bên trên rồi nhé. Hãy chủ động tải về
                        trước buổi học chiều nay.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Khung chat input */}
                <div className="flex items-center space-x-2">
                  <input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary text-sm"
                    placeholder="Nhập nội dung thảo luận cùng lớp học..."
                    type="text"
                  />
                  <button className="p-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center">
                    <span className="material-symbols-outlined text-xl">
                      send
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 5. FOOTER STATS & INSIGHT DETAILS */}
        <section className="mt-8 grid grid-cols-12 gap-6">
          {/* Widget Bảng xếp hạng */}
          <div className="col-span-12 md:col-span-4 bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
            <h4 className="font-semibold mb-4 flex items-center text-sm sm:text-base">
              <span className="material-symbols-outlined mr-2 text-primary">
                analytics
              </span>
              Xếp hạng lớp học
            </h4>
            <div className="space-y-3">
              {MOCK_RANKINGS.map((user, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-lg ${user.isUser ? "bg-primary-container/10 border border-primary/20" : ""}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      className={`text-xs font-bold w-4 text-center ${user.isUser ? "text-primary" : "text-secondary"}`}
                    >
                      {user.rank}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs border ${user.bg}`}
                    >
                      {user.short}
                    </div>
                    <span
                      className={`text-xs sm:text-sm truncate ${user.isUser ? "font-bold" : "font-medium"}`}
                    >
                      {user.name}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-primary ml-2">
                    {user.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget Phân tích Lộ trình AI */}
          <div className="col-span-12 md:col-span-8 bg-surface-container-low p-6 rounded-xl border border-outline-variant border-dashed flex items-center justify-center text-center">
            <div className="space-y-3 max-w-xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-inner mx-auto">
                <span className="material-symbols-outlined text-2xl">
                  auto_awesome
                </span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm sm:text-base">
                  AI Learning Insights
                </h4>
                <p className="text-xs sm:text-sm text-secondary mt-1 px-4">
                  "Hệ thống nhận thấy lớp học đang triển khai chương trình học
                  mới. Bạn hãy hoàn thành việc xem các video bài giảng thực tế
                  của thầy{" "}
                  <b>{classInfo.teacherId?.fullName ?? "Giảng viên"}</b> để nắm
                  chắc kiến thức trước kỳ thi!"
                </p>
              </div>
              <button className="text-primary font-bold text-xs hover:underline block mx-auto">
                Xem chi tiết lộ trình học tập tập trung →
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ==================================================== */}
      {/* CÁC POPUP TRẠNG THÁI LOBBY PHÒNG THI */}
      {/* ==================================================== */}

      {/* 1. POPUP: KHÔNG CÓ KỲ THI */}
      {examPopupState === "NO_EXAM" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center border-2 border-red-500 shadow-2xl">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-2">
              event_busy
            </span>
            <h3 className="text-xl font-bold text-red-600 mb-2">Thông báo</h3>
            <p className="text-gray-700 font-medium">
              Kỳ thi này không tồn tại hoặc đã bị gỡ!
            </p>
            <p className="text-sm text-gray-400 mt-4">
              (Tự động đóng sau 3 giây...)
            </p>
          </div>
        </div>
      )}

      {/* 2. POPUP CHUYÊN NGHIỆP: CHƯA ĐẾN GIỜ THI (> 5 PHÚT) (Yêu cầu 2) */}
      {examPopupState === "NOT_YET_TIME" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center border border-outline-variant shadow-2xl">
            <span className="material-symbols-outlined text-5xl text-yellow-500 mb-3">
              warning
            </span>
            <h3 className="text-2xl font-bold text-on-surface mb-2">
              Chưa đến giờ thi!
            </h3>
            <p className="text-gray-700 font-medium mb-4">
              Bài thi{" "}
              <span className="text-primary font-bold">
                "{selectedExam?.title}"
              </span>{" "}
              chưa mở phòng chờ.
            </p>
            <div className="bg-surface-container-high py-4 px-6 rounded-xl mb-6">
              <p className="text-xs text-secondary mb-1">
                Thời gian đếm ngược thực tế:
              </p>
              <p className="text-2xl font-mono font-bold text-error">
                {formatTime(countdown)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Bạn vui lòng quay lại khi thời gian còn dưới 5 phút để vào phòng
                chờ đếm ngược.
              </p>
            </div>
            <button
              onClick={() => setExamPopupState("NONE")}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors"
            >
              Đã hiểu & Quay lại
            </button>
          </div>
        </div>
      )}

      {/* 3. POPUP: PHÒNG CHỜ THI (LOBBY - Dưới 5 phút) (Yêu cầu 2) */}
      {["COUNTDOWN", "READY", "LOADING"].includes(examPopupState) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in p-4">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full"></div>

            <h2 className="text-2xl font-bold text-on-surface mb-2 relative z-10">
              Phòng chờ thi
            </h2>
            <p className="text-primary font-bold text-lg mb-8 relative z-10">
              {selectedExam?.title}
            </p>

            {/* Trạng thái đếm ngược phòng chờ thực tế */}
            {examPopupState === "COUNTDOWN" && (
              <div className="mb-8 relative z-10">
                <p className="text-on-surface-variant font-medium mb-4">
                  Hệ thống sẽ mở đề sau:
                </p>
                <div className="text-5xl font-mono font-bold text-primary bg-primary/10 py-6 rounded-2xl border-2 border-primary/20 shadow-inner">
                  {formatTime(countdown)}
                </div>
              </div>
            )}

            {/* Trạng thái đã sẵn sàng thi */}
            {["READY", "LOADING"].includes(examPopupState) && (
              <div className="mb-8 relative z-10">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  Đã đến giờ thi!
                </h3>
                <p className="text-gray-600">
                  Hãy chuẩn bị sẵn sàng và bấm nút bên dưới để nhận đề.
                </p>
              </div>
            )}

            <div className="flex gap-4 relative z-10">
              <button
                disabled={examPopupState === "LOADING"}
                onClick={() => setExamPopupState("NONE")}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Quay lại
              </button>

              <button
                disabled={
                  examPopupState === "COUNTDOWN" || examPopupState === "LOADING"
                }
                onClick={handleStartAttemptFromLobby}
                className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  ["READY", "LOADING"].includes(examPopupState)
                    ? "bg-primary text-white hover:bg-primary-container hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {examPopupState === "LOADING" ? (
                  <span className="animate-spin material-symbols-outlined">
                    autorenew
                  </span>
                ) : (
                  "Bắt đầu ngay"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl text-center max-w-sm w-[90%] mx-auto transform animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl font-bold text-error">
                block
              </span>
            </div>
            <h3 className="font-bold text-xl text-gray-900 mb-2">
              Không thể làm bài
            </h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              {popupMessage}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/")} // Đổi link này về trang chủ / danh sách lớp của bạn
                className="w-full py-2.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                Quay lại trang chủ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
