import React from "react";
import type { IExam } from "../../../../interface/examInterface";

export type ExamPopupState = "NONE" | "NO_EXAM" | "NOT_YET_TIME" | "COUNTDOWN" | "READY" | "LOADING";

interface ExamLobbyModalsProps {
  examPopupState: ExamPopupState;
  selectedExam: IExam | null;
  countdown: number;
  formatTime: (seconds: number) => string;
  onStartAttemptFromLobby: () => void;
  onClose: () => void;
}

export const ExamLobbyModals: React.FC<ExamLobbyModalsProps> = React.memo(
  ({
    examPopupState,
    selectedExam,
    countdown,
    formatTime,
    onStartAttemptFromLobby,
    onClose,
  }) => {
    if (examPopupState === "NONE") return null;

    return (
      <>
        {/* 1. POPUP: KHÔNG CÓ KỲ THI */}
        {examPopupState === "NO_EXAM" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center border-2 border-red-500 shadow-2xl">
              <span className="material-symbols-outlined text-5xl text-red-500 mb-2">event_busy</span>
              <h3 className="text-xl font-bold text-red-600 mb-2">Thông báo</h3>
              <p className="text-gray-700 font-medium">Kỳ thi này không tồn tại hoặc đã bị gỡ!</p>
              <p className="text-sm text-gray-400 mt-4">(Tự động đóng...)</p>
            </div>
          </div>
        )}

        {/* 2. POPUP: CHƯA ĐẾN GIỜ THI */}
        {examPopupState === "NOT_YET_TIME" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center border border-outline-variant shadow-2xl">
              <span className="material-symbols-outlined text-5xl text-yellow-500 mb-3">warning</span>
              <h3 className="text-2xl font-bold text-on-surface mb-2">Chưa đến giờ thi!</h3>
              <p className="text-gray-700 font-medium mb-4">
                Bài thi <span className="text-primary font-bold">"{selectedExam?.title}"</span> chưa mở phòng chờ.
              </p>
              <div className="bg-surface-container-low p-4 rounded-xl mb-6">
                <p className="text-sm text-secondary mb-1">Thời gian đếm ngược mở phòng chờ:</p>
                <div className="font-mono text-3xl font-bold text-primary tracking-wider">
                  {formatTime(countdown)}
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 bg-surface-container-high hover:bg-outline-variant text-on-surface font-bold rounded-xl transition-colors"
              >
                Đã hiểu, quay lại sau
              </button>
            </div>
          </div>
        )}

        {/* 3. POPUP: PHÒNG CHỜ ĐẾM NGƯỢC THỜI GIAN THỰC */}
        {examPopupState === "COUNTDOWN" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center border-2 border-primary shadow-2xl">
              <span className="material-symbols-outlined text-5xl text-primary mb-3 animate-bounce">
                timer
              </span>
              <h3 className="text-2xl font-bold text-on-surface mb-2">Phòng chờ bài thi</h3>
              <p className="text-gray-600 font-medium mb-4">
                Bạn đang trong phòng chờ bài thi{" "}
                <span className="text-primary font-bold">"{selectedExam?.title}"</span>.
              </p>
              <div className="bg-primary-container/20 p-6 rounded-xl border border-primary/20 mb-6">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-2">
                  Bài thi sẽ tự động bắt đầu sau
                </p>
                <div className="font-mono text-4xl font-bold text-primary tracking-widest">
                  {formatTime(countdown)}
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">Vui lòng không thoát hoặc tải lại trang web.</p>
            </div>
          </div>
        )}

        {/* 4. POPUP: SẴN SÀNG BẮT ĐẦU */}
        {examPopupState === "READY" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
            <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center border-2 border-green-500 shadow-2xl">
              <span className="material-symbols-outlined text-5xl text-green-500 mb-3 animate-pulse">
                check_circle
              </span>
              <h3 className="text-2xl font-bold text-on-surface mb-2">Đã đến giờ làm bài!</h3>
              <p className="text-gray-600 font-medium mb-6">
                Phòng thi <span className="text-primary font-bold">"{selectedExam?.title}"</span> đã chính thức mở. Nhấn nút bên dưới để bắt đầu.
              </p>
              <button
                onClick={onStartAttemptFromLobby}
                className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg transition-transform active:scale-95"
              >
                🚀 Bắt đầu làm bài thi ngay
              </button>
            </div>
          </div>
        )}

        {/* 5. POPUP: ĐANG TẠO PHIÊN LÀM BÀI */}
        {examPopupState === "LOADING" && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-on-surface">Đang khởi tạo đề thi...</h3>
              <p className="text-xs text-gray-500 mt-2">Vui lòng chờ trong giây lát</p>
            </div>
          </div>
        )}
      </>
    );
  }
);

ExamLobbyModals.displayName = "ExamLobbyModals";

export default ExamLobbyModals;
