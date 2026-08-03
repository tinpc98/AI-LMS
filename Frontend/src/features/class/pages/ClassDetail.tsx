import { useEffect, useState, useCallback } from "react";
import { getCurrentUserId } from "../../../shared/utils/authToken";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosClient from "../../../api/axiosClient";
import type { IExam } from "../../../interface/examInterface";
import { toast } from "../../../utils/toast";
import { useClassDetail } from "../hooks/useClassDetail";

// Ant Design 5 & Common Components
import { Row, Col, Alert, Skeleton, Tabs, Space, Tooltip, Avatar, List } from "antd";
import {
  BookOutlined,
  FolderOpenOutlined,
  ReadOutlined,
  FormOutlined,
  FileDoneOutlined,
  NotificationOutlined,
  VideoCameraOutlined,
  BarChartOutlined,
  CheckSquareOutlined,
  MessageOutlined,
  TrophyOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import PageContainer from "../../../shared/components/PageContainer";
import StudentClassHeader from "../components/classDetail/StudentClassHeader";
import StatisticSection from "../components/classDetail/StatisticSection";
import OverviewCard from "../components/classDetail/OverviewCard";
import LiveSessionCard from "../components/classDetail/LiveSessionCard";
import TeacherInformationCard from "../components/classDetail/TeacherInformationCard";
import LearningMaterialsTab from "../components/classDetail/materials/LearningMaterialsTab";
import AssignmentsTab from "../components/classDetail/assignments/AssignmentsTab";
import ExamsTab from "../components/classDetail/exams/ExamsTab";
import GradesTab from "../components/classDetail/grades/GradesTab";
import AttendanceTab from "../components/classDetail/attendance/AttendanceTab";
import AnnouncementsTab from "../components/classDetail/announcements/AnnouncementsTab";
import LiveClassTab from "../components/classDetail/live/LiveClassTab";

import ClassDiscussionTab from "../components/classDetail/chat/ClassDiscussionTab";
import ExamLobbyModals from "../components/classDetail/exams/ExamLobbyModals";
import type { ExamPopupState } from "../components/classDetail/exams/ExamLobbyModals";
import { useJitsiLiveSession } from "../../live-session/hooks/useJitsiLiveSession";
import { useStudentLive } from "../../live-session/hooks/useStudentLive";
import { useLearningAnalytics } from "../../report/hooks/useLearningAnalytics";
import { useAnalytics } from "../../report/hooks/useAnalytics";
import { useBreadcrumb } from "../../../shared/context/BreadcrumbContext";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

const getAvatarColor = (name: string) => {
  const colors = [
    "#f56a00",
    "#7265e6",
    "#ffbf00",
    "#00a2ae",
    "#1890ff",
    "#52c41a",
    "#eb2f96",
    "#fa8c16",
    "#13c2c2",
  ];
  let hash = 0;
  for (let i = 0; i < (name || "").length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [searchQuery] = useState<string>("");

  // Custom hook for class details data
  const { classInfo, lessons, assignments, submittedAssignmentIds, isLoading, errorMsg } =
    useClassDetail(classId);

  const { setBreadcrumbEntity } = useBreadcrumb();

  useEffect(() => {
    if (isLoading) {
      setBreadcrumbEntity(null, true);
    } else if (classInfo) {
      const title = classInfo.classCode
        ? `Lớp ${classInfo.classCode} - ${classInfo.className}`
        : (classInfo.className || "Chi tiết lớp học");
      setBreadcrumbEntity(title, false);
    }
    return () => {
      setBreadcrumbEntity(null, false);
    };
  }, [isLoading, classInfo, setBreadcrumbEntity]);

  // Custom hook for Live Session
  const {
    meetingRoomId,
    activeSession: jitsiActiveSession,
    handleJoinLiveClass,
  } = useJitsiLiveSession({ classId, isTeacher: false });

  const { currentLiveItem, upcomingSessions, pastSessions, refreshLiveSession } = useStudentLive(
    classId,
    jitsiActiveSession,
    classInfo
  );

  // Sync state when Socket notifies useJitsiLiveSession that session started/ended
  useEffect(() => {
    refreshLiveSession();
  }, [jitsiActiveSession, refreshLiveSession]);

  // Sprint 6: Learning Analytics (Ranking, Badges, Activities)
  const {
    progressData,
    classRanking,
    myRank,
    badges,
    fetchStudentProgress,
    fetchClassRanking,
    fetchMyRank,
    fetchMyBadges,
  } = useLearningAnalytics(classId);

  useEffect(() => {
    if (classId) {
      fetchStudentProgress();
      fetchClassRanking({ limit: 5 }); // Top 5
      fetchMyRank();
      fetchMyBadges();
    }
  }, [classId, fetchStudentProgress, fetchClassRanking, fetchMyRank, fetchMyBadges]);

  // Sprint 7: Real Analytics
  const {
    studentDashboard,
    loading: analyticsLoading,
    error: analyticsError,
    fetchStudentDashboard,
  } = useAnalytics(classId);

  useEffect(() => {
    if (classId) {
      fetchStudentDashboard();
    }
  }, [classId, fetchStudentDashboard]);

  // Exams & Lobby States
  const [exams, setExams] = useState<IExam[]>([]);
  const [examPopupState, setExamPopupState] = useState<ExamPopupState>("NONE");
  const [selectedExam] = useState<IExam | null>(null);
  const [countdown, setCountdown] = useState<number>(0);

  useEffect(() => {
    const fetchClassExams = async () => {
      if (!classId) return;
      try {
        const response = await axiosClient.get<{ data: IExam[] }>(`/api/exams/class/${classId}`);
        setExams(response.data.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đề thi của lớp:", error);
        setExams([]);
      }
    };
    fetchClassExams();
  }, [classId]);

  // Remove old notification message effect since it's handled globally now

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (["COUNTDOWN", "NOT_YET_TIME"].includes(examPopupState) && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          const nextValue = prev - 1;
          if (examPopupState === "COUNTDOWN" && nextValue <= 0) {
            setExamPopupState("READY");
          }
          if (examPopupState === "NOT_YET_TIME" && nextValue <= 300) {
            setExamPopupState("COUNTDOWN");
          }
          return nextValue;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examPopupState, countdown]);

  const formatTime = useCallback((seconds: number): string => {
    if (seconds <= 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }, []);

  const handleStartAttemptDirectly = async (exam: IExam) => {
    const studentId = getCurrentUserId();
    if (!studentId) {
      toast.error("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!", "Lỗi xác thực");
      return;
    }
    setExamPopupState("LOADING");
    try {
      const response = await axiosClient.post<{ data: { _id: string } }>(
        "/api/exam-attempts/start",
        {
          examId: exam._id,
          studentId,
        }
      );
      const attemptId = response.data.data._id;
      navigate(`/exam/${attemptId}`);
    } catch (error: unknown) {
      console.error("Lỗi khi tạo phiên làm bài:", error);
      setExamPopupState("NONE");
      toast.error(getApiErrorMessage(error, "Không thể bắt đầu bài thi."), "Lỗi bài thi");
    }
  };

  const handleStartAttemptFromLobby = () => {
    if (selectedExam) {
      handleStartAttemptDirectly(selectedExam);
    }
  };

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

  const filteredLessons = lessons.filter(
    (l) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const resourceList = Array.isArray((classInfo as any)?.resources)
    ? (classInfo as any).resources
    : [];
  const announcementList = Array.isArray((classInfo as any)?.announcements)
    ? (classInfo as any).announcements
    : [];

  const tabItems = [
    {
      key: "overview",
      label: (
        <Space>
          <BookOutlined />
          <span>Tổng quan</span>
        </Space>
      ),
      children: (
        <div>
          {analyticsError && (
            <Alert
              type="error"
              showIcon
              message="Không tải được số liệu phân tích học tập"
              description={analyticsError}
              style={{ marginBottom: 16, borderRadius: 12 }}
              action={<a onClick={() => void fetchStudentDashboard()}>Thử lại</a>}
            />
          )}
          {analyticsLoading && !studentDashboard ? (
            <Skeleton active paragraph={{ rows: 3 }} style={{ marginBottom: 24 }} />
          ) : (
            <StatisticSection
              attendanceRate={
                studentDashboard?.attendance?.total
                  ? Math.round(
                      (studentDashboard.attendance.present /
                        studentDashboard.attendance.total) *
                        100
                    )
                  : 0
              }
              completedAssignments={studentDashboard?.assignment?.completed || 0}
              totalAssignments={assignments.length}
              completedExams={
                exams.filter((e: any) => e.score !== null && e.score !== undefined).length
              }
              totalExams={exams.length}
              averageScore={studentDashboard?.assignment?.averageScore || 0}
              overallProgress={studentDashboard?.progress?.averageProgress || 0}
            />
          )}
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={15} xl={16}>
              <OverviewCard
                className={classInfo.className}
                description={classInfo.description}
                startDate={(classInfo as any).startDate}
                endDate={(classInfo as any).endDate}
                currentStudents={
                  classInfo.students
                    ? classInfo.students.length
                    : (classInfo as any).currentStudents || 0
                }
                maxStudents={(classInfo as any).maxStudents || 40}
                status={classInfo.status as any}
                learningMode={classInfo.learningMode || "Offline"}
                schedule={(classInfo as any).schedule}
                googleCalendarEventId={(classInfo as any).googleCalendarEventId}
              />
            </Col>
            <Col xs={24} lg={9} xl={8}>
              <LiveSessionCard
                currentLiveItem={currentLiveItem}
                upcomingSessions={upcomingSessions}
                pastSessions={pastSessions}
                classRoom={(classInfo as any).classRoom}
                onJoinLive={() => void handleJoinLiveClass()}
              />
              <TeacherInformationCard teacher={classInfo.teacherId as any} />
            </Col>
          </Row>
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
          resources={resourceList}
          loading={isLoading}
        />
      ),
    },
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
            filteredLessons.map((lesson) => (
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
                      {lesson.description || "Không có mô tả chi tiết cho bài học này."}
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
                        <span className="material-symbols-outlined text-xl">download</span>
                      </a>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
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
          submittedIds={submittedAssignmentIds}
          loading={isLoading}
        />
      ),
    },
    {
      key: "exams",
      label: (
        <Space>
          <FileDoneOutlined />
          <span>Bài kiểm tra ({exams.length})</span>
        </Space>
      ),
      children: <ExamsTab exams={exams as any} loading={isLoading} />,
    },
    {
      key: "announcements",
      label: (
        <Space>
          <NotificationOutlined />
          <span>Thông báo ({announcementList.length})</span>
        </Space>
      ),
      children: (
        <AnnouncementsTab
          rawAnnouncements={announcementList}
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
    },
    {
      key: "chat",
      label: (
        <Space>
          <MessageOutlined />
          <span>Thảo luận</span>
        </Space>
      ),
      children: <ClassDiscussionTab />,
    },
  ];

  return (
    <PageContainer maxWidth="1400px">
      {/* 1. STUDENT CLASS HEADER */}
      <StudentClassHeader
        className={classInfo.className}
        classCode={classInfo.classCode}
        subject={
          (classInfo as any).subject ||
          (classInfo as any).courseId?.courseName ||
          (classInfo as any).courseId?.subject
        }
        semester={(classInfo as any).semester}
        status={classInfo.status as any}
        teacher={classInfo.teacherId as any}
      />

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
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          tabBarStyle={{
            marginBottom: 24,
            fontWeight: 600,
          }}
        />

        {/* 5. FOOTER INSIGHTS & GAMIFICATION */}
        <section className="mt-8 grid grid-cols-12 gap-6 p-6 border-t border-gray-100 items-start">
          <div className="col-span-12 md:col-span-4 bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
            <h4 className="font-semibold mb-4 flex items-center text-sm sm:text-base">
              <TrophyOutlined className="mr-2 text-yellow-500" />
              Bảng xếp hạng lớp học
            </h4>
            <div className="space-y-4">
              {classRanking && classRanking.items.length > 0 ? (
                <List
                  itemLayout="horizontal"
                  dataSource={classRanking.items}
                  renderItem={(item) => {
                    const hasXP = (item.totalXP || 0) > 0;
                    const rankDisplay = item.rank ? `#${item.rank}` : "—";
                    return (
                      <List.Item>
                        <List.Item.Meta
                          avatar={
                            <Avatar
                              src={item.avatar}
                              style={{
                                backgroundColor: getAvatarColor(item.fullName || "Student"),
                                fontWeight: 600,
                              }}
                            >
                              {(item.fullName || "U")[0]?.toUpperCase()}
                            </Avatar>
                          }
                          title={
                            <span className="font-semibold">
                              {rankDisplay !== "—" ? `${rankDisplay}. ` : ""}{item.fullName}
                            </span>
                          }
                          description={
                            <span className="text-xs text-gray-500">
                              {hasXP ? `${item.totalXP} XP` : "Chưa tích lũy XP"}
                            </span>
                          }
                        />
                        {item.rank === 1 && hasXP && <StarOutlined className="text-yellow-500 text-lg" />}
                      </List.Item>
                    );
                  }}
                />
              ) : (
                <div className="text-center py-6 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">
                    leaderboard
                  </span>
                  <p className="text-sm font-medium">Chưa có dữ liệu xếp hạng.</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 md:col-span-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-start">
            <div className="space-y-4 w-full">
              <h4 className="font-bold text-blue-800 text-sm sm:text-base flex items-center">
                <ThunderboltOutlined className="mr-2" />
                Thành tích của tôi
              </h4>
              <Row gutter={16}>
                <Col span={8}>
                  <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                    <p className="text-xs text-gray-500 mb-1">Thứ hạng</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {myRank?.rank ? `#${myRank.rank}` : "—"}
                    </p>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                    <p className="text-xs text-gray-500 mb-1">Điểm XP</p>
                    <p className="text-2xl font-bold text-green-600">{myRank?.totalXP || 0}</p>
                  </div>
                </Col>
                <Col span={8}>
                  <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                    <p className="text-xs text-gray-500 mb-1">Huy hiệu</p>
                    <p className="text-2xl font-bold text-purple-600">{badges.length}</p>
                  </div>
                </Col>
              </Row>
              {badges.length > 0 && (
                <div className="mt-4 flex gap-2 overflow-x-auto">
                  {badges.map((b) => (
                    <Tooltip title={b.title} key={b._id}>
                      <Avatar src={b.icon} size={40} className="border-2 border-yellow-400" />
                    </Tooltip>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 3. LOBBY MODALS */}
      <ExamLobbyModals
        examPopupState={examPopupState}
        selectedExam={selectedExam}
        countdown={countdown}
        formatTime={formatTime}
        onStartAttemptFromLobby={handleStartAttemptFromLobby}
        onClose={() => setExamPopupState("NONE")}
      />
    </PageContainer>
  );
}
