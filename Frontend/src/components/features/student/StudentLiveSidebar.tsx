import React from "react";

interface StudentLiveSidebarProps {
  liveRoomName: string;
  isLiveLoading: boolean;
  onJoinClick: (targetCode?: string) => void;
  showRoomCodeInput: boolean;
  setShowRoomCodeInput: React.Dispatch<React.SetStateAction<boolean>>;
  customRoomCode: string;
  setCustomRoomCode: (code: string) => void;
}

export const StudentLiveSidebar: React.FC<StudentLiveSidebarProps> = ({
  liveRoomName,
  isLiveLoading,
  onJoinClick,
  showRoomCodeInput,
  setShowRoomCodeInput,
  customRoomCode,
  setCustomRoomCode,
}) => {
  return (
    <div className="space-y-2">
      <button
        onClick={() => onJoinClick()}
        disabled={isLiveLoading}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-transform active:scale-95 shadow-lg disabled:opacity-60 ${
          liveRoomName ? "bg-red-600 text-white animate-pulse" : "bg-primary text-on-primary"
        }`}
      >
        <span className="material-symbols-outlined">video_call</span>
        <span className="text-sm">
          {isLiveLoading ? "Đang vào..." : liveRoomName ? "🔴 Vào lớp đang diễn ra" : "Join Online Class"}
        </span>
      </button>

      {/* Ô nhập mã phòng thủ công */}
      {!showRoomCodeInput ? (
        <button
          onClick={() => setShowRoomCodeInput(true)}
          className="w-full text-xs text-secondary hover:text-primary transition-colors text-center py-1 font-medium"
        >
          + Nhập mã phòng thủ công
        </button>
      ) : (
        <div className="flex gap-1 pt-1">
          <input
            type="text"
            placeholder="Mã phòng..."
            value={customRoomCode}
            onChange={(e) => setCustomRoomCode(e.target.value)}
            className="w-full px-2 py-1.5 text-xs rounded-lg border border-outline bg-surface text-on-surface"
          />
          <button
            onClick={() => {
              if (customRoomCode.trim()) {
                onJoinClick(customRoomCode.trim());
              }
            }}
            className="px-3 py-1.5 text-xs bg-secondary text-on-secondary rounded-lg font-medium whitespace-nowrap hover:bg-secondary-container"
          >
            Vào
          </button>
        </div>
      )}
    </div>
  );
};
