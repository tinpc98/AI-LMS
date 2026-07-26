import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Tabs,
  Tag,
  Button,
  Space,
  Typography,
  Spin,
  Alert,
  Empty,
} from "antd";
import {
  ArrowLeftOutlined,
  BookOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  FolderOpenOutlined,
  FormOutlined,
  FileDoneOutlined,
  NotificationOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import assignmentApi from "../../api/assignmentApi";
import { classApi } from "../../api/classApi";
import { lessonApi } from "../../api/lessonApi";

import type { IClass } from "../../interface/ClassInterface";
import type { IAssignment } from "../../interface/assignmentInterface";
import type { ILesson } from "../../interface/lessonInterface";

import CreateLessonModal from "../../components/features/CreateLessonModal";
import LiveRoomModal from "../../components/features/LiveRoomModal";
import { useJitsiLiveSession } from "../../hooks/useJitsiLiveSession";

import { TeacherClassOverviewTab } from "../../components/teacher/classroom/TeacherClassOverviewTab";
import { TeacherStudentTableTab } from "../../components/teacher/classroom/TeacherStudentTableTab";
import { TeacherAttendanceTab } from "../../components/teacher/classroom/TeacherAttendanceTab";
import { TeacherMaterialsTab } from "../../components/teacher/classroom/TeacherMaterialsTab";
import { TeacherAssignmentsTab } from "../../components/teacher/classroom/TeacherAssignmentsTab";
import { TeacherExamsTab } from "../../components/teacher/classroom/TeacherExamsTab";
import { TeacherAnnouncementsTab } from "../../components/teacher/classroom/TeacherAnnouncementsTab";
import { toast } from "../../utils/toast";

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

  const [editingLesson, setEditingLesson] = useState<ILesson | null>(null);
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
    } catch (error: any) {
      if (isMounted.current) {
        setErrorMsg(error.response?.data?.message || "Không thể tải dữ liệu lớp học.");
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
    } catch (error: any) {
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
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Xóa bài giảng thất bại.");
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
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
  const resourceList = Array.isArray(classInfo.resources) ? classInfo.resources : [];
  const teacherName = typeof classInfo.teacherId === "object" ? classInfo.teacherId?.fullName : "Giảng viên";

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
              <Title level={5} style={{ margin: 0 }}>📚 Danh sách bài giảng</Title>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {lessons.map((lesson) => (
                <Card
                  key={lesson._id}
                  hoverable
                  style={{ borderRadius: 10, border: "1px solid #f0f0f0" }}
                  actions={[
                    <EditOutlined key="edit" onClick={() => setEditingLesson(lesson)} />,
                    <DeleteOutlined key="delete" onClick={() => handleDeleteLesson(lesson._id)} style={{ color: "#ff4d4f" }} />,
                  ]}
                >
                  <Title level={5} style={{ fontSize: 15, marginBottom: 8 }} ellipsis>
                    {lesson.title}
                  </Title>
                  {lesson.description && (
                    <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 12 }}>
                      {lesson.description}
                    </Paragraph>
                  )}
                  {lesson.videoUrl && (
                    <a href={lesson.videoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                      ▶ Watch Video
                    </a>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có bài giảng nào trong lớp này." />
          )}
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* 1. Header Banner */}
      <Card
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #002140 0%, #003a70 100%)",
          color: "#fff",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(0, 33, 64, 0.25)",
        }}
        styles={{ body: { padding: "24px 32px" } }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Space size={12} align="center">
              <Button
                type="text"
                icon={<ArrowLeftOutlined style={{ color: "#fff", fontSize: 18 }} />}
                onClick={() => navigate("/teacher/classes")}
              />
              <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                {classInfo.className}
              </Title>
              <Tag color="cyan" style={{ fontFamily: "monospace", fontSize: 13 }}>
                {classInfo.joinCode || classInfo.classCode}
              </Tag>
              <Tag color="green">{classInfo.status || "Đang hoạt động"}</Tag>
            </Space>
            <Text style={{ color: "rgba(255,255,255,0.85)", display: "block", marginTop: 8, fontSize: 14 }}>
              Sĩ số: {studentList.length} học sinh | Lịch học: {classInfo.schedule?.days?.join(", ") || "Tự do"}
            </Text>
          </div>

          <Space size={12}>
            <Button
              type="primary"
              danger
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
      <CreateLessonModal
        isOpen={isModalOpen || !!editingLesson}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLesson(null);
        }}
        classId={classId!}
        lessonData={editingLesson}
        onCreated={handleLessonCreated}
        onUpdated={handleLessonUpdated}
      />

      <LiveRoomModal
        isOpen={isLiveRoomOpen}
        onClose={() => setIsLiveRoomOpen(false)}
        meetingRoomId={meetingRoomId}
        jwtToken={jwtToken}
        appId={appId}
      />
    </div>
  );
}
