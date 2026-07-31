import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useExamTimer from "../hooks/useExamTimer";
import axiosClient from "../../../api/axiosClient";
import useAntiCheat from "../hooks/useAntiCheat";
import useAnswerAutosave, { type DraftAnswer } from "../hooks/useAnswerAutosave";
import ExamErrorBoundary from "../components/ExamErrorBoundary";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

const ExamPageContent = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // CỜ QUAN TRỌNG: Dùng để chặn bộ đếm gian lận chạy khi đang nộp bài
  const isSubmittingRef = useRef(false);
  const examContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
      } else {
        setIsFullscreen(false);
        // Hiển thị cảnh báo nhỏ khi thoát fullscreen (tuỳ chọn)
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      if (examContainerRef.current) {
        await examContainerRef.current.requestFullscreen();
      }
    } catch (err) {
      console.warn("Không thể bật chế độ toàn màn hình:", err);
      // Nếu trình duyệt chặn, vẫn cho phép làm bài
      setIsFullscreen(true);
    }
  };

  // ==========================================
  // 1. STATE BÀI LÀM VÀ AUTO-SAVE
  // ==========================================
  const [questions, setQuestions] = useState<any[]>([]);

  // FIX LỖI TIMER 1: Đặt mặc định là null để biết chưa có dữ liệu BE
  const [examDuration, setExamDuration] = useState<number | null>(null);
  const [examEndTime, setExamEndTime] = useState<string | null>(null); // Lưu thời điểm kết thúc tuyệt đối

  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // BUG ĐÃ SỬA: khoá localStorage trước đây KHÔNG gắn với lượt thi ("exam_draft_answers" dùng
  // chung cho mọi đề). Học sinh làm dở đề A rồi mở đề B sẽ thấy bài của đề A — và vì câu hỏi
  // lấy từ ngân hàng dùng chung, một câu trùng giữa hai đề sẽ được điền sẵn đáp án cũ.
  const draftKey = `exam_draft_answers_${attemptId}`;
  const flaggedKey = `exam_draft_flagged_${attemptId}`;

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    const savedAnswers = localStorage.getItem(draftKey);
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });

  const [flagged, setFlagged] = useState<Set<string>>(() => {
    const savedFlagged = localStorage.getItem(flaggedKey);
    return savedFlagged ? new Set(JSON.parse(savedFlagged)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem(draftKey, JSON.stringify(answers));
  }, [answers, draftKey]);

  useEffect(() => {
    localStorage.setItem(flaggedKey, JSON.stringify([...flagged]));
  }, [flagged, flaggedKey]);

  // ==========================================
  // 2. STATE CẢNH BÁO GIAN LẬN
  // ==========================================
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [modalType, setModalType] = useState("warning");
  const MAX_WARNINGS = 5;

  const [examClassId, setExamClassId] = useState<string | null>(null);

  // ==========================================
  // 3. FETCH DỮ LIỆU ĐỀ THI TỪ BACKEND
  // ==========================================
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const response = await axiosClient.get(`/api/exam-attempts/${attemptId}`);
        console.log(attemptId);

        const data = response.data.data || response.data;

        // DEBUG: Kiểm tra dữ liệu BE trả về
        console.log("Dữ liệu đề thi từ BE:", data);

        if (data && data.questions) {
          setQuestions(data.questions);

          // FIX LỖI TIMER 2: Lấy dữ liệu thời gian từ BE
          if (data.examInfo?.duration) {
            setExamDuration(data.examInfo.duration); // (Ví dụ: 5 phút)
          }
          if (data.examInfo?.classId) {
            setExamClassId(data.examInfo.classId);
          }
          // TỐT NHẤT: Backend nên trả về thời điểm kết thúc tuyệt đối (endTime)
          if (data.endTime) {
            setExamEndTime(data.endTime);
          }

          setIsLoading(false);
        }
      } catch (error: unknown) {
        console.error("Lỗi khi tải đề thi:", error);
        setWarningMessage("Không thể tải dữ liệu đề thi. Đang quay lại...");
        setIsWarningVisible(true);
        setTimeout(() => navigate("/student/myclasses"), 2000);
      }
    };
    if (attemptId) fetchExamData();
  }, [attemptId, navigate]);

  // ==========================================
  // 4. HÀM XỬ LÝ NỘP BÀI CHUNG
  // ==========================================
  const handleAutoSubmit = async (isForced = false) => {
    isSubmittingRef.current = true;
    setModalType(isForced ? "warning" : "info");
    setWarningMessage("Hệ thống đang xử lý nộp bài, vui lòng không tắt trình duyệt...");
    setIsWarningVisible(true);

    try {
      const formattedAnswers = Object.keys(answers).map((qId) => {
        const question = questions.find((q) => q._id === qId);
        return {
          questionId: qId,
          selectedOption: question?.type === "MCQ" ? answers[qId] : undefined,
          essayText: question?.type === "ESSAY" ? answers[qId] : undefined,
        };
      });

      await axiosClient.post(`/api/exam-attempts/${attemptId}/submit`, {
        answers: formattedAnswers,
        isForcedSubmit: isForced,
      });

      localStorage.removeItem(draftKey);
      localStorage.removeItem(flaggedKey);

      setWarningMessage("Nộp bài thành công! Đang chuyển về trang kết quả...");

      setTimeout(() => {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch((err) => console.error("Error exiting fullscreen:", err));
        }
        if (examClassId) {
          navigate(`/student/classdetail/${examClassId}`);
        } else {
          navigate("/student/myclasses");
        }
      }, 2000);
    } catch (error: unknown) {
      isSubmittingRef.current = false;
      console.error("Lỗi nộp bài:", error);
      setModalType("warning");
      setWarningMessage(getApiErrorMessage(error, "Có lỗi xảy ra khi nộp bài!"));
    }
  };

  // ==========================================
  // 5. KÍCH HOẠT CÁC HOOK BẢO MẬT
  // ==========================================

  // FIX LỖI TIMER 3: Tính toán thời gian thật (timeLeft) dựa trên dữ liệu BE
  // Lấy tổng số giây làm bài
  const totalSeconds = useMemo(() => {
    return examDuration ? examDuration * 60 : 0;
  }, [examDuration]);

  // Gọi Hook. useExamTimer cần được viết để NHẬN SỐ GIÂY (seconds) thay vì phút.
  const { timeLeft, formattedTime } = useExamTimer(
    totalSeconds, // Truyền giây vào đây
    attemptId,
    handleAutoSubmit,
    examEndTime // Truyền thêm thời điểm kết thúc tuyệt đối (nếu có)
  );

  // KHÔNG bọc useCallback ở đây nữa — xem ghi chú trong useAntiCheat.
  //
  // BUG ĐÃ SỬA: bản cũ là useCallback(..., [attemptId, MAX_WARNINGS]). Cả hai phụ thuộc đều
  // không bao giờ đổi (attemptId lấy từ useParams, MAX_WARNINGS là hằng số 5), nên hàm này
  // được tạo ĐÚNG MỘT LẦN ở lần render đầu và đóng băng luôn handleAutoSubmit của lần render
  // đó — kéo theo `answers` và `questions` tại thời điểm mount.
  //
  // Hậu quả: học sinh vi phạm đủ 5 lần thì bị nộp bài cưỡng bức với `questions` = [] (lúc đó
  // đề thi còn chưa tải xong) — mọi câu trả lời gửi lên đều thiếu cả selectedOption lẫn
  // essayText. Toàn bộ bài làm bị mất.
  //
  // Đường nộp bài do hết giờ KHÔNG dính lỗi này: useExamTimer đã giữ callback trong ref từ
  // trước. Chỉ nhánh chống gian lận bị.
  const handleCheatAlert = async (reason: string, currentViolations: number) => {
    if (isSubmittingRef.current) return;
    console.log(`🚨 Lỗi: ${reason}. Số lần: ${currentViolations}`);

    // 1. GỌI API ĐẨY CẢNH BÁO LÊN BACKEND NGAY LẬP TỨC
    try {
      await axiosClient.post(`/api/exam-attempts/${attemptId}/warning`, {
        reason: "Rời khỏi tab hoặc mất focus trình duyệt",
      });
      console.log("Frontend attemptId:", attemptId);
    } catch (err) {
      console.error("Không thể đồng bộ lỗi gian lận lên server:", err);
    }

    // 2. HIỂN THỊ MODAL CẢNH BÁO CHO HỌC SINH
    setModalType("warning");
    if (currentViolations >= MAX_WARNINGS) {
      setWarningMessage(
        `Đình chỉ thi! Bạn đã vi phạm ${MAX_WARNINGS} lần. Đang tự động nộp bài...`
      );
      setIsWarningVisible(true);
      handleAutoSubmit(true);
    } else {
      setWarningMessage(`Lỗi: ${reason} (Vi phạm lần ${currentViolations}/${MAX_WARNINGS})`);
      setIsWarningVisible(true);
    }
  };
  useAntiCheat(handleCheatAlert);

  // ==========================================
  // 6. CÁC HÀM TƯƠNG TÁC VỚI CÂU HỎI
  // ==========================================
  const currentQ = questions[currentIndex] as any;

  // Đẩy bài làm lên máy chủ. Điều kiện để cron tự động nộp bài khi hết giờ là CÔNG BẰNG —
  // không có bước này, phiên bị đóng sẽ được chấm với bài rỗng. Xem useAnswerAutosave.ts.
  const buildDraftAnswers = useCallback((): DraftAnswer[] => {
    return Object.keys(answers).map((qId) => {
      const question = questions.find((q) => q._id === qId);
      return {
        questionId: qId,
        selectedOption: question?.type === "MCQ" ? answers[qId] : undefined,
        essayText: question?.type === "ESSAY" ? answers[qId] : undefined,
      };
    });
  }, [answers, questions]);

  const { luuTam } = useAnswerAutosave(attemptId, buildDraftAnswers);

  const handleAnswerChange = (value: any) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ._id]: value }));
    luuTam();
  };

  const toggleFlag = () => {
    if (!currentQ) return;
    setFlagged((prev) => {
      const newFlags = new Set(prev);
      if (newFlags.has(currentQ._id)) newFlags.delete(currentQ._id);
      else newFlags.add(currentQ._id);
      return newFlags;
    });
  };

  // ==========================================
  // RENDER GIAO DIỆN
  // ==========================================

  // Hiển thị màn hình chờ khi đang Fetch API
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-xl font-bold text-primary animate-pulse">
          Đang tải đề thi và đồng bộ thời gian...
        </div>
      </div>
    );
  }

  // Chặn lỗi nếu đề thi trống
  if (!questions || questions.length === 0 || !currentQ) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-xl font-bold text-red-500">
          Đề thi này không có câu hỏi nào hợp lệ!
        </div>
      </div>
    );
  }

  return (
    <div
      ref={examContainerRef}
      className="bg-background text-on-surface font-sans min-h-screen overflow-hidden flex flex-col relative"
    >
      {!isFullscreen && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-white backdrop-blur-md bg-opacity-95">
          <h2 className="text-3xl font-bold mb-4 text-primary">Chế độ thi toàn màn hình</h2>
          <p className="mb-8 text-gray-600 max-w-md text-center text-lg">
            Bài thi yêu cầu làm việc trong chế độ toàn màn hình để đảm bảo tính công bằng.
          </p>
          <button
            onClick={enterFullscreen}
            className="px-8 py-4 bg-primary text-white font-bold text-lg rounded-xl shadow-xl hover:bg-primary/90 transition-all transform hover:scale-105"
          >
            Vào toàn màn hình và bắt đầu làm bài
          </button>
        </div>
      )}
      {/* Top Header */}
      <header className="h-16 shrink-0 bg-surface border-b border-outline-variant flex justify-between items-center px-8 z-50">
        <span className="font-bold text-xl text-primary">Academia AI Pro</span>
        <div className="flex items-center gap-6">
          {/* FIX LỖI TIMER 4: Chỉ render đồng hồ khi timeLeft đã được tính toán xong (>0) */}
          {timeLeft !== null && timeLeft !== undefined && (
            <div
              className={`px-6 py-2 rounded-xl font-mono text-xl shadow-lg flex items-center gap-2 transition-all duration-300 ${timeLeft <= 60 ? "bg-red-600 text-white animate-pulse" : "bg-primary text-white"}`}
            >
              <span>{formattedTime()}</span>
            </div>
          )}

          <button
            onClick={() => handleAutoSubmit(false)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Nộp bài
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Question Content */}
        <section className="flex-1 overflow-y-auto p-8 pb-32">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-start mb-8">
              <h2 className="text-2xl font-bold">
                Câu {currentIndex + 1}:{" "}
                {typeof currentQ.content === "string"
                  ? currentQ.content
                  : "Nội dung câu hỏi không hợp lệ"}
              </h2>
              <button
                onClick={toggleFlag}
                className={`px-4 py-2 rounded-lg font-medium border transition-colors flex items-center gap-2 ${flagged.has(currentQ._id) ? "bg-yellow-100 border-yellow-400 text-yellow-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"}`}
              >
                {flagged.has(currentQ._id) ? "🚩 Đã đánh dấu" : "⚑ Đánh dấu xem lại"}
              </button>
            </div>

            {/* Render Câu hỏi  */}
            {currentQ.type === "MCQ" ? (
              <div className="grid gap-4">
                {currentQ.options?.map((opt: any, index: number) => {
                  if (!opt) return null;
                  const label = String.fromCharCode(65 + index);
                  const isSelected = answers[currentQ._id] === opt;
                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerChange(opt)}
                      className={`flex items-center gap-4 p-5 rounded-xl border text-left transition-all ${isSelected ? "border-primary bg-blue-50 shadow-sm" : "border-outline-variant hover:bg-gray-50"}`}
                    >
                      <div
                        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold ${isSelected ? "bg-primary text-white" : "bg-gray-200"}`}
                      >
                        {label}
                      </div>
                      <span className="font-medium text-lg">
                        {typeof opt === "string" ? opt : "Lựa chọn không hợp lệ"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="w-full">
                <textarea
                  value={answers[currentQ._id] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Nhập câu trả lời..."
                  className="w-full h-64 p-4 border-2 border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none resize-y text-lg"
                />
              </div>
            )}

            <div className="flex justify-between mt-10">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 font-bold"
              >
                ← Câu trước
              </button>
              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-6 py-2 bg-primary text-white rounded-lg disabled:opacity-50 font-bold"
              >
                Câu tiếp theo →
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="w-[320px] shrink-0 bg-surface-container-low border-l border-outline-variant p-6 flex flex-col">
          <h3 className="font-bold text-lg mb-6">Danh sách câu hỏi</h3>
          <div className="grid grid-cols-5 gap-3 overflow-y-auto pr-2">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q._id];
              const isFlagged = flagged.has(q._id);
              const isActive = i === currentIndex;
              let boxClass = "bg-gray-200 text-gray-700 hover:bg-gray-300";
              if (isFlagged) boxClass = "bg-yellow-400 text-yellow-900 shadow-sm";
              else if (isAnswered) boxClass = "bg-green-500 text-white shadow-sm";
              const activeClass = isActive ? "ring-2 ring-primary ring-offset-2 scale-110" : "";
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-full aspect-square rounded-lg flex items-center justify-center text-sm font-bold transition-all ${boxClass} ${activeClass}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </aside>
      </main>

      {/* Dynamic Modal (Warning / Info / Success) */}
      {isWarningVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div
            className={`bg-white p-8 rounded-2xl max-w-sm text-center border-2 shadow-2xl transition-colors ${
              modalType === "warning"
                ? "border-red-500"
                : modalType === "success"
                  ? "border-green-500"
                  : "border-blue-500"
            }`}
          >
            <h3
              className={`text-xl font-bold mb-2 ${
                modalType === "warning"
                  ? "text-red-600"
                  : modalType === "success"
                    ? "text-green-600"
                    : "text-blue-600"
              }`}
            >
              {modalType === "warning"
                ? "Cảnh báo vi phạm!"
                : modalType === "success"
                  ? "Hoàn thành!"
                  : "Thông báo hệ thống"}
            </h3>

            <p className="mb-6 text-gray-700 font-medium">{warningMessage}</p>

            {modalType === "warning" &&
            !isSubmittingRef.current &&
            !warningMessage.includes("Đình chỉ thi") ? (
              <button
                onClick={() => setIsWarningVisible(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg w-full transition-colors"
              >
                Tôi đã hiểu và quay lại thi
              </button>
            ) : (
              <button
                disabled
                className={`px-6 py-2 text-white font-bold rounded-lg w-full cursor-not-allowed ${
                  modalType === "success" ? "bg-green-500" : "bg-gray-400"
                }`}
              >
                {modalType === "success" ? "Đang chuyển hướng..." : "Hệ thống đang xử lý..."}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ExamPage = () => (
  <ExamErrorBoundary>
    <ExamPageContent />
  </ExamErrorBoundary>
);

export default ExamPage;
