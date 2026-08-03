import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../../api/axiosClient";
import aiApi from "../../../api/aiApi";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

export default function ExamAttemptDetail() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [reviewData, setReviewData] = useState<any>(null);
  const [essayGrades, setEssayGrades] = useState<Record<string, any>>({});
  const [aiFeedbacks, setAIFeedbacks] = useState<Record<string, string>>({});
  const [aiLoading, setAILoading] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showApprovalPopup, setShowApprovalPopup] = useState(false);

  // 1. Fetch dữ liệu
  useEffect(() => {
    const fetchReviewData = async () => {
      try {
        const response = await axiosClient.get(`/api/exam-attempts/${attemptId}/review`);
        const data = response.data.data;
        setReviewData(data);

        const initialGrades: Record<string, any> = {};
        data.answersDetail.forEach((ans: any) => {
          if (ans.type === "ESSAY") {
            initialGrades[ans.questionId] = ans.pointsEarned || 0;
          }
        });
        setEssayGrades(initialGrades);
      } catch (error) {
        console.error("Lỗi tải chi tiết:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (attemptId) fetchReviewData();
  }, [attemptId]);

  // 2. Handlers
  const handleGradeChange = (qId: any, value: any, maxPoints: any) => {
    if (value === "") {
      setEssayGrades((prev) => ({ ...prev, [qId]: "" }));
      return;
    }

    let numValue = parseFloat(value);

    // Chặn tuyệt đối không cho nhập quá điểm tối đa của câu hỏi
    if (numValue > maxPoints) {
      toast.warning(`Điểm tối đa của câu hỏi này là ${maxPoints} điểm.`);
      numValue = maxPoints; // Tự động ép về mức tối đa cho phép
    }

    if (numValue < 0 || isNaN(numValue)) {
      numValue = 0;
    }

    setEssayGrades((prev) => ({ ...prev, [qId]: numValue }));
  };

  const handleAIGrade = async (qId: string, maxPoints: number) => {
    if (!attemptId) return;
    setAILoading((prev) => ({ ...prev, [qId]: true }));
    try {
      const result = await aiApi.generateGradeSuggestion(attemptId, qId);
      let score = result.suggestedScore;
      if (score > maxPoints) score = maxPoints;

      setEssayGrades((prev) => ({ ...prev, [qId]: score }));
      setAIFeedbacks((prev) => ({ ...prev, [qId]: result.feedback }));
      toast.success("AI đã đưa ra đề xuất điểm!");
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Lỗi khi gọi AI chấm điểm"));
    } finally {
      setAILoading((prev) => ({ ...prev, [qId]: false }));
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      const payload = Object.keys(essayGrades).map((qId) => {
        const points = parseFloat(essayGrades[qId]);
        return {
          questionId: qId,
          pointsEarned: isNaN(points) ? 0 : points,
        };
      });

      // Gọi API chốt điểm
      await axiosClient.put(`/api/exam-attempts/${attemptId}/grade-essay`, {
        essayGrades: payload,
      });
      toast.success("Duyệt điểm tự luận thành công!");
      setShowApprovalPopup(false);
      navigate(-1); // Quay lại trang trước
    } catch (error: any) {
      console.error("🔥 LỖI TỪ BACKEND:", error.response?.data || error);
      toast.error(getApiErrorMessage(error, "Phê duyệt điểm thất bại. Vui lòng thử lại sau."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Render Helpers
  if (isLoading) {
    return (
      <div className="ml-[280px] pt-16 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2 text-primary">
          <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
          <p className="font-medium">Đang tải dữ liệu bài làm...</p>
        </div>
      </div>
    );
  }

  if (!reviewData) {
    return (
      <div className="ml-[280px] pt-16 p-8 text-center text-red-500 font-bold">
        Không tìm thấy dữ liệu bài làm!
      </div>
    );
  }

  // Tính toán thống kê nhanh
  const correctCount = reviewData.answersDetail.filter(
    (a: any) => a.pointsEarned > 0 && a.type !== "ESSAY"
  ).length;
  const wrongCount = reviewData.answersDetail.filter(
    (a: any) => a.pointsEarned === 0 && a.type !== "ESSAY"
  ).length;

  return (
    <main className="ml-[280px] pt-16 min-h-screen bg-[var(--color-bg-page)] p-6 md:p-8 font-sans">
      {/* ========================================== */}
      {/* 1. HEADER CARD (Thông tin tổng quan) */}
      {/* ========================================== */}
      <section className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center mb-6 shadow-sm">
        <div className="flex items-center gap-5">
          <img
            src={
              reviewData.student?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(reviewData.student?.fullName || "User")}&background=E0E7FF&color=4338CA`
            }
            className="w-20 h-20 rounded-xl object-cover border border-gray-100"
            alt="avatar"
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">{reviewData.student?.fullName}</h2>
              <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100">
                ID: {reviewData.student?.studentCode || "Chưa cập nhật"}
              </span>
            </div>
            <p className="text-primary font-semibold text-base mb-2">
              {reviewData.examInfo?.title}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">schedule</span> Thời gian
                làm bài: {reviewData.duration || "Không rõ"}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">calendar_today</span> Ngày
                nộp: {new Date(reviewData.submittedAt).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 md:mt-0 flex flex-col items-end">
          <div className="flex items-center gap-2 bg-indigo-50 text-primary border border-indigo-100 px-4 py-1.5 rounded-full text-sm font-semibold mb-3">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span> Đang duyệt
            bài
          </div>
          <p className="text-5xl font-extrabold text-gray-900 tracking-tight">
            {reviewData.totalScore}
            <span className="text-2xl text-gray-400 font-medium tracking-normal">/10</span>
          </p>
          <p
            className={`font-bold uppercase tracking-wider text-xs mt-1 ${reviewData.totalScore >= 5 ? "text-green-600" : "text-red-500"}`}
          >
            {reviewData.totalScore >= 8
              ? "Vượt mục tiêu"
              : reviewData.totalScore >= 5
                ? "Đạt yêu cầu"
                : "Cần cố gắng"}
          </p>
        </div>
      </section>

      {/* ========================================== */}
      {/* 2. MAIN LAYOUT */}
      {/* ========================================== */}
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* CỘT TRÁI */}
        <div className="flex-1 w-full bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <span className="material-symbols-outlined text-gray-500">description</span> Chi tiết
              bài làm
            </h3>
            <div className="flex gap-2 text-sm font-bold">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md">
                {correctCount} Đúng
              </span>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded-md">{wrongCount} Sai</span>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {reviewData.answersDetail.map((ans: any, idx: number) => (
              <div
                key={ans.questionId}
                className="border-b border-gray-100 pb-8 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-bold text-gray-800 text-base">
                    Câu {idx + 1}:{" "}
                    <span className="font-normal text-gray-600">
                      {ans.type === "ESSAY" ? "Tự luận" : "Trắc nghiệm"}
                    </span>
                  </h4>

                  {ans.type === "ESSAY" ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-lg">
                        <span className="text-sm font-medium text-yellow-700">
                          Chấm điểm (Tối đa: {ans.maxPoints || 5}đ):
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={ans.maxPoints ?? 1}
                          step="0.25"
                          className="w-16 border border-yellow-300 rounded-md p-1 text-center font-bold text-yellow-800 focus:outline-none focus:ring-2 focus:ring-yellow-400 bg-white"
                          value={
                            essayGrades[ans.questionId] !== undefined
                              ? essayGrades[ans.questionId]
                              : ""
                          }
                          onChange={(e) =>
                            handleGradeChange(ans.questionId, e.target.value, ans.maxPoints || 5)
                          }
                        />
                      </div>
                      <button
                        onClick={() => handleAIGrade(ans.questionId, ans.maxPoints || 5)}
                        disabled={aiLoading[ans.questionId]}
                        className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {aiLoading[ans.questionId] ? (
                          <span className="material-symbols-outlined text-sm animate-spin">
                            progress_activity
                          </span>
                        ) : (
                          <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        )}
                        Gợi ý AI
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-md ${ans.pointsEarned > 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                    >
                      {ans.pointsEarned} / {ans.maxPoints || 1.0} Điểm
                    </span>
                  )}
                </div>

                <p className="text-gray-800 font-medium mb-5">{ans.questionContent}</p>

                {ans.type !== "ESSAY" && (
                  <div className="space-y-3">
                    {ans.options && ans.options.length > 0 ? (
                      ans.options.map((opt: any, i: number) => {
                        const optText = typeof opt === "string" ? opt : opt.text;

                        const letterKey = String.fromCharCode(65 + i);
                        const studentAns = String(ans.studentAnswer || "").trim();

                        const isStudentChoice =
                          studentAns === optText.trim() ||
                          studentAns === letterKey ||
                          studentAns === String(i) ||
                          studentAns === `Option ${i}`;

                        const isCorrectAnswer =
                          ans.correctAnswer?.trim() === optText.trim() ||
                          ans.correctAnswer?.trim() === letterKey;

                        let optionStyle = "border-gray-200 text-gray-600 bg-white";
                        let icon = null;

                        if (isCorrectAnswer) {
                          optionStyle = "border-green-500 bg-green-50 text-green-800 font-medium";
                          icon = (
                            <span className="material-symbols-outlined text-green-600 ml-auto">
                              check_circle
                            </span>
                          );
                        }

                        if (isStudentChoice && !isCorrectAnswer) {
                          optionStyle = "border-red-400 bg-red-50 text-red-800 font-medium";
                          icon = (
                            <span className="material-symbols-outlined text-red-500 ml-auto">
                              cancel
                            </span>
                          );
                        }

                        return (
                          <div
                            key={i}
                            className={`flex items-center p-4 border rounded-xl transition-all ${optionStyle}`}
                          >
                            <span>
                              {letterKey}. {optText}
                            </span>
                            {icon}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-gray-400 italic">Không có danh sách lựa chọn.</div>
                    )}
                  </div>
                )}

                {ans.type === "ESSAY" && (
                  <>
                    <div className="bg-blue-50/50 border border-blue-100 p-5 rounded-xl mt-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-2">
                        Bài làm của học sinh:
                      </p>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {ans.studentAnswer || (
                          <span className="text-gray-400 italic">
                            Học sinh không nhập câu trả lời.
                          </span>
                        )}
                      </p>
                    </div>
                    {aiFeedbacks[ans.questionId] && (
                      <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl mt-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-500 mb-2 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">
                            auto_awesome
                          </span>
                          Nhận xét từ AI Scholar:
                        </p>
                        <p className="text-gray-800 whitespace-pre-wrap text-sm">
                          {aiFeedbacks[ans.questionId]}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="w-full xl:w-[350px] shrink-0 sticky top-24 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800 text-lg">Gian lận</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${reviewData.cheatWarnings > 0 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
              >
                {reviewData.cheatWarnings > 0 ? "Cảnh báo" : "An toàn"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <p
                  className={`text-2xl font-black ${reviewData.cheatWarnings > 0 ? "text-red-500" : "text-gray-800"}`}
                >
                  {reviewData.cheatWarnings || 0}
                </p>
                <p className="text-xs font-bold text-gray-500 uppercase mt-1">Lần cảnh báo</p>
              </div>
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-gray-800">0</p>
                <p className="text-xs font-bold text-gray-500 uppercase mt-1">Vi phạm nặng</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-0 shadow-sm overflow-hidden flex flex-col max-h-[350px]">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-500">policy</span> Log hành vi
              </h3>
              <span className="span text-xs font-bold text-gray-400">
                Tổng: {reviewData.cheatWarnings || 0} lần
              </span>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {reviewData.cheatWarnings > 0 ? (
                <div className="relative pl-6 border-l-2 border-red-400 pb-2">
                  <div className="absolute w-3 h-3 bg-red-500 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-red-500 text-sm">Hệ thống giám sát</p>
                  </div>
                  <h4 className="font-bold text-gray-800 mt-1">Cảnh báo rời tab / mất focus</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Học sinh đã vi phạm tổng cộng{" "}
                    <strong className="text-red-600">{reviewData.cheatWarnings}</strong> lần trong
                    quá trình làm bài.
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4 font-medium">
                  Không phát hiện gian lận.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 transition">
              <span className="material-symbols-outlined">videocam</span> Xem lại
            </button>
            <button
              onClick={() => setShowApprovalPopup(true)}
              className="flex-[1.5] bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition shadow-md shadow-primary/30"
            >
              <span className="material-symbols-outlined">verified</span> Phê duyệt
            </button>
          </div>
        </div>
      </div>

      {showApprovalPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-blue-100 text-primary flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-2xl">task_alt</span>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
              Xác nhận phê duyệt?
            </h3>
            <p className="text-center text-gray-500 mb-6">
              Bạn sắp chốt điểm cho học sinh{" "}
              <strong className="text-gray-800">{reviewData.student?.fullName}</strong>. Hành động
              này sẽ cập nhật điểm chính thức vào hệ thống.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowApprovalPopup(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-sm">
                      progress_activity
                    </span>{" "}
                    Đang xử lý...
                  </>
                ) : (
                  "Đồng ý"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
