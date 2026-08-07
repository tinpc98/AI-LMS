import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useExamTimer from "../hooks/useExamTimer";
import axiosClient from "../../../api/axiosClient";
import useAntiCheat from "../hooks/useAntiCheat";
import useAnswerAutosave, { type DraftAnswer } from "../hooks/useAnswerAutosave";
import ExamErrorBoundary from "../components/ExamErrorBoundary";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { isChoiceQuestion, isEssayQuestion, isShortAnswerQuestion } from "../../../shared/utils/questionTypeUtils";

const ExamPageContent = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  // CỜ QUAN TRỌNG: Dùng để chặn bộ đếm gian lận chạy khi đang nộp bài
  const isSubmittingRef = useRef(false);
  const examContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasEnteredFullscreenOnce, setHasEnteredFullscreenOnce] = useState(false);
  const isExitingIntentionally = useRef(false);


  const handleCheatAlertRef = useRef<any>(null);
  const syncCheatWarningsRef = useRef<any>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        setIsFullscreen(true);
        setHasEnteredFullscreenOnce(true);
      } else {
        setIsFullscreen(false);
        if (isExitingIntentionally.current) {
          isExitingIntentionally.current = false;
        } else if (!isSubmittingRef.current && handleCheatAlertRef.current) {
          handleCheatAlertRef.current("Thoát chế độ toàn màn hình");
        }
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
  
  const [hasShown5MinWarning, setHasShown5MinWarning] = useState(false);
  const [hasShown1MinWarning, setHasShown1MinWarning] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const sessionToken = localStorage.getItem(`exam_token_${attemptId}`);
  const answersVersionRef = useRef<number>(0);
  // Offset = serverTime - clientTime tại lúc fetch. Dương: giờ máy khách chậm hơn server.
  const [serverTimeOffset, setServerTimeOffset] = useState<number>(0);

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
  const [currentWarnings, setCurrentWarnings] = useState(0);
  const [isSyncingCheat, setIsSyncingCheat] = useState(false);
  const MAX_WARNINGS = 5;

  const [examClassId, setExamClassId] = useState<string | null>(null);

  // ==========================================
  // 3. FETCH DỮ LIỆU ĐỀ THI TỪ BACKEND
  // ==========================================
  useEffect(() => {
    let isMounted = true;
    const fetchExamData = async () => {
      try {
        const response = await axiosClient.get(`/api/exam-attempts/${attemptId}`);
        if (!isMounted) return;

        const data = response.data.data || response.data;

        if (data && data.questions) {
          setQuestions(data.questions);

          if (data.examInfo?.duration) {
            setExamDuration(data.examInfo.duration); 
          }
          if (data.examInfo?.classId) {
            setExamClassId(data.examInfo.classId);
          }
          if (data.endTime) {
            setExamEndTime(data.endTime);
          }
          if (data.serverTime) {
            const serverMs = new Date(data.serverTime).getTime();
            setServerTimeOffset(serverMs - Date.now());
          }

          if (data.answersVersion !== undefined) {
            // Chỉ cập nhật nếu chưa có dữ liệu mới hơn (tránh đè khi đang PATCH)
            if (answersVersionRef.current === 0 || data.answersVersion > answersVersionRef.current) {
              answersVersionRef.current = data.answersVersion;
            }
          }
          
          if (data.cheatWarnings !== undefined) {
            setCurrentWarnings(data.cheatWarnings);
          }

          setIsLoading(false);
        }
      } catch (error: unknown) {
        if (!isMounted) return;
        console.error("Lỗi khi tải đề thi:", error);
        setWarningMessage("Không thể tải dữ liệu đề thi. Đang quay lại...");
        setIsWarningVisible(true);
        setTimeout(() => navigate("/student/myclasses"), 2000);
      }
    };
    if (attemptId) fetchExamData();
    
    return () => {
      isMounted = false;
    };
  }, [attemptId, navigate]);

  // ==========================================
  // 3.5. HEARTBEAT API
  // ==========================================
  useEffect(() => {
    if (!attemptId || !sessionToken) return;
    const ping = async () => {
      try {
        await axiosClient.post(`/api/exam-attempts/${attemptId}/heartbeat`, null, {
          headers: { "x-session-token": sessionToken },
        });
        
        // Cố gắng đồng bộ cảnh báo gian lận nếu có
        if (syncCheatWarningsRef.current) {
          syncCheatWarningsRef.current();
        }
      } catch (err: any) {
        if (err?.response?.data?.errorCode === "SESSION_MISMATCH") {
           setWarningMessage("Bài thi này đang được làm ở thiết bị khác. Không thể tiếp tục ở đây.");
           setIsWarningVisible(true);
           setModalType("warning");
        }
      }
    };
    const timer = setInterval(ping, 30000);
    return () => clearInterval(timer);
  }, [attemptId, sessionToken]);

  // ==========================================
  // 4. HÀM XỬ LÝ NỘP BÀI CHUNG
  // ==========================================
  const handleAutoSubmit = async (isForced = false, reasonText?: string) => {
    isSubmittingRef.current = true;
    setModalType(isForced ? "warning" : "info");
    setWarningMessage(reasonText || "Hệ thống đang xử lý nộp bài, vui lòng không tắt trình duyệt...");
    setIsWarningVisible(true);

    try {
      const formattedAnswers = Object.keys(answers).map((qId) => {
        const question = questions.find((q) => q._id === qId);
        const isChoice = isChoiceQuestion(question?.type);
        const isTextBased = isEssayQuestion(question?.type) || isShortAnswerQuestion(question?.type);
        
        return {
          questionId: qId,
          selectedOption: isChoice ? answers[qId] : undefined,
          essayText: isTextBased ? answers[qId] : undefined,
        };
      });

      const config = sessionToken ? { headers: { "x-session-token": sessionToken } } : {};
      const response = await axiosClient.post(`/api/exam-attempts/${attemptId}/submit`, {
        answers: formattedAnswers,
        answersVersion: answersVersionRef.current,
        isForcedSubmit: isForced,
      }, config);

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
    } catch (error: any) {
      isSubmittingRef.current = false;
      console.error("Lỗi nộp bài:", error);
      setModalType("warning");
      
      // Nếu là lỗi 403 (Đã quá hạn / Không được phép nộp) hoặc 400 (đã nộp) -> Lấy thẳng message Tiếng Việt từ server
      if (error?.response?.status === 403 || error?.response?.status === 409 || error?.response?.status === 400) {
        setWarningMessage(error.response.data.message || "Đã quá hạn nộp bài. Hệ thống không chấp nhận bài nộp muộn.");
        setTimeout(() => {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          navigate(examClassId ? `/student/classdetail/${examClassId}` : "/student/myclasses");
        }, 2000);
      } else {
        setWarningMessage(getApiErrorMessage(error, "Có lỗi xảy ra khi nộp bài!"));
      }
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

  // Wrapper cho onTimeUp để hiển thị đúng câu thông báo
  const handleTimeUp = useCallback(() => {
    handleAutoSubmit(true, "Đã hết giờ, bài của bạn đang được tự động nộp...");
  }, [answers, questions]); // Bắt buộc phụ thuộc vào answers, questions tại thời điểm hết giờ

  // Gọi Hook. useExamTimer cần được viết để NHẬN SỐ GIÂY (seconds) thay vì phút.
  const { timeLeft, formattedTime } = useExamTimer(
    totalSeconds, // Truyền giây vào đây
    attemptId,
    handleTimeUp,
    examEndTime, // Truyền thêm thời điểm kết thúc tuyệt đối (nếu có)
    serverTimeOffset // Offset để bù lệch đồng hồ
  );

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 300 && timeLeft > 60 && !hasShown5MinWarning) {
      setHasShown5MinWarning(true);
      setModalType("warning");
      setWarningMessage("Chú ý: Bạn chỉ còn 5 phút để hoàn thành bài thi!");
      setIsWarningVisible(true);
      // Tự động đóng cảnh báo 5 phút sau 3 giây để không vướng màn hình lâu
      setTimeout(() => setIsWarningVisible(false), 3000);
    } else if (timeLeft <= 60 && timeLeft > 0 && !hasShown1MinWarning) {
      setHasShown1MinWarning(true);
      setModalType("warning");
      setWarningMessage("CẢNH BÁO: Chỉ còn 1 phút! Hãy kiểm tra lại bài làm và chuẩn bị nộp.");
      setIsWarningVisible(true);
      setTimeout(() => setIsWarningVisible(false), 3000);
    }
  }, [timeLeft, hasShown5MinWarning, hasShown1MinWarning]);

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
  const lastCheatTimesRef = useRef<Record<string, number>>({});

  // Hàm đồng bộ hàng đợi vi phạm lên server
  const syncCheatWarnings = useCallback(async () => {
    if (!attemptId) return 0;
    const queueKey = `exam_cheat_queue_${attemptId}`;
    const queue = JSON.parse(localStorage.getItem(queueKey) || "[]");
    if (queue.length === 0) return 0;

    try {
      let maxWarnings = 0;
      let thresholdReached = false;
      // Gửi từng vi phạm lên server
      for (const cheat of queue) {
        try {
          const config = sessionToken ? { headers: { "x-session-token": sessionToken } } : {};
          const response = await axiosClient.post(`/api/exam-attempts/${attemptId}/warning`, {
            cheatType: cheat.type,
          }, config);
          maxWarnings = Math.max(maxWarnings, response.data.cheatWarnings);
        } catch (err: any) {
          if (err?.response?.data?.errorCode === "CHEAT_THRESHOLD_REACHED") {
            thresholdReached = true;
            break;
          }
          throw err; // Bắn ra ngoài để dừng vòng lặp, giữ lại phần chưa gửi
        }
      }
      
      // Xóa queue nếu tất cả đều thành công
      localStorage.setItem(queueKey, JSON.stringify([]));

      if (thresholdReached || maxWarnings >= MAX_WARNINGS) {
        isSubmittingRef.current = true;
        setModalType("warning");
        setWarningMessage(`Bạn đã vi phạm quy chế thi từ 5 lần trở lên.\nHệ thống đã tự động nộp bài và kết quả bài thi sẽ bằng 0 điểm.`);
        setIsWarningVisible(true);
        setTimeout(() => {
          localStorage.removeItem(draftKey);
          localStorage.removeItem(flaggedKey);
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
          navigate(examClassId ? `/student/classdetail/${examClassId}` : "/student/myclasses");
        }, 3000);
      }
      
      setCurrentWarnings(maxWarnings);
      return maxWarnings;
    } catch (error) {
      console.error("Đồng bộ cảnh báo lỗi:", error);
      throw error;
    }
  }, [attemptId, examClassId, navigate, draftKey, flaggedKey, sessionToken]);

  // Phải gán lại vào ref để các dependency bên trong handleCheatAlert luôn lấy mới nhất
  const handleCheatAlert = async (reason: string) => {
    if (isSubmittingRef.current) return;
    
    const resolvedCheatType = reason.includes("toàn màn hình") ? "FULLSCREEN_EXIT" : "TAB_SWITCH";
    const now = Date.now();
    const lastTime = lastCheatTimesRef.current[resolvedCheatType] || 0;
    
    // Chống đếm trùng: cùng 1 loại vi phạm trong vòng 3 giây chỉ tính 1 lần
    if (now - lastTime < 3000) {
      console.log(`Bỏ qua cảnh báo trùng lặp loại ${resolvedCheatType}`);
      return;
    }
    lastCheatTimesRef.current[resolvedCheatType] = now;

    console.log(`🚨 Lỗi gian lận: ${reason}`);

    // PHẢN HỒI TỨC THÌ: Bật popup ngay lập tức không đợi API
    setModalType("warning");
    setIsSyncingCheat(true);
    setWarningMessage(`Đang ghi nhận vi phạm: ${reason}...`);
    setIsWarningVisible(true);

    // Thêm vào hàng đợi local
    const queueKey = `exam_cheat_queue_${attemptId}`;
    const queue = JSON.parse(localStorage.getItem(queueKey) || "[]");
    queue.push({ type: resolvedCheatType, timestamp: now });
    localStorage.setItem(queueKey, JSON.stringify(queue));

    // Timeout phòng hờ
    const timeoutId = setTimeout(() => {
      setIsSyncingCheat(false);
    }, 5000);

    try {
      const serverWarnings = await syncCheatWarnings();
      // Sau khi sync thành công, nếu chưa bị đình chỉ (isSubmitting = false), ta báo lỗi vừa ghi nhận
      if (!isSubmittingRef.current) {
        const warningCount = serverWarnings > 0 ? serverWarnings : 1;
        setWarningMessage(`Bạn vừa vi phạm: ${reason}.\nCảnh báo (${warningCount}/5). Nếu vi phạm đủ 5 lần, bài thi sẽ bị chốt 0 điểm.`);
        setIsWarningVisible(true);
      }
    } catch (err: any) {
      if (!isSubmittingRef.current) {
        setWarningMessage(`Bạn vừa vi phạm: ${reason}.\n(Đang chờ đồng bộ máy chủ)`);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsSyncingCheat(false);
    }
  };

  useEffect(() => {
    handleCheatAlertRef.current = handleCheatAlert;
    syncCheatWarningsRef.current = syncCheatWarnings;
  });

  useAntiCheat(handleCheatAlert);

  // ==========================================
  // 6. CÁC HÀM TƯƠNG TÁC VỚI CÂU HỎI
  // ==========================================
  const currentQ = questions[currentIndex] as any;

  // Đẩy bài làm lên máy chủ. Điều kiện để cron tự động nộp bài khi hết giờ là CÔNG BẰNG —
  // không có bước này, phiên bị đóng sẽ được chấm với bài rỗng. Xem useAnswerAutosave.ts.
  const buildDraftAnswers = useCallback(() => {
    return Object.keys(answers).map((qId) => {
      const question = questions.find((q) => q._id === qId);
      const isChoice = isChoiceQuestion(question?.type);
      return {
        questionId: qId,
        selectedOption: isChoice ? answers[qId] : undefined,
        essayText: !isChoice ? answers[qId] : undefined,
      };
    });
  }, [answers, questions]);

  const { luuTam } = useAnswerAutosave(attemptId, buildDraftAnswers, answersVersionRef, sessionToken, !isLoading);

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
      className="bg-background text-on-surface min-h-screen overflow-hidden flex flex-col relative"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {!isFullscreen && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center bg-white backdrop-blur-md bg-opacity-95">
          {hasEnteredFullscreenOnce ? (
            <>
              <h2 className="text-3xl font-bold mb-4 text-red-600">Bạn đã thoát chế độ toàn màn hình!</h2>
              <p className="mb-8 text-gray-600 max-w-md text-center text-lg">
                Hệ thống đã ghi nhận 1 lần vi phạm. Vui lòng quay lại chế độ toàn màn hình để tiếp tục bài thi.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-4 text-primary">Chế độ thi toàn màn hình</h2>
              <p className="mb-8 text-gray-600 max-w-md text-center text-lg">
                Bài thi yêu cầu làm việc trong chế độ toàn màn hình để đảm bảo tính công bằng.
              </p>
            </>
          )}
          <button
            onClick={enterFullscreen}
            className="px-8 py-4 bg-primary text-white font-bold text-lg rounded-xl shadow-xl hover:bg-primary/90 transition-all transform hover:scale-105"
          >
            {hasEnteredFullscreenOnce ? "Quay lại toàn màn hình" : "Vào toàn màn hình và bắt đầu làm bài"}
          </button>
        </div>
      )}
      {/* Top Header */}
      <header className="h-16 shrink-0 bg-surface border-b border-outline-variant flex justify-between items-center px-8 z-50">
        <div className="flex items-center gap-4">
          <span className="font-bold text-xl text-primary">Academia AI Pro</span>
          {currentWarnings > 0 && (
            <div className="px-4 py-1.5 bg-red-100 text-red-600 text-sm rounded-lg font-bold border border-red-200 shadow-sm flex items-center gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
              Vi phạm: {currentWarnings}/5
            </div>
          )}
        </div>
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
          <button
            onClick={() => {
              if (window.confirm("CẢNH BÁO: Bạn đang thoát bài thi. Bài thi sẽ tự động được thu! Bạn có chắc chắn muốn thoát?")) {
                isExitingIntentionally.current = true;
                handleAutoSubmit(false);
              }
            }}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Thoát
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

            {/* Render Câu hỏi theo dạng */}
            {(() => {
              const isChoiceType = isChoiceQuestion(currentQ.type);
              const isShortAns = isShortAnswerQuestion(currentQ.type);

              if (isChoiceType) {
                return (
                  <div className="grid gap-4">
                    {currentQ.options?.map((opt: any, index: number) => {
                      if (!opt) return null;
                      const label = String.fromCharCode(65 + index);
                      // Hỗ trợ cả option dạng string (legacy) lẫn dạng object {id, text} (AI)
                      const optValue = typeof opt === "string" ? opt : (opt.id ?? String(index));
                      const optText = typeof opt === "string" ? opt : (opt.text ?? "Lựa chọn không hợp lệ");
                      const isSelected = answers[currentQ._id] === optValue;
                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswerChange(optValue)}
                          className={`flex items-center gap-4 p-5 rounded-xl border text-left transition-all ${isSelected ? "border-primary bg-blue-50 shadow-sm" : "border-outline-variant hover:bg-gray-50"}`}
                        >
                          <div
                            className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold ${isSelected ? "bg-primary text-white" : "bg-gray-200"}`}
                          >
                            {label}
                          </div>
                          <span className="font-medium text-lg whitespace-normal break-words break-all sm:break-normal overflow-hidden">
                            {optText}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              }

              if (isShortAns) {
                return (
                  <div className="w-full">
                    <p className="text-sm text-gray-500 mb-2 font-medium">Điền câu trả lời ngắn:</p>
                    <input
                      type="text"
                      value={answers[currentQ._id] || ""}
                      onChange={(e) => handleAnswerChange(e.target.value)}
                      placeholder="Nhập câu trả lời..."
                      className="w-full p-4 border-2 border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none text-lg"
                    />
                  </div>
                );
              }

              // essay / free_text — textarea dài
              return (
                <div className="w-full">
                  <textarea
                    value={answers[currentQ._id] || ""}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Nhập câu trả lời..."
                    className="w-full h-64 p-4 border-2 border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none resize-y text-lg"
                  />
                </div>
              );
            })()}

            <div className="flex justify-between mt-10">
              <button
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? questions.length - 1 : prev - 1))}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-bold transition-colors"
              >
                ← Câu trước
              </button>
              <button
                onClick={() => setCurrentIndex((prev) => (prev === questions.length - 1 ? 0 : prev + 1))}
                className="px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold transition-colors"
              >
                {currentIndex === questions.length - 1 ? "Xem lại từ đầu ↺" : "Câu tiếp theo →"}
              </button>
            </div>
          </div>
        </section>

        {/* Right Sidebar */}
        <aside className="w-[320px] shrink-0 bg-surface-container-low border-l border-outline-variant p-6 flex flex-col">
          <h3 className="font-bold text-lg mb-6">Danh sách câu hỏi</h3>
          <div className="grid grid-cols-5 gap-3 overflow-y-auto pr-2 custom-scrollbar content-start">
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
                  className={`w-10 h-10 rounded-lg font-bold text-sm transition-all duration-200 shrink-0 flex items-center justify-center ${boxClass} ${activeClass}`}
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
            className={`bg-white p-8 rounded-2xl max-w-sm text-center border-2 shadow-2xl transition-colors ${modalType === "warning"
                ? "border-red-500"
                : modalType === "success"
                  ? "border-green-500"
                  : "border-blue-500"
              }`}
          >
            <h3
              className={`text-xl font-bold mb-2 ${modalType === "warning"
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

            <p className="mb-6 text-gray-700 font-medium whitespace-pre-wrap">{warningMessage}</p>

            {modalType === "warning" &&
              !isSubmittingRef.current &&
              !isSyncingCheat ? (
              <button
                onClick={() => setIsWarningVisible(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg w-full transition-colors"
              >
                Đã hiểu, quay lại làm bài
              </button>
            ) : (
              <button
                disabled
                className={`px-6 py-2 text-white font-bold rounded-lg w-full cursor-not-allowed ${modalType === "success" ? "bg-green-500" : "bg-gray-400"
                  }`}
              >
                {modalType === "success" 
                  ? "Đang chuyển hướng..." 
                  : isSubmittingRef.current 
                    ? "Hệ thống đang xử lý..." 
                    : "Đang đồng bộ..."}
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
