import React from "react";

interface StudentLiveSidebarProps {
  meetingRoomId: string;
  isLiveLoading: boolean;
  onJoinClick: () => void;
}

export const StudentLiveSidebar: React.FC<StudentLiveSidebarProps> = ({
  meetingRoomId,
  isLiveLoading,
  onJoinClick,
}) => {
  return (
    <div className="space-y-2">
      <button
        onClick={onJoinClick}
        disabled={isLiveLoading}
        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition-transform active:scale-95 shadow-lg disabled:opacity-60 ${
          meetingRoomId ? "bg-red-600 text-white animate-pulse" : "bg-primary text-on-primary"
        }`}
      >
        <span className="material-symbols-outlined">video_call</span>
        <span className="text-sm">
          {isLiveLoading ? "Đang vào..." : meetingRoomId ? "🔴 Vào lớp đang diễn ra" : "Học trực tuyến"}
        </span>
      </button>
    </div>
  );
};
