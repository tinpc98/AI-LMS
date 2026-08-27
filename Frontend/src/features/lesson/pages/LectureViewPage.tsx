import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Tag,
  Typography,
  Space,
  Card,
  Progress,
  Tooltip,
  Empty,
  Skeleton,
  Drawer,
} from "antd";
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled,
  PlayCircleFilled,
  PlayCircleOutlined,
  MenuOutlined,
} from "@ant-design/icons";

import { lessonApi } from "../../../api/lessonApi";
import { lessonProgressApi } from "../../../api/lessonProgressApi";
import { ContentRenderer } from "../../../components/Content/ContentRenderer";
import { LessonVideoBlockView } from "../components/LessonVideoBlockView";
import { LessonDocumentBlockView } from "../components/LessonDocumentBlockView";
import { LessonPracticeQuizBlockView } from "../components/LessonPracticeQuizBlockView";
import { sortLessons, cleanLessonTitle } from "../utils/lessonHelper";
import type { Lesson, LessonProgress } from "../lesson.types";

const { Title, Text, Paragraph } = Typography;

export const LectureViewPage: React.FC = () => {
  const { classId = "", lectureId = "" } = useParams<{ classId?: string; lectureId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const baseClassPath = `/student/classdetail/${classId}`;
  const getLecturePath = (targetLessonId: string) =>
    `/student/classdetail/${classId}/lecture/${targetLessonId}`;

  const [drawerVisible, setDrawerVisible] = useState(false);

  // 1. Danh sách bài giảng của Class (điều hướng sidebar)
  const {
    data: lessonsData = [],
    isLoading: isLoadingLessons,
    isError: isLessonsError,
  } = useQuery({
    queryKey: ["lessons", classId],
    queryFn: async () => {
      const res = await lessonApi.getLessonsByClass(classId);
      return (res.data?.lessons || []) as Lesson[];
    },
    enabled: !!classId,
  });

  const sortedLessons = useMemo(() => sortLessons(lessonsData), [lessonsData]);
  const lessonIds = useMemo(() => sortedLessons.map((l) => l._id), [sortedLessons]);

  const currentIndex = useMemo(() => {
    if (!lectureId) return -1;
    return sortedLessons.findIndex((l) => String(l._id) === String(lectureId));
  }, [sortedLessons, lectureId]);

  const activeLessonId = currentIndex >= 0 ? lectureId : sortedLessons[0]?._id;

  // 2. Chi tiết đầy đủ (blocks + quiz đã populate) của bài giảng đang xem
  const {
    data: currentLesson,
    isLoading: isLoadingLesson,
    isError: isLessonError,
  } = useQuery({
    queryKey: ["lesson", activeLessonId],
    queryFn: async () => {
      const res = await lessonApi.getLessonById(activeLessonId as string);
      return res.data.lesson as Lesson;
    },
    enabled: !!activeLessonId,
  });

  // 3. Tiến độ cho toàn bộ danh sách bài giảng (sidebar + bài đang xem)
  const { data: progressList = [] } = useQuery({
    queryKey: ["lessonProgress", classId, lessonIds],
    queryFn: async () => {
      const res = await lessonProgressApi.getProgressForLessons(lessonIds);
      return res.data.progresses;
    },
    enabled: lessonIds.length > 0,
  });

  const [localProgressOverride, setLocalProgressOverride] = useState<
    Record<string, LessonProgress>
  >({});

  const progressMap = useMemo(() => {
    const map = new Map<string, LessonProgress>();
    progressList.forEach((p) => map.set(String(p.lessonId), p));
    Object.entries(localProgressOverride).forEach(([lessonId, p]) => map.set(lessonId, p));
    return map;
  }, [progressList, localProgressOverride]);

  const currentProgress = currentLesson ? progressMap.get(String(currentLesson._id)) : undefined;
  const isCurrentCompleted = Boolean(currentProgress?.completed);

  const handleProgressUpdated = (progress: LessonProgress) => {
    setLocalProgressOverride((prev) => ({ ...prev, [progress.lessonId]: progress }));
    queryClient.invalidateQueries({ queryKey: ["lessonProgress", classId, lessonIds] });
  };

  const completedCount = useMemo(
    () => sortedLessons.filter((l) => progressMap.get(String(l._id))?.completed).length,
    [sortedLessons, progressMap]
  );
  const progressPercentage =
    sortedLessons.length === 0 ? 0 : Math.round((completedCount / sortedLessons.length) * 100);

  const prevLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < sortedLessons.length - 1
      ? sortedLessons[currentIndex + 1]
      : null;

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
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(baseClassPath)}
          >
            Quay lại lớp học
          </Button>
        </Empty>
      </div>
    );
  }

  const sortedBlocks = currentLesson
    ? [...currentLesson.blocks].sort((a, b) => a.order - b.order)
    : [];

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
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
          {isCurrentCompleted && (
            <Tag
              icon={<CheckCircleFilled />}
              color="success"
              style={{ padding: "4px 10px", fontSize: 13, borderRadius: 6 }}
            >
              Đã hoàn thành
            </Tag>
          )}
          <Button.Group>
            <Tooltip
              title={
                prevLesson
                  ? `Bài trước: ${cleanLessonTitle(prevLesson.title)}`
                  : "Đã là bài đầu tiên"
              }
            >
              <Button
                icon={<LeftOutlined />}
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson._id)}
              />
            </Tooltip>
            <Tooltip
              title={
                nextLesson
                  ? `Bài tiếp: ${cleanLessonTitle(nextLesson.title)}`
                  : "Đã là bài cuối cùng"
              }
            >
              <Button
                icon={<RightOutlined />}
                disabled={!nextLesson}
                onClick={() => nextLesson && handleSelectLesson(nextLesson._id)}
              />
            </Tooltip>
          </Button.Group>
        </Space>
      </div>

      <div
        className="w-full max-w-[1440px] mx-auto p-6 md:p-8"
        style={{ display: "flex", flexDirection: "column", gap: 24 }}
      >
        {isLoadingLesson || !currentLesson ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : isLessonError ? (
          <Empty description="Không thể tải nội dung bài giảng." />
        ) : (
          <>
            <Card
              style={{ borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "none" }}
            >
              <Text
                type="secondary"
                style={{
                  fontSize: 14,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  fontWeight: 600,
                }}
              >
                BÀI {currentIndex + 1}
              </Text>
              <Title level={2} style={{ margin: "4px 0 0", color: "#1e293b" }}>
                {cleanLessonTitle(currentLesson.title)}
              </Title>
              {currentLesson.description && (
                <Paragraph style={{ color: "#64748b", marginTop: 8, fontSize: 15 }}>
                  {currentLesson.description}
                </Paragraph>
              )}
              {currentProgress && (
                <Progress
                  percent={currentProgress.progress}
                  size="small"
                  style={{ maxWidth: 320, marginTop: 8 }}
                />
              )}
            </Card>

            {currentLesson.content.length > 0 && (
              <Card title="Lý thuyết" style={{ borderRadius: 16 }}>
                <ContentRenderer blocks={currentLesson.content} />
              </Card>
            )}

            {sortedBlocks.map((block) => {
              const bp = currentProgress?.blocks.find(
                (b) => String(b.blockId) === String(block._id)
              );
              return (
                <div key={block._id}>
                  {block.type === "VIDEO" && (
                    <LessonVideoBlockView
                      lessonId={currentLesson._id}
                      block={block}
                      isCompleted={Boolean(bp?.completed)}
                      onProgressUpdated={handleProgressUpdated}
                    />
                  )}
                  {block.type === "DOCUMENT" && (
                    <LessonDocumentBlockView
                      lessonId={currentLesson._id}
                      block={block}
                      isCompleted={Boolean(bp?.completed)}
                      onProgressUpdated={handleProgressUpdated}
                    />
                  )}
                  {block.type === "PRACTICE_QUIZ" && (
                    <LessonPracticeQuizBlockView
                      lessonId={currentLesson._id}
                      block={block}
                      bestScorePercent={bp?.bestScorePercent ?? null}
                      isCompleted={Boolean(bp?.completed)}
                      onProgressUpdated={handleProgressUpdated}
                    />
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <Drawer
        title={
          <div>
            <Text strong style={{ fontSize: 16 }}>
              Danh sách bài giảng
            </Text>
            <div style={{ marginTop: 8 }}>
              <Progress percent={progressPercentage} size="small" strokeColor="#10b981" />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Đã học {completedCount}/{sortedLessons.length}
              </Text>
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
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                {isItemCompleted ? (
                  <CheckCircleFilled style={{ color: "#10b981", fontSize: 18 }} />
                ) : isActive ? (
                  <PlayCircleFilled style={{ color: "#1677ff", fontSize: 18 }} />
                ) : (
                  <PlayCircleOutlined style={{ color: "#94a3b8", fontSize: 18 }} />
                )}
                <Text
                  strong={isActive}
                  style={{ fontSize: 14, color: isActive ? "#1677ff" : "inherit" }}
                >
                  Bài {idx + 1}: {cleanLessonTitle(item.title)}
                </Text>
              </div>
            );
          })}
        </div>
      </Drawer>
    </div>
  );
};

export default LectureViewPage;
