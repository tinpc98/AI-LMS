import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import type { IExam } from "../../interface/examInterface";
import { toast } from "../../utils/toast";
import { useClassDetail } from "../../hooks/useClassDetail";

// Ant Design 5 & Common Components
import { Row, Col, Alert, Skeleton } from "antd";
import PageContainer from "../../components/common/PageContainer";
import StudentClassHeader from "../../components/student/classDetail/StudentClassHeader";
import StatisticSection from "../../components/student/classDetail/StatisticSection";
import OverviewCard from "../../components/student/classDetail/OverviewCard";
import LiveSessionCard from "../../components/student/classDetail/LiveSessionCard";
import TeacherInformationCard from "../../components/student/classDetail/TeacherInformationCard";
import NextSessionCard from "../../components/student/classDetail/NextSessionCard";
import LearningProgressCard from "../../components/student/classDetail/LearningProgressCard";
import LearningMaterialsTab from "../../components/student/classDetail/materials/LearningMaterialsTab";
import AssignmentsTab from "../../components/student/classDetail/assignments/AssignmentsTab";
import ExamsTab from "../../components/student/classDetail/exams/ExamsTab";
import GradesTab from "../../components/student/classDetail/grades/GradesTab";
import AttendanceTab from "../../components/student/classDetail/attendance/AttendanceTab";
import AnnouncementsTab from "../../components/student/classDetail/announcements/AnnouncementsTab";


import ClassDiscussionTab from "../../components/student/classDetail/chat/ClassDiscussionTab";
import ExamLobbyModals from "../../components/student/classDetail/exams/ExamLobbyModals";
import type { ExamPopupState } from "../../components/student/classDetail/exams/ExamLobbyModals";
import { useJitsiLiveSession } from "../../hooks/useJitsiLiveSession";
import { useStudentLive } from "../../hooks/useStudentLive";
import { useLearningAnalytics } from "../../hooks/useLearningAnalytics";
import { useAnalytics } from "../../hooks/useAnalytics";
import { Tooltip, Avatar, List, Progress } from "antd";
import { TrophyOutlined, StarOutlined, ClockCircleOutlined, ThunderboltOutlined } from "@ant-design/icons";

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [searchQuery] = useState<string>("");

  // Custom hook for class details data
  const {
    classInfo,
    lessons,
    assignments,
    submittedAssignmentIds,
    isLoading,
    errorMsg,
  } = useClassDetail(classId);

  // Custom hook for Live Session
  const {
    meetingRoomId,
    activeSession: jitsiActiveSession,
    handleJoinLiveClass,
  } = useJitsiLiveSession({ classId, isTeacher: false });

  const {
    currentLiveItem,
    upcomingSessions,
    pastSessions,
    refreshLiveSession,
  } = useStudentLive(classId, jitsiActiveSession, classInfo);

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
    fetchMyBadges
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
  const { studentDashboard, fetchStudentDashboard } = useAnalytics(classId);

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
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  }, []);

  const getStudentId = useCallback((): string | null => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decodedToken = JSON.parse(jsonPayload);
      return decodedToken._id || decodedToken.id || decodedToken.userId;
    } catch {
      return null;
    }
  }, []);

  const handleStartAttemptDirectly = async (exam: IExam) => {
    const studentId = getStudentId();
    if (!studentId) {
      toast.error("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!", "Lỗi xác thực");
      return;
    }
    setExamPopupState("LOADING");
    try {
      const response = await axiosClient.post<{ data: { _id: string } }>("/api/exam-attempts/start", {
        examId: exam._id,
        studentId,
      });
      const attemptId = response.data.data._id;
      navigate(`/exam/${attemptId}`);
    } catch (error: any) {
      console.error("Lỗi khi tạo phiên làm bài:", error);
      setExamPopupState("NONE");
      toast.error(error.response?.data?.message || "Không thể bắt đầu bài thi.", "Lỗi bài thi");
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
              <span style={{ color: "#1890ff", fontWeight: 700 }}>Quay lại danh sách lớp học</span>
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

  return (
    <PageContainer maxWidth="1400px">
      {/* 1. STUDENT CLASS HEADER */}
      <StudentClassHeader
        className={classInfo.className}
        classCode={classInfo.classCode}
        subject={(classInfo as any).subject || (classInfo as any).courseId?.subject || (classInfo as any).courseId?.courseName}
        status={classInfo.status as any}
        teacher={classInfo.teacherId as any}
      />

      {/* 2. TABS SYSTEM */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", borderBottom: "1px solid #f0f0f0", padding: "0 24px", overflowX: "auto" }}>
          {[
            { key: "overview", label: "Tổng quan" },
            { key: "live", label: "Học trực tuyến" },
            { key: "materials", label: "Tài liệu học tập" },
            { key: "lessons", label: "Bài giảng" },
            { key: "announcements", label: "Thông báo" },
            { key: "assignments", label: "Bài tập của tôi" },
            { key: "exams", label: "Thi trực tuyến" },
            { key: "grades", label: "Bảng điểm" },
            { key: "attendance", label: "Điểm danh" },
            { key: "chat", label: "Thảo luận lớp học" },
          ].map((tab) => (
            <button
              key={tab.key}
              style={{
                padding: "16px 20px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                border: "none",
                background: "transparent",
                borderBottom: activeTab === tab.key ? "2px solid #1890ff" : "2px solid transparent",
                color: activeTab === tab.key ? "#1890ff" : "#595959",
                transition: "all 0.2s",
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 24 }}>
          {/* TAB 0: TỔNG QUAN */}
          {activeTab === "overview" && (
            <div>
              <StatisticSection
                attendanceRate={
                  studentDashboard?.attendance?.total
                    ? Math.round((studentDashboard.attendance.present / studentDashboard.attendance.total) * 100)
                    : 0
                }
                completedAssignments={studentDashboard?.assignment?.completed || 0}
                totalAssignments={assignments.length}
                completedExams={exams.filter((e: any) => e.score !== null && e.score !== undefined).length}
                totalExams={exams.length}
                overallProgress={studentDashboard?.progress?.averageProgress || 0}
              />
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={15} xl={16}>
                  <OverviewCard
                    className={classInfo.className}
                    description={classInfo.description}
                    startDate={(classInfo as any).startDate}
                    endDate={(classInfo as any).endDate}
                    currentStudents={classInfo.students ? classInfo.students.length : (classInfo as any).currentStudents || 0}
                    maxStudents={(classInfo as any).maxStudents || 40}
                    status={classInfo.status as any}
                    learningMode={classInfo.learningMode || "Offline"}
                    googleCalendarEventId={(classInfo as any).googleCalendarEventId}
                  />
                  <LearningProgressCard
                    progressPercent={studentDashboard?.progress?.averageProgress || 0}
                    completedAssignments={studentDashboard?.assignment?.completed || 0}
                    totalAssignments={assignments.length}
                    completedExams={exams.filter((e: any) => e.score !== null && e.score !== undefined).length}
                    totalExams={exams.length}
                    averageScore={studentDashboard?.assignment?.averageScore || 0}
                  />
                </Col>
                <Col xs={24} lg={9} xl={8}>
                  <LiveSessionCard
                    currentLiveItem={currentLiveItem}
                    upcomingSessions={upcomingSessions}
                    pastSessions={pastSessions}
                    onJoinLive={() => void handleJoinLiveClass()}
                  />
                  <TeacherInformationCard teacher={classInfo.teacherId as any} />
                  <NextSessionCard
                    schedule={(classInfo as any).schedule}
                    classRoom={(classInfo as any).classRoom}
                    isLiveNow={Boolean(meetingRoomId)}
                    onJoinLive={() => void handleJoinLiveClass()}
                  />
                </Col>
              </Row>
            </div>
          )}

          {/* TAB 1: TÀI LIỆU HỌC TẬP */}
          {activeTab === "materials" && (
            <LearningMaterialsTab resources={(classInfo as any)?.resources || []} loading={isLoading} />
          )}

          {/* TAB 2: BÀI GIẢNG */}
          {activeTab === "lessons" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-on-surface">Danh sách bài học</h3>
                <span className="px-3 py-1 bg-surface-container-high rounded text-xs text-secondary font-medium">
                  {filteredLessons.length} bài học
                </span>
              </div>
              {filteredLessons.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 text-center text-secondary">
                  <span className="material-symbols-outlined text-4xl mb-2 text-outline">description</span>
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
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {lesson.videoUrl ? "play_circle" : "picture_as_pdf"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-on-surface text-sm sm:text-base truncate">{lesson.title}</h4>
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
          )}

          {/* TAB 3: BÀI TẬP CỦA TÔI */}
          {activeTab === "assignments" && (
            <AssignmentsTab assignments={assignments} submittedIds={submittedAssignmentIds} loading={isLoading} />
          )}

          {/* TAB 4: THI TRỰC TUYẾN */}
          {activeTab === "exams" && <ExamsTab exams={exams as any} loading={isLoading} />}

          {/* TAB 5: BẢNG ĐIỂM */}
          {activeTab === "grades" && (
            <GradesTab classId={classId} />
          )}

          {/* TAB 6: ĐIỂM DANH */}
          {activeTab === "attendance" && <AttendanceTab classId={classId} />}

          {/* TAB 7: THÔNG BÁO LỚP HỌC */}
          {activeTab === "announcements" && (
            <AnnouncementsTab rawAnnouncements={(classInfo as any)?.announcements || []} loading={isLoading} />
          )}

          {/* TAB 8: HỌC TRỰC TUYẾN */}
          {activeTab === "live" && (
            <Alert type="info" message="Live session is active." />
          )}

          {/* TAB 9: THẢO LUẬN LỚP HỌC */}
          {activeTab === "chat" && <ClassDiscussionTab />}
        </div>

        {/* 5. FOOTER INSIGHTS & GAMIFICATION */}
        <section className="mt-8 grid grid-cols-12 gap-6 p-6 border-t border-gray-100">
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
                  renderItem={(item, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={item.avatar}>{item.fullName[0]}</Avatar>}
                        title={<span className="font-semibold">{index + 1}. {item.fullName}</span>}
                        description={<span className="text-xs text-gray-500">{item.totalXP} XP</span>}
                      />
                      {index === 0 && <StarOutlined className="text-yellow-500" />}
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-center py-6 text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">leaderboard</span>
                  <p className="text-sm font-medium">Chưa có dữ liệu xếp hạng.</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 md:col-span-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-center">
            <div className="space-y-4 w-full">
              <h4 className="font-bold text-blue-800 text-sm sm:text-base flex items-center">
                <ThunderboltOutlined className="mr-2" />
                Thành tích của tôi
              </h4>
              <Row gutter={16}>
                <Col span={8}>
                  <div className="bg-white p-4 rounded-lg shadow-sm text-center">
                    <p className="text-xs text-gray-500 mb-1">Thứ hạng</p>
                    <p className="text-2xl font-bold text-blue-600">#{myRank?.rank || "-"}</p>
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
                  {badges.map(b => (
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
