import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import assignmentApi from "../../api/assignmentApi";
import { classApi } from "../../api/classApi";
import { lessonApi } from "../../api/lessonApi";
import axiosClient from "../../api/axiosClient";
import type { ILesson } from "../../interface/lessonInterface";
import type { IAssignment } from "../../interface/assignmentInterface";
import type { IClass } from "../../interface/ClassInterface";
import LiveRoomModal from "../../components/features/LiveRoomModal";
import SubmitAssignmentModal from "../../components/features/SubmitAssignmentModal";
import { useJitsiLiveSession } from "../../hooks/useJitsiLiveSession";
import type { IExam } from "../../interface/examInterface";
import { toast } from "../../utils/toast";

// Ant Design 5 & Common Components
import { Row, Col, Alert, Skeleton } from "antd";
import PageContainer from "../../components/common/PageContainer";
import StudentClassHeader from "../../components/student/classDetail/StudentClassHeader";
import StatisticSection from "../../components/student/classDetail/StatisticSection";
import OverviewCard from "../../components/student/classDetail/OverviewCard";
import TeacherInformationCard from "../../components/student/classDetail/TeacherInformationCard";
import NextSessionCard from "../../components/student/classDetail/NextSessionCard";
import LearningProgressCard from "../../components/student/classDetail/LearningProgressCard";
import LearningMaterialsTab from "../../components/student/classDetail/materials/LearningMaterialsTab";
import AssignmentsTab from "../../components/student/classDetail/assignments/AssignmentsTab";
import ExamsTab from "../../components/student/classDetail/exams/ExamsTab";
import GradesTab from "../../components/student/classDetail/grades/GradesTab";
import AttendanceTab from "../../components/student/classDetail/attendance/AttendanceTab";
import AnnouncementsTab from "../../components/student/classDetail/announcements/AnnouncementsTab";
import LiveClassTab from "../../components/student/classDetail/live/LiveClassTab";


const MOCK_RANKINGS = [
  { rank: 1, name: "Trần Quốc Quân", short: "TQ", score: 9.8, bg: "bg-yellow-100 text-yellow-700 border-yellow-200", isUser: false },
  { rank: 2, name: "Lê Anh", short: "LA", score: 9.5, bg: "bg-slate-100 text-slate-700 border-slate-200", isUser: false },
  { rank: 12, name: "Bạn (Minh Quân)", short: "MQ", score: 8.5, bg: "bg-primary-container text-on-primary-container", isUser: true },
];

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>();
  const [activeTab, setActiveTab] = useState("overview");

  // State Logic dữ liệu thật
  const [classInfo, setClassInfo] = useState<IClass | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState<string[]>([]);
  const [submittingAssignment, setSubmittingAssignment] = useState<IAssignment | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // --- Custom Hook Chức năng Học Online ---
  const {
    isLiveRoomOpen,
    setIsLiveRoomOpen,
    meetingRoomId,
    jwtToken,
    appId,
    isLiveLoading: _isLiveLoading,
    notificationMessage,
    setNotificationMessage,
    handleJoinLiveClass,
  } = useJitsiLiveSession({ classId, isTeacher: false });
  
  // State hỗ trợ tab chat/thảo luận
  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { id: string; sender: string; avatar: string; text: string; time: string; isTeacher?: boolean; isAi?: boolean; isUser?: boolean }[]
  >([
    {
      id: "1",
      sender: "Thanh Thảo",
      avatar: "TT",
      text: "Mọi người ơi, tài liệu chương mới thầy cập nhật nằm ở mục nào vậy ạ?",
      time: "09:12 AM",
    },
    {
      id: "2",
      sender: "AI Assistant",
      avatar: "AI",
      text: "AI khuyên dùng: Bạn có thể xem các slide PDF tải về trực tiếp tại Tab Bài giảng.",
      time: "09:15 AM",
      isAi: true,
    },
  ]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    const newMsg = {
      id: Date.now().toString(),
      sender: "Bạn (Minh Quân)",
      avatar: "MQ",
      text: chatMessage.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isUser: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatMessage("");
  };

  const navigate = useNavigate();
  // ==============================================
  // 1. STATE QUẢN LÝ LOBBY PHÒNG THI
  // ==============================================
  const [exams, setExams] = useState<IExam[]>([]);
  const [examPopupState, setExamPopupState] = useState<
    "NONE" | "NO_EXAM" | "NOT_YET_TIME" | "COUNTDOWN" | "READY" | "LOADING"
  >("NONE");
  const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
  const [countdown, setCountdown] = useState(0);

  // ==============================================
  // 2. LOGIC ĐẾM NGƯỢC THỜI GIAN TRONG LOBBY
  // ==============================================
  useEffect(() => {
    const fetchClassExams = async () => {
      if (!classId) return;

      try {
        const response = await axiosClient.get(`/api/exams/class/${classId}`);
        setExams(response.data.data || response.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đề thi của lớp:", error);
        setExams([]);
      }
    };

    fetchClassExams();
  }, [classId]);


  useEffect(() => {
    if (notificationMessage) {
      toast.info(notificationMessage, "Buổi học trực tuyến");
      setNotificationMessage(null);
    }
  }, [notificationMessage, setNotificationMessage]);
  // ==============================================
  // 3. HÀM XỬ LÝ KHI BẤM "VÀO THI" Ở TAB 3
  // ==============================================
  useEffect(() => {
    let timer: any;
    if (["COUNTDOWN", "NOT_YET_TIME"].includes(examPopupState) && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          const nextValue = prev - 1;

          // Nếu đang ở phòng chờ (COUNTDOWN) và đếm ngược hết -> Chuyển sang READY để học sinh bấm bắt đầu
          if (examPopupState === "COUNTDOWN" && nextValue <= 0) {
            setExamPopupState("READY");
          }

          // Học sinh đang treo popup "NOT_YET_TIME", nếu đếm ngược tự động chạm mốc 5 phút (300 giây)
          // Hệ thống tự đẩy học sinh vào phòng chờ đếm ngược thực tế cực kỳ mượt mà
          if (examPopupState === "NOT_YET_TIME" && nextValue <= 300) {
            setExamPopupState("COUNTDOWN");
          }

          return nextValue;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [examPopupState, countdown]);

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");

    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  // ==============================================
  // HÀM TIỆN ÍCH LẤY ID HỌC SINH TỪ LOCALSTORAGE
  // ==============================================
  const getStudentId = () => {
    const token = localStorage.getItem("accessToken");

    if (!token) return null;

    try {
      // Giải mã payload (phần thứ 2 của chuỗi JWT sau dấu chấm)
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join(""),
      );

      const decodedToken = JSON.parse(jsonPayload);
      console.log("=== ĐÃ GIẢI MÃ TOKEN ===", decodedToken);

      // Lấy ID học sinh (tùy Backend của bạn lưu là _id hay id)
      return decodedToken._id || decodedToken.id || decodedToken.userId;
    } catch (error) {
      console.error("Lỗi giải mã token:", error);
      return null;
    }
  };

  // ==============================================
  // 5. GỌI API BẮT ĐẦU VÀ CHUYỂN TRANG (BYPASS HOẶC READY)
  // ==============================================
  const handleStartAttemptDirectly = async (exam: any) => {
    console.log("=== THÔNG TIN KỲ THI GỬI ĐI ===", exam);
    console.log("=== ID KỲ THI ===", exam._id);

    const studentId = getStudentId(); // Lấy ID học sinh

    if (!studentId) {
      toast.error("Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại!", "Lỗi xác thực");
      return;
    }

    setExamPopupState("LOADING");

    try {
      const response = await axiosClient.post("/api/exam-attempts/start", {
        examId: exam._id,
        studentId: studentId, // 👉 ĐÃ THÊM STUDENT ID VÀO ĐÂY
      });

      const attemptId = response.data.data._id;
      navigate(`/exam/${attemptId}`);
    } catch (error: any) {
      console.error("Lỗi khi tạo phiên làm bài:", error);
      setExamPopupState("NONE");

      const errorMsg = error.response?.data?.message || "Không thể bắt đầu bài thi.";
      console.log("🔥 LÝ DO BACKEND CHẶN:", errorMsg);
      toast.error(errorMsg, "Không thể bắt đầu bài thi");
    }
  };

  const handleStartAttemptFromLobby = () => {
    if (selectedExam) {
      handleStartAttemptDirectly(selectedExam);
    }
  };

  const _handleCancelSubmission = async (assignmentId: string) => {
    try {
      await assignmentApi.cancelSubmission(assignmentId);
      setSubmittedAssignmentIds((prev) => prev.filter((id) => id !== assignmentId));
      toast.success("Hủy nộp bài tập thành công!", "Hủy nộp bài");
    } catch (error: any) {
      console.error("Lỗi khi hủy nộp bài:", error);
      const msg = error.response?.data?.message || "Không thể hủy nộp bài. Vui lòng thử lại.";
      toast.error(msg, "Hủy nộp bài thất bại");
    }
  };

  const _openSubmitModal = (item: IAssignment) => {
    setSubmittingAssignment(item);
    setIsSubmitModalOpen(true);
  };

  const handleSubmitSuccess = (assignmentId: string) => {
    setSubmittedAssignmentIds((prev) => [...new Set([...prev, assignmentId])]);
    toast.success("Nộp bài tập thành công!", "Nộp bài tập");
  };

  // ==============================================
  // FETCH DỮ LIỆU LỚP HỌC
  // ==============================================
  useEffect(() => {
    const fetchData = async () => {
      if (!classId) return;
      try {
        setIsLoading(true);
        setErrorMsg("");

        const [classRes, lessonRes, assignmentRes] = await Promise.all([
          classApi.getClassById(classId),
          lessonApi.getLessonsByClass(classId),
          assignmentApi.getAssignmentsByClass(classId),
        ]);

        setClassInfo(classRes.data.data);

        const publishedLessons = (lessonRes.data.lessons as ILesson[])
          .filter((l) => l.isPublished)
          .sort((a, b) => a.order - b.order);

        setLessons(publishedLessons);
        setAssignments(assignmentRes);

        // Tự động kiểm tra bài tập đã nộp của học sinh
        const studentId = getStudentId();
        if (studentId && assignmentRes.length > 0) {
          const submittedIds: string[] = [];
          await Promise.all(
            assignmentRes.map(async (item) => {
              try {
                const subs = await assignmentApi.getSubmissionsByAssignment(item._id);
                const hasSubmitted = subs.some(
                  (s: any) =>
                    s.studentId === studentId ||
                    s.studentId?._id === studentId ||
                    s.student === studentId ||
                    s.student?._id === studentId
                );
                if (hasSubmitted) {
                  submittedIds.push(item._id);
                }
              } catch (err) {
                console.error("Lỗi khi kiểm tra bài nộp:", err);
              }
            })
          );
          setSubmittedAssignmentIds(submittedIds);
        }
      } catch (err: any) {
        console.error("Lỗi tải thông tin lớp học:", err);
        setErrorMsg(err.response?.data?.message || "Không thể tải thông tin lớp học.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [classId]);

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
            <Link to="/myclasses">
              <span style={{ color: "#1890ff", fontWeight: 700 }}>Quay lại danh sách lớp học</span>
            </Link>
          }
        />
      </PageContainer>
    );
  }

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

      {/* 2. TABS MANAGEMENT SYSTEM */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          overflow: "hidden",
        }}
      >
        {/* Navigation Tabs Header */}
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

        {/* Tab Content Box */}
        <div style={{ padding: 24 }}>
          {/* TAB 0: TỔNG QUAN (OVERVIEW - SPRINT 3.1) */}
          {activeTab === "overview" && (
            <div>
              {/* 1. Statistic Section */}
              <StatisticSection
                attendanceRate={95}
                completedAssignments={submittedAssignmentIds.length}
                totalAssignments={assignments.length}
                completedExams={exams.filter((e) => (e as any).score !== null && (e as any).score !== undefined).length}
                totalExams={exams.length}
                overallProgress={85}
              />

              {/* 2. Main Grid: Overview & Teacher Info */}
              <Row gutter={[24, 24]}>
                {/* Left Column (Overview & Learning Progress) */}
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
                    googleMeetLink={(classInfo as any).googleMeetLink}
                    googleCalendarEventId={(classInfo as any).googleCalendarEventId}
                  />

                  <LearningProgressCard
                    progressPercent={85}
                    completedAssignments={submittedAssignmentIds.length}
                    totalAssignments={assignments.length}
                    completedExams={exams.filter((e) => (e as any).score !== null && (e as any).score !== undefined).length}
                    totalExams={exams.length}
                    averageScore={8.5}
                  />
                </Col>

                {/* Right Column (Teacher Profile & Next Session) */}
                <Col xs={24} lg={9} xl={8}>
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

          {/* TAB 1: TÀI LIỆU HỌC TẬP (LEARNING MATERIALS - SPRINT 3.2) */}
          {activeTab === "materials" && (
            <LearningMaterialsTab
              resources={(classInfo as any)?.resources || []}
              loading={isLoading}
            />
          )}

          {/* TAB 2: BÀI GIẢNG — SỬ DỤNG DỮ LIỆU THẬT */}
          {activeTab === "lessons" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-on-surface">Danh sách bài học</h3>
                  <span className="px-3 py-1 bg-surface-container-high rounded text-xs text-secondary font-medium">
                    {
                      lessons.filter(
                        (l) =>
                          l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      ).length
                    }{" "}
                    bài học
                  </span>
                </div>

                {lessons.filter(
                  (l) =>
                    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length === 0 ? (
                  <div className="border-2 border-dashed border-outline-variant rounded-xl p-12 text-center text-secondary">
                    <span className="material-symbols-outlined text-4xl mb-2 text-outline">description</span>
                    <p className="text-sm">
                      {searchQuery
                        ? `Không tìm thấy bài học nào phù hợp với từ khóa "${searchQuery}".`
                        : "Giảng viên chưa đăng tải giáo trình nào cho lớp này."}
                    </p>
                  </div>
                ) : (
                  lessons
                    .filter(
                      (l) =>
                        l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (l.description && l.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    )
                    .map((lesson) => (
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
            )}

            {/* TAB 3: BÀI TẬP CỦA TÔI (ASSIGNMENTS - SPRINT 3.3) */}
            {activeTab === "assignments" && (
              <AssignmentsTab
                assignments={assignments}
                submittedIds={submittedAssignmentIds}
                loading={isLoading}
              />
            )}
            {/* TAB 4: THI TRỰC TUYẾN (ONLINE EXAMS - SPRINT 3.4) */}
            {activeTab === "exams" && (
              <ExamsTab
                exams={exams as any}
                loading={isLoading}
              />
            )}

            {/* TAB 5: BẢNG ĐIỂM (GRADEBOOK - SPRINT 3.5) */}
            {activeTab === "grades" && (
              <GradesTab
                rawGrades={[]}
                assignments={assignments}
                submittedAssignmentIds={submittedAssignmentIds}
                exams={exams}
                loading={isLoading}
              />
            )}

            {/* TAB 6: ĐIỂM DANH (ATTENDANCE - SPRINT 3.6) */}
            {activeTab === "attendance" && (
              <AttendanceTab
                rawRecords={[]}
                loading={isLoading}
              />
            )}

            {/* TAB 7: THÔNG BÁO LỚP HỌC (ANNOUNCEMENTS - SPRINT 3.7) */}
            {activeTab === "announcements" && (
              <AnnouncementsTab
                rawAnnouncements={(classInfo as any)?.announcements || []}
                loading={isLoading}
              />
            )}

            {/* TAB 8: HỌC TRỰC TUYẾN (LIVE CLASS - SPRINT 3.8) */}
            {activeTab === "live" && (
              <LiveClassTab
                classId={classId}
                rawLiveSession={null}
                classInfo={classInfo}
                loading={isLoading}
                onJoinLiveRoom={() => void handleJoinLiveClass()}
              />
            )}

            {/* TAB 4: THẢO LUẬN LỚP HỌC */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full space-y-4">
                <div className="bg-surface-container-low rounded-xl p-4 flex flex-col space-y-4 min-h-[350px] max-h-[500px] overflow-y-auto">
                  {chatMessages.map((msg) => {
                    if (msg.isAi) {
                      return (
                        <div key={msg.id} className="flex items-center justify-center my-2">
                          <div className="bg-surface-container-highest border border-primary/20 px-4 py-1.5 rounded-full text-xs flex items-center space-x-2 text-primary">
                            <span className="material-symbols-outlined text-sm animate-pulse">auto_awesome</span>
                            <span>{msg.text}</span>
                          </div>
                        </div>
                      );
                    }

                    const isUser = msg.isUser;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start space-x-3 max-w-[85%] ${
                          isUser ? "ml-auto flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                            msg.isTeacher
                              ? "bg-primary text-on-primary"
                              : isUser
                              ? "bg-primary-container text-on-primary-container"
                              : "bg-gray-300 text-gray-700"
                          }`}
                        >
                          {msg.avatar}
                        </div>
                        <div>
                          <div
                            className={`flex items-center space-x-2 mb-1 ${isUser ? "justify-end" : ""}`}
                          >
                            <span
                              className={`text-xs font-bold ${
                                msg.isTeacher ? "text-primary" : "text-on-surface"
                              }`}
                            >
                              {msg.sender}
                            </span>
                            <span className="text-[10px] text-secondary">{msg.time}</span>
                          </div>
                          <div
                            className={`p-3 rounded-2xl text-xs sm:text-sm ${
                              isUser
                                ? "bg-primary text-on-primary rounded-tr-none shadow-sm"
                                : msg.isTeacher
                                ? "bg-primary-container/10 border border-primary/10 rounded-tl-none"
                                : "bg-white rounded-tl-none shadow-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Khung chat input */}
                <div className="flex items-center space-x-2">
                  <input
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container border-none focus:ring-2 focus:ring-primary text-sm text-on-surface"
                    placeholder="Nhập nội dung thảo luận cùng lớp học..."
                    type="text"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-transform active:scale-95 flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-xl">send</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        {/* 5. FOOTER STATS & INSIGHT DETAILS */}
        <section className="mt-8 grid grid-cols-12 gap-6">
          {/* Widget Bảng xếp hạng */}
          <div className="col-span-12 md:col-span-4 bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
            <h4 className="font-semibold mb-4 flex items-center text-sm sm:text-base">
              <span className="material-symbols-outlined mr-2 text-primary">analytics</span>
              Xếp hạng lớp học
            </h4>
            <div className="space-y-3">
              {MOCK_RANKINGS.map((user, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2 rounded-lg ${user.isUser ? "bg-primary-container/10 border border-primary/20" : ""}`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <span
                      className={`text-xs font-bold w-4 text-center ${user.isUser ? "text-primary" : "text-secondary"}`}
                    >
                      {user.rank}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs border ${user.bg}`}
                    >
                      {user.short}
                    </div>
                    <span className={`text-xs sm:text-sm truncate ${user.isUser ? "font-bold" : "font-medium"}`}>
                      {user.name}
                    </span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-primary ml-2">{user.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Widget Phân tích Lộ trình AI */}
          <div className="col-span-12 md:col-span-8 bg-surface-container-low p-6 rounded-xl border border-outline-variant border-dashed flex items-center justify-center text-center">
            <div className="space-y-3 max-w-xl">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-inner mx-auto">
                <span className="material-symbols-outlined text-2xl">auto_awesome</span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm sm:text-base">AI Learning Insights</h4>
                <p className="text-xs sm:text-sm text-secondary mt-1 px-4">
                  "Hệ thống nhận thấy lớp học đang triển khai chương trình học mới. Bạn hãy hoàn thành việc xem các
                  video bài giảng thực tế của thầy <b>{classInfo.teacherId?.fullName ?? "Giảng viên"}</b> để nắm chắc
                  kiến thức trước kỳ thi!"
                </p>
              </div>
              <button className="text-primary font-bold text-xs hover:underline block mx-auto">
                Xem chi tiết lộ trình học tập tập trung →
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ==================================================== */}
      {/* CÁC POPUP TRẠNG THÁI LOBBY PHÒNG THI */}
      {/* ==================================================== */}

      {/* 1. POPUP: KHÔNG CÓ KỲ THI */}
      {examPopupState === "NO_EXAM" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center border-2 border-red-500 shadow-2xl">
            <span className="material-symbols-outlined text-5xl text-red-500 mb-2">event_busy</span>
            <h3 className="text-xl font-bold text-red-600 mb-2">Thông báo</h3>
            <p className="text-gray-700 font-medium">Kỳ thi này không tồn tại hoặc đã bị gỡ!</p>
            <p className="text-sm text-gray-400 mt-4">(Tự động đóng sau 3 giây...)</p>
          </div>
        </div>
      )}

      {/* 2. POPUP CHUYÊN NGHIỆP: CHƯA ĐẾN GIỜ THI (> 5 PHÚT) (Yêu cầu 2) */}
      {examPopupState === "NOT_YET_TIME" && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white p-8 rounded-2xl max-w-md w-full text-center border border-outline-variant shadow-2xl">
            <span className="material-symbols-outlined text-5xl text-yellow-500 mb-3">warning</span>
            <h3 className="text-2xl font-bold text-on-surface mb-2">Chưa đến giờ thi!</h3>
            <p className="text-gray-700 font-medium mb-4">
              Bài thi <span className="text-primary font-bold">"{selectedExam?.title}"</span> chưa mở phòng chờ.
            </p>
            <div className="bg-surface-container-high py-4 px-6 rounded-xl mb-6">
              <p className="text-xs text-secondary mb-1">Thời gian đếm ngược thực tế:</p>
              <p className="text-2xl font-mono font-bold text-error">{formatTime(countdown)}</p>
              <p className="text-xs text-gray-500 mt-2">
                Bạn vui lòng quay lại khi thời gian còn dưới 5 phút để vào phòng chờ đếm ngược.
              </p>
            </div>
            <button
              onClick={() => setExamPopupState("NONE")}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-colors"
            >
              Đã hiểu & Quay lại
            </button>
          </div>
        </div>
      )}

      {/* 3. POPUP: PHÒNG CHỜ THI (LOBBY - Dưới 5 phút) (Yêu cầu 2) */}
      {["COUNTDOWN", "READY", "LOADING"].includes(examPopupState) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in p-4">
          <div className="bg-surface w-full max-w-md rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl rounded-full"></div>

            <h2 className="text-2xl font-bold text-on-surface mb-2 relative z-10">Phòng chờ thi</h2>
            <p className="text-primary font-bold text-lg mb-8 relative z-10">{selectedExam?.title}</p>

            {/* Trạng thái đếm ngược phòng chờ thực tế */}
            {examPopupState === "COUNTDOWN" && (
              <div className="mb-8 relative z-10">
                <p className="text-on-surface-variant font-medium mb-4">Hệ thống sẽ mở đề sau:</p>
                <div className="text-5xl font-mono font-bold text-primary bg-primary/10 py-6 rounded-2xl border-2 border-primary/20 shadow-inner">
                  {formatTime(countdown)}
                </div>
              </div>
            )}

            {/* Trạng thái đã sẵn sàng thi */}
            {["READY", "LOADING"].includes(examPopupState) && (
              <div className="mb-8 relative z-10">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-green-600 mb-2">Đã đến giờ thi!</h3>
                <p className="text-gray-600">Hãy chuẩn bị sẵn sàng và bấm nút bên dưới để nhận đề.</p>
              </div>
            )}

            <div className="flex gap-4 relative z-10">
              <button
                disabled={examPopupState === "LOADING"}
                onClick={() => setExamPopupState("NONE")}
                className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Quay lại
              </button>

              <button
                disabled={examPopupState === "COUNTDOWN" || examPopupState === "LOADING"}
                onClick={handleStartAttemptFromLobby}
                className={`flex-1 py-3 font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                  ["READY", "LOADING"].includes(examPopupState)
                    ? "bg-primary text-white hover:bg-primary-container hover:scale-105"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {examPopupState === "LOADING" ? (
                  <span className="animate-spin material-symbols-outlined">autorenew</span>
                ) : (
                  "Bắt đầu ngay"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <LiveRoomModal
        isOpen={isLiveRoomOpen}
        onClose={() => setIsLiveRoomOpen(false)}
        meetingRoomId={meetingRoomId}
        jwtToken={jwtToken}
        appId={appId}
      />
      <SubmitAssignmentModal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setSubmittingAssignment(null);
        }}
        assignment={submittingAssignment}
        onSuccess={handleSubmitSuccess}
      />
    </PageContainer>
  );
}
