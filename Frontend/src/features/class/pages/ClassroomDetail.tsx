import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, Tabs, Tag, Button, Space, Typography, Spin, Alert, Empty, Tooltip } from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  FolderOpenOutlined,
  FormOutlined,
  FileDoneOutlined,
  NotificationOutlined,
  VideoCameraOutlined,
  TrophyOutlined,
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";

import assignmentApi from "../../../api/assignmentApi";
import { classApi } from "../../../api/classApi";
import { lessonApi } from "../../../api/lessonApi";

import type { IClass } from "../../../interface/ClassInterface";
import type { IAssignment } from "../../../interface/assignmentInterface";
import type { ILesson } from "../../../interface/lessonInterface";

import CreateLessonModal from "../../lesson/components/CreateLessonModal";
import { useJitsiLiveSession } from "../../live-session/hooks/useJitsiLiveSession";
import { AIQuestionGeneratorModal } from "../components/classroom/AIQuestionGeneratorModal";

import { TeacherClassOverviewTab } from "../components/classroom/TeacherClassOverviewTab";
import { TeacherStudentTableTab } from "../components/classroom/TeacherStudentTableTab";
import { TeacherAttendanceTab } from "../components/classroom/TeacherAttendanceTab";
import { TeacherMaterialsTab } from "../components/classroom/TeacherMaterialsTab";
import { TeacherAssignmentsTab } from "../components/classroom/TeacherAssignmentsTab";
import { TeacherExamsTab } from "../components/classroom/TeacherExamsTab";
import { TeacherAnnouncementsTab } from "../components/classroom/TeacherAnnouncementsTab";
import { TeacherLiveSessionTab } from "../components/classroom/TeacherLiveSessionTab";
import { TeacherGradebookTab } from "../components/classroom/TeacherGradebookTab";
import { TeacherAnalyticsTab } from "../components/classroom/TeacherAnalyticsTab";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { useBreadcrumb } from "../../../shared/context/BreadcrumbContext";

const { Title, Text, Paragraph } = Typography;

export default function ClassroomDetail() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const isMounted = useRef(false);

  // States
  const [classInfo, setClassInfo] = useState<IClass | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

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

  const [editingLesson, setEditingLesson] = useState<ILesson | null>(null);
  const [selectedLessonForAI, setSelectedLessonForAI] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Live Session Hook
  const {
    isLiveRoomOpen,
    setIsLiveRoomOpen,
    meetingRoomId,
    jwtToken,
    appId,
    isLiveLoading,
    handleStartLiveSession,
  } = useJitsiLiveSession({ classId, isTeacher: true });

  const loadClassroom = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const [classRes, lessonRes] = await Promise.all([
        classApi.getClassById(classId),
        lessonApi.getLessonsByClass(classId).catch(() => ({ data: { lessons: [] } })),
      ]);

      if (isMounted.current) {
        setClassInfo(classRes.data?.data || classRes.data);
        setLessons(lessonRes.data?.lessons || []);
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        setErrorMsg(getApiErrorMessage(error, "Không thể tải dữ liệu lớp học."));
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [classId]);

  const loadAssignments = useCallback(async () => {
    if (!classId) return;
    try {
      const data = await assignmentApi.getAssignmentsByClass(classId);
      if (isMounted.current) {
        setAssignments(data || []);
      }
    } catch (error: unknown) {
      console.warn("Không thể tải danh sách bài tập:", error);
    }
  }, [classId]);

  useEffect(() => {
    isMounted.current = true;
    void (async () => {
      await Promise.all([loadClassroom(), loadAssignments()]);
    })();

    return () => {
      isMounted.current = false;
    };
  }, [loadClassroom, loadAssignments]);

  const handleLessonCreated = (newLesson: ILesson) => {
    setLessons((prev) => [...prev, newLesson]);
    setIsModalOpen(false);
  };

  const handleLessonUpdated = (updatedLesson: ILesson) => {
    setLessons((prev) => prev.map((l) => (l._id === updatedLesson._id ? updatedLesson : l)));
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài giảng này?")) return;
    try {
      await lessonApi.deleteLesson(id);
      setLessons((prev) => prev.filter((l) => l._id !== id));
      toast.success("Xóa bài giảng thành công.");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Xóa bài giảng thất bại."));
    }
  };

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "80vh",
        }}
      >
        <Spin size="large" tip="Đang nạp dữ liệu chi tiết lớp học..." />
      </div>
    );
  }

  if (errorMsg || !classInfo) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: "40px auto" }}>
        <Alert
          message="Lỗi tải dữ liệu lớp học"
          description={errorMsg || "Không tìm thấy thông tin lớp học!"}
          type="error"
          showIcon
          action={
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/teacher/classes")}>
              Quay lại danh sách lớp
            </Button>
          }
        />
      </div>
    );
  }

  const studentList = Array.isArray(classInfo.students) ? classInfo.students : [];
  const resourceList = Array.isArray((classInfo as any).resources)
    ? (classInfo as any).resources
    : [];
  const teacherName =
    typeof classInfo.teacherId === "object" ? classInfo.teacherId?.fullName : "Giảng viên";

  const tabItems = [
    {
      key: "overview",
      label: (
        <Space>
          <BookOutlined />
          <span>Tổng quan</span>
        </Space>
      ),
      children: <TeacherClassOverviewTab classInfo={classInfo} />,
    },
    {
      key: "students",
      label: (
        <Space>
          <TeamOutlined />
          <span>Học sinh ({studentList.length})</span>
        </Space>
      ),
      children: <TeacherStudentTableTab students={studentList} loading={false} />,
    },
    {
      key: "attendance",
      label: (
        <Space>
          <CheckSquareOutlined />
          <span>Điểm danh</span>
        </Space>
      ),
      children: (
        <TeacherAttendanceTab
          classId={classId!}
          className={classInfo.className}
          students={studentList}
        />
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
        <TeacherMaterialsTab
          classId={classId!}
          className={classInfo.className}
          resources={resourceList}
          teacherName={teacherName}
          onRefresh={loadClassroom}
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
        <TeacherAssignmentsTab
          classId={classId!}
          className={classInfo.className}
          assignments={assignments}
          onRefresh={loadAssignments}
          loading={isLoading}
        />
      ),
    },
    {
      key: "exams",
      label: (
        <Space>
          <FileDoneOutlined />
          <span>Bài kiểm tra</span>
        </Space>
      ),
      children: (
        <TeacherExamsTab
          classId={classId!}
          className={classInfo.className}
          onRefresh={loadClassroom}
          loading={isLoading}
        />
      ),
    },
    {
      key: "announcements",
      label: (
        <Space>
          <NotificationOutlined />
          <span>Thông báo</span>
        </Space>
      ),
      children: (
        <TeacherAnnouncementsTab
          classId={classId!}
          className={classInfo.className}
          onRefresh={loadClassroom}
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
        <TeacherLiveSessionTab
          classId={classId!}
          className={classInfo.className}
          teacherName={teacherName}
        />
      ),
    },
    {
      key: "gradebook",
      label: (
        <Space>
          <TrophyOutlined />
          <span>Bảng điểm</span>
        </Space>
      ),
      children: (
        <TeacherGradebookTab
          classId={classId!}
          className={classInfo.className}
          teacherName={teacherName}
          students={studentList}
          onRefresh={loadClassroom}
          loading={isLoading}
        />
      ),
    },
    {
      key: "analytics",
      label: (
        <Space>
          <TrophyOutlined />
          <span>Thành tích</span>
        </Space>
      ),
      children: <TeacherAnalyticsTab classId={classId!} />,
    },
    {
      key: "lessons",
      label: (
        <Space>
          <FileTextOutlined />
          <span>Bài giảng ({lessons.length})</span>
        </Space>
      ),
      children: (
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level={5} style={{ margin: 0 }}>
                📚 Danh sách bài giảng
              </Title>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingLesson(null);
                  setIsModalOpen(true);
                }}
              >
                Tạo bài giảng
              </Button>
            </div>
          }
          style={{ borderRadius: 12 }}
        >
          {lessons.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 16,
              }}
            >
              {lessons.map((lesson) => (
                <Card
                  key={lesson._id}
                  hoverable
                  style={{ borderRadius: 10, border: "1px solid var(--color-border-default)" }}
                  actions={[
                    <Tooltip key="view" title="Xem bài giảng">
                      <Link to={`/teacher/classroom-detail/${classId}/lecture/${lesson._id}`}>
                        <EyeOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                      </Link>
                    </Tooltip>,
                    <EditOutlined
                      key="edit"
                      title="Sửa"
                      onClick={() => setEditingLesson(lesson)}
                    />,
                    <span
                      key="ai"
                      title="Sinh câu hỏi AI"
                      onClick={() => setSelectedLessonForAI(lesson._id)}
                      className="text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                    </span>,
                    <DeleteOutlined
                      key="delete"
                      title="Xóa"
                      onClick={() => handleDeleteLesson(lesson._id)}
                      style={{ color: "var(--color-error-base)" }}
                    />,
                  ]}
                >
                  <Link
                    to={`/teacher/classroom-detail/${classId}/lecture/${lesson._id}`}
                    className="hover:underline block"
                  >
                    <Title
                      level={5}
                      style={{
                        fontSize: 15,
                        marginBottom: 8,
                        color: "var(--color-action-primary-bg)",
                        cursor: "pointer",
                      }}
                      ellipsis
                    >
                      {lesson.title}
                    </Title>
                  </Link>
                  {lesson.description && (
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{ fontSize: 13, marginBottom: 12 }}
                    >
                      {lesson.description}
                    </Paragraph>
                  )}
                  <Link
                    to={`/teacher/classroom-detail/${classId}/lecture/${lesson._id}`}
                    style={{
                      fontSize: 13,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 6,
                      color: "var(--color-action-primary-bg)",
                      fontWeight: 500,
                    }}
                  >
                    <PlayCircleOutlined /> Xem bài giảng
                  </Link>
                </Card>
              ))}
            </div>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Chưa có bài giảng nào trong lớp này."
            />
          )}
        </Card>
      ),
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 1400,
        margin: "0 auto",
        backgroundColor: "var(--color-bg-page)",
        minHeight: "100vh",
      }}
    >
      {/* 1. Header Banner */}
      <Card
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, var(--color-sidebar-bg) 0%, var(--color-sidebar-hover) 100%)",
          color: "var(--color-surface)",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(0, 33, 64, 0.25)",
        }}
        styles={{ body: { padding: "24px 32px" } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Space size={12} align="center">
              <Button
                type="text"
                icon={<ArrowLeftOutlined style={{ color: "var(--color-surface)", fontSize: 18 }} />}
                onClick={() => navigate("/teacher/classes")}
              />
              <Title level={3} style={{ color: "var(--color-surface)", margin: 0, fontWeight: 700 }}>
                {classInfo.className}
              </Title>
              <Tag color="cyan" style={{ fontFamily: "monospace", fontSize: 13 }}>
                {classInfo.joinCode || classInfo.classCode}
              </Tag>
              <Tag color="green">{classInfo.status || "Đang hoạt động"}</Tag>
            </Space>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                display: "block",
                marginTop: 8,
                fontSize: 14,
              }}
            >
              Sĩ số: {studentList.length} học sinh | Lịch học:{" "}
              {(classInfo as any).schedule?.days?.join(", ") || "Tự do"}
            </Text>
          </div>

          <Space size={12}>
            <Button
              type="primary"
              icon={<VideoCameraOutlined />}
              loading={isLiveLoading}
              onClick={handleStartLiveSession}
              style={{ fontWeight: 600, borderRadius: 8 }}
            >
              Bắt đầu phòng LIVE
            </Button>
          </Space>
        </div>
      </Card>

      {/* 2. Tabs Navigation Content */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key)}
        items={tabItems}
        type="card"
      />

      {/* MODALS */}
      {/* Gắn kết có điều kiện + key: form khởi tạo lại sạch sẽ cho mỗi bài giảng, không cần
          effect đồng bộ. key xử lý trường hợp bấm "Sửa" bài khác trong khi modal đang mở. */}
      {(isModalOpen || !!editingLesson) && (
        <CreateLessonModal
          key={editingLesson?._id ?? "new-lesson"}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLesson(null);
          }}
          classId={classId!}
          lessonData={editingLesson}
          onCreated={handleLessonCreated}
          onUpdated={handleLessonUpdated}
        />
      )}

      <AIQuestionGeneratorModal
        isOpen={!!selectedLessonForAI}
        onClose={() => setSelectedLessonForAI(null)}
        lessonId={selectedLessonForAI || ""}
        onSuccess={() => {
          // Could refresh something if needed, but questions go to QuestionBank globally
          console.log("Questions generated successfully");
        }}
      />
    </div>
  );
}
