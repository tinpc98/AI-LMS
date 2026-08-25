import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useClassDetail } from "../hooks/useClassDetail";

// Ant Design 5 & Common Components
import { Alert, Skeleton, Tabs, Space } from "antd";
import {
  FolderOpenOutlined,
  ReadOutlined,
  FormOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../shared/components/PageContainer";
import LearningMaterialsTab from "../components/classDetail/materials/LearningMaterialsTab";
import AssignmentsTab from "../components/classDetail/assignments/AssignmentsTab";
import GradesTab from "../components/classDetail/grades/GradesTab";
import AttendanceTab from "../components/classDetail/attendance/AttendanceTab";
import LiveClassTab from "../components/classDetail/live/LiveClassTab";

import { useJitsiLiveSession } from "../../live-session/hooks/useJitsiLiveSession";
import { useStudentLive } from "../../live-session/hooks/useStudentLive";
import {
  sortLessons,
  formatLessonDisplayTitle,
} from "../../lesson/utils/lessonHelper";
import { useBreadcrumb } from "../../../shared/context/BreadcrumbContext";

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "lessons");

  // Sync tab with URL
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key }, { replace: true });
  };
  const [searchQuery] = useState<string>("");

  // Custom hook for class details data
  const { classInfo, lessons, assignments, isLoading, errorMsg } =
    useClassDetail(classId);

  const { setBreadcrumbEntity } = useBreadcrumb();

  useEffect(() => {
    if (isLoading) {
      setBreadcrumbEntity(null, true);
    } else if (classInfo) {
      const title = classInfo.code
        ? `Lớp ${classInfo.code} - ${classInfo.name}`
        : (classInfo.name || "Chi tiết lớp học");
      setBreadcrumbEntity(title, false);
    }
    return () => {
      setBreadcrumbEntity(null, false);
    };
  }, [isLoading, classInfo, setBreadcrumbEntity]);

  // Custom hook for Live Session
  const {
    activeSession: jitsiActiveSession,
    handleJoinLiveClass,
  } = useJitsiLiveSession({ classId, isTeacher: false });

  const { refreshLiveSession } = useStudentLive(
    classId,
    jitsiActiveSession,
    classInfo
  );

  // Sync state when Socket notifies useJitsiLiveSession that session started/ended
  useEffect(() => {
    refreshLiveSession();
  }, [jitsiActiveSession, refreshLiveSession]);


  if (isLoading) {
    return (
      <PageContainer maxWidth="1400px">
        <Skeleton active avatar paragraph={{ rows: 4 }} style={{ marginBottom: 24 }} />
        <Skeleton active paragraph={{ rows: 8 }} />
      </PageContainer>
    );
  }

  if (errorMsg || !classInfo) {
    return (
      <PageContainer maxWidth="1400px">
        <Alert
          message="Không tìm thấy thông tin lớp học"
          description={errorMsg || "Lớp học bạn đang tìm kiếm không tồn tại hoặc đã bị xóa."}
          type="error"
          showIcon
          action={
            <Link to="/student/myclasses">
              <span style={{ color: "var(--color-action-primary-bg)", fontWeight: 700 }}>Quay lại danh sách lớp học</span>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const sortedLessons = sortLessons(lessons);
  const filteredLessons = sortedLessons.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const resourceList = Array.isArray((classInfo as any)?.resources)
    ? (classInfo as any).resources
    : [];

  const tabItems = [
    {
      key: "lessons",
      label: (
        <Space>
          <ReadOutlined />
          <span>Bài giảng ({filteredLessons.length})</span>
        </Space>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-on-surface">Danh sách bài học</h3>
            <span className="px-3 py-1 bg-surface-container-high rounded text-xs text-secondary font-medium">
              {filteredLessons.length} bài học
            </span>
          </div>
          {filteredLessons.length === 0 ? (
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 text-center text-secondary">
              <span className="material-symbols-outlined text-4xl mb-2 text-outline">
                description
              </span>
              <p className="text-sm">Giảng viên chưa đăng tải giáo trình nào cho lớp này.</p>
            </div>
          ) : (
            filteredLessons.map((lesson) => {
              const lessonIndex = sortedLessons.findIndex((x) => x._id === lesson._id);
              const displayTitle = formatLessonDisplayTitle(
                lessonIndex >= 0 ? lessonIndex : 0,
                lesson.title
              );
              return (
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
                        {displayTitle}
                      </h4>
                      <p className="text-xs text-secondary line-clamp-1 mt-0.5">
                        {lesson.description || "Không có mô tả chi tiết cho bài học này."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                    {lesson.videoUrl && (
                      <Link
                        to={`/student/classdetail/${classId}/lecture/${lesson._id}`}
                        className="px-4 py-2 text-xs font-bold text-primary bg-primary-container/20 hover:bg-primary hover:text-white rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <span
                          className="material-symbols-outlined text-sm"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          play_circle
                        </span>
                        Xem video
                      </Link>
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
                          <span className="material-symbols-outlined text-xl">download</span>
                        </a>
                      ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ),
    },
    {
      key: "materials",
      label: (
        <Space>
          <FolderOpenOutlined />
          <span>Tài liệu ({resourceList.length})</span>
        </Space>
      ),
      children: (
        <LearningMaterialsTab
          classId={classId}
          resources={resourceList}
          loading={isLoading}
        />
      ),
    },
    {
      key: "assignments",
      label: (
        <Space>
          <FormOutlined />
          <span>Bài tập ({assignments.length})</span>
        </Space>
      ),
      children: (
        <AssignmentsTab
          assignments={assignments}
          loading={isLoading}
        />
      ),
    },
    {
      key: "live",
      label: (
        <Space>
          <VideoCameraOutlined />
          <span>Phòng học Live</span>
        </Space>
      ),
      children: (
        <LiveClassTab
          classId={classId}
          classInfo={classInfo}
          onJoinLiveRoom={handleJoinLiveClass}
        />
      ),
    },
    {
      key: "grades",
      label: (
        <Space>
          <BarChartOutlined />
          <span>Bảng điểm</span>
        </Space>
      ),
      children: classId ? <GradesTab classId={classId} /> : null,
    },
    {
      key: "attendance",
      label: (
        <Space>
          <CheckSquareOutlined />
          <span>Điểm danh</span>
        </Space>
      ),
      children: classId ? <AttendanceTab classId={classId} /> : null,
    }
  ];

  return (
    <PageContainer maxWidth="1400px">
      {/* 1. MINIMALIST HEADER */}
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center" }}>
        <Link 
          to="/student/myclasses" 
          style={{ 
            color: "#6b7280", // text-gray-500
            fontSize: 15, 
            display: "flex", 
            alignItems: "center",
            textDecoration: "none",
            fontWeight: 500
          }}
          className="hover:text-primary transition-colors"
        >
          <ArrowLeftOutlined style={{ marginRight: 6 }} /> Quay lại
          <span style={{ margin: "0 10px", color: "#d1d5db" }}>|</span>
          <span>
            {classInfo.name} {classInfo.teacherId ? `(Giảng viên: ${(classInfo.teacherId as any).fullName || classInfo.teacherId})` : ""}
          </span>
        </Link>
      </div>

      {/* 2. TABS SYSTEM */}
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--color-border-default)",
          padding: "16px 24px 24px",
        }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={tabItems}
          size="large"
          tabBarStyle={{
            marginBottom: 24,
            fontWeight: 600,
          }}
        />
      </div>
    </PageContainer>
  );
}
