import { useState, useEffect } from "react";
import useAntiCheat from "./../../hooks/useAntiCheat";
import useExamTimer from "./../../hooks/useExamTimer";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const ExamPage = () => {
  //Lấy ID từ bài thi
  const { attemptId } = useParams();
  const navigate = useNavigate();
  // ==========================================
  // 1. STATE BÀI LÀM VÀ AUTO-SAVE
  // ==========================================
  const [questions, setQuestions] = useState([]);
  const [examDuration, setExamDuration] = useState(60);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchExamData = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/exam-attempts/${attemptId}`,
        );
        const data = response.data.data;

        if (data) {
          // Gắn danh sách câu hỏi vào state
          setQuestions(data.questions);

          // Cập nhật thời gian làm bài (nếu Backend có trả về)
          if (data.examInfo?.duration) {
            setExamDuration(data.examInfo.duration);
          }

          setIsLoading(false); // Tắt hiệu ứng loading
        }
      } catch (error) {
        console.error("Lỗi khi tải đề thi:", error);
        alert("Không thể tải dữ liệu đề thi. Vui lòng thử lại!");
        navigate("/");
      }
    };
    if (attemptId) {
      fetchExamData();
    }
  }, [attemptId, navigate]);
  // Đọc đáp án từ LocalStorage khi khởi tạo
  const [answers, setAnswers] = useState(() => {
    const savedAnswers = localStorage.getItem("exam_draft_answers");
    return savedAnswers ? JSON.parse(savedAnswers) : {};
  });

  // Đọc danh sách cắm cờ từ LocalStorage (Biến Array thành Set)
  const [flagged, setFlagged] = useState(() => {
    const savedFlagged = localStorage.getItem("exam_draft_flagged");
    return savedFlagged ? new Set(JSON.parse(savedFlagged)) : new Set();
  });

  // Tự động lưu đáp án khi có thay đổi
  useEffect(() => {
    localStorage.setItem("exam_draft_answers", JSON.stringify(answers));
  }, [answers]);

  // Tự động lưu cờ đánh dấu khi có thay đổi (Biến Set thành Array để lưu)
  useEffect(() => {
    localStorage.setItem("exam_draft_flagged", JSON.stringify([...flagged]));
  }, [flagged]);

  // ==========================================
  // 2. STATE CẢNH BÁO GIAN LẬN
  // ==========================================
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const MAX_WARNINGS = 3;

  // ==========================================
  // 3. HÀM XỬ LÝ NỘP BÀI CHUNG (CÓ GỌI API)
  // ==========================================
  const handleAutoSubmit = async () => {
    // 1. Hiện thông báo đang xử lý để học sinh không bấm nộp nhiều lần
    setWarningMessage(
      "Hệ thống đang xử lý nộp bài, vui lòng không tắt trình duyệt...",
    );
    setIsWarningVisible(true);

    try {
      // 2. Chuyển đổi object answers (nháp) thành mảng format chuẩn mà Backend cần
      const formattedAnswers = Object.keys(answers).map((qId) => {
        // Tìm câu hỏi gốc để biết nó là trắc nghiệm hay tự luận
        const question = questions.find((q) => q._id === qId);

        return {
          questionId: qId,
          // Nếu là MCQ thì map vào selectedOption, nếu là ESSAY (đoạn hội thoại đặt bàn, mã QR...) thì map vào essayText
          selectedOption: question?.type === "MCQ" ? answers[qId] : undefined,
          essayText: question?.type === "ESSAY" ? answers[qId] : undefined,
        };
      });

      // 3. Bắn API nộp bài
      // (Lưu ý: Thay attemptId bằng biến lấy từ useParams trên URL)
      await axios.post(
        `http://localhost:5000/api/exam-attempts/${attemptId}/submit`,
        {
          answers: formattedAnswers,
        },
      );

      // 4. Dọn dẹp chiến trường: Xóa nháp LocalStorage khi nộp thành công
      localStorage.removeItem("exam_draft_answers");
      localStorage.removeItem("exam_draft_flagged");

      // 5. Chuyển hướng học sinh
      alert("Nộp bài thành công!");
      // navigate(`/exam-result/${attemptId}`); // Bỏ comment dòng này nếu bạn đã tạo trang xem điểm
    } catch (error) {
      console.error("Lỗi nộp bài:", error);
      setWarningMessage(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi nộp bài. Vui lòng kiểm tra lại mạng!",
      );
    }
  };

  const handleCheatAlert = (reason, currentViolations) => {
    console.log(`🚨 Lỗi: ${reason}. Số lần: ${currentViolations}`);

    if (currentViolations >= MAX_WARNINGS) {
      setWarningMessage(
        `Đình chỉ thi! Bạn đã vi phạm ${MAX_WARNINGS} lần. Hệ thống đang tự động nộp bài...`,
      );
      setIsWarningVisible(true);

      // Đình chỉ thi cũng phải xóa nháp luôn
      localStorage.removeItem("exam_draft_answers");
      localStorage.removeItem("exam_draft_flagged");

      console.log("Đang gọi API submitExam() do vi phạm...");
      // TODO: Gọi API submitExam() tại đây
    } else {
      setWarningMessage(
        `Lỗi: ${reason} (Vi phạm lần ${currentViolations}/${MAX_WARNINGS})`,
      );
      setIsWarningVisible(true);
    }
  };

  useAntiCheat(handleCheatAlert);

  // ==========================================
  // 5. CÁC HÀM TƯƠNG TÁC VỚI CÂU HỎI
  // ==========================================
  const currentQ = questions[currentIndex];

  const handleAnswerChange = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQ._id]: value,
    }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const newFlags = new Set(prev);
      if (newFlags.has(currentQ._id)) {
        newFlags.delete(currentQ._id);
      } else {
        newFlags.add(currentQ._id);
      }
      return newFlags;
    });
  };
  // NẾU ĐANG TẢI DỮ LIỆU -> HIỆN MÀN HÌNH LOADING
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-xl font-bold text-primary animate-pulse">
          Đang tải đề thi, vui lòng đợi...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-surface font-sans min-h-screen overflow-hidden">
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-surface border-b border-outline-variant flex justify-between items-center px-8 z-50">
        <span className="font-bold text-xl text-primary">Academia AI Pro</span>
        <div className="flex items-center gap-6">
          <div
            className={`px-6 py-2 rounded-xl font-mono text-xl shadow-lg flex items-center gap-2 transition-all duration-300 ${
              timeLeft <= 300
                ? "bg-red-600 text-white animate-pulse" // Đỏ và nhấp nháy khi còn <= 5 phút (300s)
                : "bg-primary text-white" // Trạng thái bình thường
            }`}
          >
            {/* Chỉ cần gọi hàm formattedTime() có sẵn từ Hook là xong */}
            <span>{formattedTime()}</span>
          </div>
          {/* Nút nộp bài thủ công */}
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Nộp bài
          </button>
        </div>
      </header>

      <main className="pt-16 h-screen flex">
        {/* Left Panel */}
        <section className="flex-1 overflow-y-auto p-8 pb-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">
              Câu 1: What should you say when you want to look at the list of
              dishes?
            </h2>

            <div className="grid gap-4">
              {[
                "Can I see the menu, please?",
                "Where is the menu?",
                "Give me menu",
                "I want menu",
              ].map((opt, index) => {
                const label = String.fromCharCode(65 + index); // Tạo A, B, C, D
                return (
                  <button
                    key={opt}
                    onClick={() => setSelectedOption(label)}
                    className={`flex items-center gap-4 p-5 rounded-xl border transition-all ${
                      selectedOption === label
                        ? "border-primary bg-blue-50 shadow-sm"
                        : "border-outline-variant hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        selectedOption === label
                          ? "bg-primary text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {label}
                    </div>
                    <span className="font-medium">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right Sidebar - Question Palette */}
        <aside className="w-[280px] bg-surface-container-low border-l border-outline-variant p-6 overflow-y-auto">
          <h3 className="font-bold mb-4">Danh sách câu hỏi</h3>
          <div className="grid grid-cols-5 gap-2">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold cursor-pointer transition-colors ${
                  i === 0
                    ? "border-2 border-primary"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </aside>
      </main>

      {/* Warning Modal */}
      {isWarningVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl max-w-sm text-center border-2 border-red-500 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-red-600 mb-2">
              Cảnh báo vi phạm!
            </h3>
            <p className="mb-6 text-gray-700 font-medium">{warningMessage}</p>

            {/* Logic vô hiệu hóa nút ở lần vi phạm cuối */}
            {!warningMessage.includes("Đình chỉ thi") ? (
              <button
                onClick={() => setIsWarningVisible(false)}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg w-full transition-colors"
              >
                Tôi đã hiểu và quay lại thi
              </button>
            ) : (
              <button
                disabled
                className="px-6 py-2 bg-gray-400 text-white font-bold rounded-lg w-full cursor-not-allowed"
              >
                Hệ thống đang nộp bài...
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
