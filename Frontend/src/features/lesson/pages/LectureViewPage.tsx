import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Tag,
  Typography,
  Space,
  Card,
  Progress,
  Tooltip,
  Alert,
  Empty,
  Skeleton,
  Drawer,
  Row,
  Col,
} from "antd";
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  PlayCircleFilled,
  PlayCircleOutlined,
  MenuOutlined,
  FilePdfOutlined,
  EditOutlined,
  BulbOutlined,
  WarningOutlined,
} from "@ant-design/icons";

import { lessonApi } from "../../../api/lessonApi";
import learningApi, { type ILessonProgress } from "../../../api/learningApi";
import { toast } from "../../../utils/toast";
import type { ILesson } from "../../../interface/lessonInterface";
import { YouTubeLessonPlayer } from "../components/YouTubeLessonPlayer";
import { sortLessons, formatLessonDisplayTitle, cleanLessonTitle } from "../utils/lessonHelper";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

const { Title, Text, Paragraph } = Typography;

export const LectureViewPage: React.FC = () => {
  const { classId = "", lectureId = "", lessonId = "" } = useParams<{
    classId?: string;
    lectureId?: string;
    lessonId?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const isTeacherPortal = location.pathname.startsWith("/teacher");
  const baseClassPath = isTeacherPortal ? `/teacher/classroom-detail/${classId}` : `/student/classdetail/${classId}`;
  const getLecturePath = (targetLessonId: string) =>
    isTeacherPortal
      ? `/teacher/classroom-detail/${classId}/lecture/${targetLessonId}`
      : `/student/classdetail/${classId}/lecture/${targetLessonId}`;

  const activeLessonId = lectureId || lessonId;

  const [showVideo, setShowVideo] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Reset video state when lesson changes
  useEffect(() => {
    setShowVideo(false);
  }, [activeLessonId]);

  // 1. Fetch danh sách bài giảng
  const {
    data: lessonsData,
    isLoading: isLoadingLessons,
    isError: isLessonsError,
  } = useQuery({
    queryKey: ["lessons", classId],
    queryFn: async () => {
      if (!classId) return [];
      const res = await lessonApi.getLessonsByClass(classId);
      return (res.data?.lessons || []) as ILesson[];
    },
    enabled: !!classId,
  });

  // 2. Fetch tiến độ
  const { data: progressList = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ["lessonProgress", classId],
    queryFn: async () => {
      if (!classId) return [];
      return await learningApi.getStudentProgress(classId);
    },
    enabled: !!classId,
  });

  const sortedLessons = useMemo(() => sortLessons(lessonsData || []), [lessonsData]);

  const progressMap = useMemo(() => {
    const map = new Map<string, ILessonProgress>();
    (progressList || []).forEach((p) => {
      if (p.lessonId) map.set(String(p.lessonId), p);
    });
    return map;
  }, [progressList]);

  const currentIndex = useMemo(() => {
    if (!activeLessonId) return -1;
    return sortedLessons.findIndex((l) => String(l._id) === String(activeLessonId));
  }, [sortedLessons, activeLessonId]);

  const currentLesson = useMemo(() => {
    if (currentIndex >= 0) return sortedLessons[currentIndex];
    return sortedLessons[0] || null;
  }, [sortedLessons, currentIndex]);

  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < sortedLessons.length - 1
      ? sortedLessons[currentIndex + 1]
      : null;

  const currentProgress = currentLesson ? progressMap.get(String(currentLesson._id)) : undefined;
  const isCurrentCompleted = Boolean(currentProgress?.completed);

  const completedCount = useMemo(() => {
    return sortedLessons.filter((l) => progressMap.get(String(l._id))?.completed).length;
  }, [sortedLessons, progressMap]);

  const progressPercentage = useMemo(() => {
    if (sortedLessons.length === 0) return 0;
    return Math.round((completedCount / sortedLessons.length) * 100);
  }, [completedCount, sortedLessons.length]);

  // 3. Mutation: Đánh dấu hoàn thành
  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      if (!currentLesson || !classId) return;
      return await learningApi.updateLessonProgress({
        lessonId: currentLesson._id,
        classId,
        progress: 100,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessonProgress", classId] });
      toast.success("Chúc mừng! Bạn đã hoàn thành bài học này.");
    },
    onError: (err: any) => {
      toast.error(getApiErrorMessage(err, "Không thể cập nhật tiến độ học tập"));
    },
  });

  const handleSelectLesson = (targetLessonId: string) => {
    navigate(getLecturePath(targetLessonId));
    setDrawerVisible(false);
  };

  if (isLoadingLessons) {
    return (
      <div className="w-full max-w-[1440px] mx-auto p-6 md:p-8">
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  if (isLessonsError || sortedLessons.length === 0) {
    return (
      <div className="w-full max-w-[1440px] mx-auto p-6 md:p-8 text-center mt-12">
        <Empty
          description={
            <Text type="secondary">
              {isLessonsError
                ? "Không thể tải danh sách bài giảng. Vui lòng thử lại."
                : "Lớp học này hiện chưa có bài giảng nào được đăng tải."}
            </Text>
          }
        >
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate(baseClassPath)}>
            Quay lại lớp học
          </Button>
        </Empty>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="w-full max-w-[1440px] mx-auto p-6 md:p-8 text-center mt-12">
        <Empty description={<Text type="secondary">Bài giảng yêu cầu không tồn tại trong lớp học này.</Text>}>
          <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate(baseClassPath)}>
            Quay lại danh sách bài giảng
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top Header Bar */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}
      >
        <Space size={16}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(baseClassPath)} type="text">
            Quay lại
          </Button>
          <Button icon={<MenuOutlined />} onClick={() => setDrawerVisible(true)}>
            Danh sách bài học
          </Button>
        </Space>

        <Space size={12}>
          {!isTeacherPortal && (
            isCurrentCompleted ? (
              <Tag icon={<CheckCircleFilled />} color="success" style={{ padding: "4px 10px", fontSize: 13, borderRadius: 6 }}>
                Đã hoàn thành
              </Tag>
            ) : (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={() => markCompletedMutation.mutate()}
                loading={markCompletedMutation.isPending}
                style={{ borderRadius: 6 }}
              >
                Đánh dấu hoàn thành
              </Button>
            )
          )}
          <Button.Group>
            <Tooltip title={prevLesson ? `Bài trước: ${cleanLessonTitle(prevLesson.title)}` : "Đã là bài đầu tiên"}>
              <Button icon={<LeftOutlined />} disabled={!prevLesson} onClick={() => prevLesson && handleSelectLesson(prevLesson._id)} />
            </Tooltip>
            <Tooltip title={nextLesson ? `Bài tiếp: ${cleanLessonTitle(nextLesson.title)}` : "Đã là bài cuối cùng"}>
              <Button icon={<RightOutlined />} disabled={!nextLesson} onClick={() => nextLesson && handleSelectLesson(nextLesson._id)} />
            </Tooltip>
          </Button.Group>
        </Space>
      </div>

      {/* Main Container - Single Column */}
      <div className="w-full max-w-[1440px] mx-auto p-6 md:p-8" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Bước 2: Overview Header */}
        <Card style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: 'none' }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Text type="secondary" style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
                BÀI {currentIndex + 1}
              </Text>
              <Title level={2} style={{ margin: "4px 0 0", color: '#1e293b' }}>
                Chuyên đề: {cleanLessonTitle(currentLesson.title)}
              </Title>
              {currentLesson.description && (
                <Paragraph style={{ color: "#64748b", marginTop: 8, fontSize: 15 }}>
                  {currentLesson.description}
                </Paragraph>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong style={{ color: '#334155' }}>Mức độ nắm vững: 68%</Text>
                <Text type="secondary">dựa trên 45/66 câu đúng qua 3 đề</Text>
              </div>
              <Progress percent={68} strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} status="active" />
            </div>

            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              message={<Text strong>Điểm yếu cần khắc phục: Tích phân từng phần (2/8 câu đúng)</Text>}
              style={{ borderRadius: 8, backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}
            />
          </Space>
        </Card>

        {/* Bước 3: Resource Grid */}
        <Title level={4} style={{ margin: "16px 0 0", color: '#334155' }}>Nguồn tài nguyên học tập</Title>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={() => setShowVideo(true)}
              style={{ 
                borderRadius: 16, 
                textAlign: 'center', 
                border: showVideo ? '2px solid #1677ff' : '2px solid transparent',
                backgroundColor: showVideo ? '#e6f4ff' : '#fff',
                transition: 'all 0.2s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
              styles={{ body: { padding: '32px 24px' } }}
            >
              <PlayCircleOutlined style={{ fontSize: 48, color: '#1677ff', marginBottom: 16 }} />
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Video lý thuyết</Title>
              <Text type="secondary">Xem bài giảng chi tiết từ giáo viên</Text>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={() => {
                const pdf = currentLesson.attachments?.find(a => a.name?.toLowerCase().endsWith('.pdf'));
                if (pdf) window.open(pdf.url, '_blank');
                else toast.info("Bài học này chưa có tài liệu đính kèm.");
              }}
              style={{ borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              styles={{ body: { padding: '32px 24px' } }}
            >
              <FilePdfOutlined style={{ fontSize: 48, color: '#f5222d', marginBottom: 16 }} />
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Tài liệu tóm tắt (PDF)</Title>
              <Text type="secondary">Tải xuống lý thuyết cô đọng</Text>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Card
              hoverable
              onClick={() => navigate(`/student/studentassignment`)} // Mock link
              style={{ borderRadius: 16, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              styles={{ body: { padding: '32px 24px' } }}
            >
              <EditOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
              <Title level={4} style={{ margin: 0, color: '#1e293b' }}>Bài tập tự luyện</Title>
              <Text type="secondary">Thực hành để củng cố kiến thức</Text>
            </Card>
          </Col>

          <Col xs={24} sm={12}>
            <Tooltip title="Chỉ mở khóa sau khi bạn nộp bài tập" color="red">
              <Card
                style={{ 
                  borderRadius: 16, 
                  textAlign: 'center', 
                  backgroundColor: '#f1f5f9', 
                  opacity: 0.7, 
                  cursor: 'not-allowed',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}
                styles={{ body: { padding: '32px 24px' } }}
              >
                <BulbOutlined style={{ fontSize: 48, color: '#94a3b8', marginBottom: 16 }} />
                <Title level={4} style={{ margin: 0, color: '#64748b' }}>Video chữa câu khó</Title>
                <Text type="secondary">Phân tích chi tiết các dạng bài</Text>
              </Card>
            </Tooltip>
          </Col>
        </Row>

        {/* Trình phát Video (Chỉ hiện khi click) */}
        {showVideo && (
          <div style={{ marginTop: 24, animation: 'fadeIn 0.5s ease' }}>
            <YouTubeLessonPlayer
              videoUrl={currentLesson.videoUrl}
              lessonTitle={formatLessonDisplayTitle(currentIndex, currentLesson.title)}
              hasNextLesson={Boolean(nextLesson)}
              onNextLesson={() => nextLesson && handleSelectLesson(nextLesson._id)}
              isCompleted={isCurrentCompleted}
              onMarkCompleted={() => markCompletedMutation.mutate()}
              onVideoEnded={() => {
                if (!isCurrentCompleted) {
                  markCompletedMutation.mutate();
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Drawer: Playlist Bài học */}
      <Drawer
        title={
          <div>
            <Text strong style={{ fontSize: 16 }}>Danh sách bài giảng</Text>
            <div style={{ marginTop: 8 }}>
              <Progress percent={progressPercentage} size="small" strokeColor="#10b981" />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Đã học {completedCount}/{sortedLessons.length}</Text>
              </div>
            </div>
          </div>
        }
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={360}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          {sortedLessons.map((item, idx) => {
            const isActive = currentLesson ? String(item._id) === String(currentLesson._id) : false;
            const isItemCompleted = Boolean(progressMap.get(String(item._id))?.completed);

            return (
              <div
                key={item._id}
                onClick={() => handleSelectLesson(item._id)}
                style={{
                  padding: "16px 20px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f1f5f9",
                  backgroundColor: isActive ? "#e6f4ff" : "transparent",
                  borderLeft: isActive ? "4px solid #1677ff" : "4px solid transparent",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div>
                  {isItemCompleted ? (
                    <CheckCircleFilled style={{ color: "#10b981", fontSize: 18 }} />
                  ) : isActive ? (
                    <PlayCircleFilled style={{ color: "#1677ff", fontSize: 18 }} />
                  ) : (
                    <PlayCircleOutlined style={{ color: "#94a3b8", fontSize: 18 }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong={isActive} style={{ fontSize: 14, display: "block", color: isActive ? "#1677ff" : "inherit" }}>
                    Bài {idx + 1}: {cleanLessonTitle(item.title)}
                  </Text>
                </div>
              </div>
            );
          })}
        </div>
      </Drawer>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LectureViewPage;
