import React from "react";
import { Link } from "react-router-dom";
import type { IClass } from "../../../interface/ClassInterface";

interface TeacherClassroomHeaderProps {
  classInfo: IClass;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  isLiveLoading: boolean;
  onStartLiveClick: () => void;
  tabItems: readonly { readonly id: string; readonly label: string; readonly icon: string }[];
}

export const TeacherClassroomHeader: React.FC<TeacherClassroomHeaderProps> = ({
  classInfo,
  activeTab,
  setActiveTab,
  isLiveLoading,
  onStartLiveClick,
  tabItems,
}) => {
  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 backdrop-blur-md bg-opacity-90 px-6 sm:px-8 flex flex-col justify-between pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
            <Link to="/teacher/classroom-management" className="hover:text-primary transition-colors">
              Quản lý lớp học
            </Link>
            <span>/</span>
            <span className="text-on-surface truncate font-medium">{classInfo.className}</span>
          </div>
          <h2
            className="text-2xl font-bold tracking-tight text-on-surface truncate"
            style={{ fontFamily: "Hanken Grotesk" }}
          >
            {classInfo.className}
          </h2>
        </div>

        {/* Các badge thông tin & nút Dạy Trực Tuyến */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold font-mono">
            Mã lớp: {classInfo.joinCode}
          </span>
          <span className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">groups</span>
            {classInfo.students?.length ?? 0} học sinh
          </span>

          {/* NÚT DẠY TRỰC TUYẾN */}
          <button
            onClick={onStartLiveClick}
            disabled={isLiveLoading}
            className="bg-[#ba1a1a] text-white text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 shadow-md hover:bg-[#a01212] active:scale-95 transition-all opacity-100 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              videocam
            </span>
            <span>{isLiveLoading ? "Đang kết nối..." : "Dạy trực tuyến"}</span>
          </button>
        </div>
      </div>

      {/* Hệ thống Tabs */}
      <nav className="flex items-center gap-6 h-12 overflow-x-auto whitespace-nowrap scrollbar-none">
        {tabItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`h-full flex items-center gap-2 border-b-2 text-sm font-semibold px-1 transition-all ${
              activeTab === tab.id
                ? "text-primary border-primary"
                : "text-on-surface-variant border-transparent hover:text-primary"
            }`}
          >
            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
