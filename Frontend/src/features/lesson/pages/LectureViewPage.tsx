import React, { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Spin,
  Button,
  Tag,
  Typography,
  Space,
  Card,
  Progress,
  Tooltip,
  Divider,
  Empty,
  Skeleton,
} from "antd";
import {
  ArrowLeftOutlined,
  LeftOutlined,
  RightOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  PlayCircleFilled,
  PlayCircleOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
  DownloadOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  SendOutlined,
  SyncOutlined,
} from "@ant-design/icons";

import { lessonApi } from "../../../api/lessonApi";
import learningApi, { type ILessonProgress } from "../../../api/learningApi";
import aiApi from "../../../api/aiApi";
import { useAIChat } from "../../ai/hooks/useAIChat";
import { toast } from "../../../utils/toast";
import { queryKeys } from "../../../shared/api/queryKeys";
import { getApiErrorCode, getApiErrorMessage, getApiErrorStatus } from "../../../shared/utils/apiError";
import type { ILesson } from "../../../interface/lessonInterface";
import { YouTubeLessonPlayer } from "../components/YouTubeLessonPlayer";
import { sortLessons, formatLessonDisplayTitle, cleanLessonTitle } from "../utils/lessonHelper";

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

  // Nhận diện portal (Teacher hay Student)
  const isTeacherPortal = location.pathname.startsWith("/teacher");

  // Đường dẫn động theo vai trò
  const baseClassPath = isTeacherPortal
    ? `/teacher/classroom-detail/${classId}`
    : `/student/classdetail/${classId}`;

  const getLecturePath = (targetLessonId: string) =>
    isTeacherPortal
      ? `/teacher/classroom-detail/${classId}/lecture/${targetLessonId}`
      : `/student/classdetail/${classId}/lecture/${targetLessonId}`;

  // Hỗ trợ cả lectureId lẫn lessonId để tương thích ngược route cũ
  const activeLessonId = lectureId || lessonId;

  // 1. Fetch danh sách bài giảng của lớp
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

  // 2. Fetch tiến độ bài học của học sinh trong lớp
  const { data: progressList = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ["lessonProgress", classId],
    queryFn: async () => {
      if (!classId) return [];
      return await learningApi.getStudentProgress(classId);
    },
    enabled: !!classId,
  });

  // Sắp xếp bài giảng ổn định
  const sortedLessons = useMemo(() => {
    return sortLessons(lessonsData || []);
  }, [lessonsData]);

  // Tạo map tiến độ theo lessonId để tra cứu O(1)
  const progressMap = useMemo(() => {
    const map = new Map<string, ILessonProgress>();
    (progressList || []).forEach((p) => {
      if (p.lessonId) {
        map.set(String(p.lessonId), p);
      }
    });
    return map;
  }, [progressList]);

  // Tìm bài giảng hiện tại
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

  // Số lượng bài đã hoàn thành
  const completedCount = useMemo(() => {
    return sortedLessons.filter((l) => progressMap.get(String(l._id))?.completed).length;
  }, [sortedLessons, progressMap]);

  const progressPercentage = useMemo(() => {
    if (sortedLessons.length === 0) return 0;
    return Math.round((completedCount / sortedLessons.length) * 100);
  }, [completedCount, sortedLessons.length]);

  // 3. Mutation: Đánh dấu bài học đã hoàn thành
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

  // 4. Tích hợp AI Summary
  const summaryQueryKey = queryKeys.lesson.summary(activeLessonId);
  const { data: summary = null, isLoading: isFetchingSummary } = useQuery({
    queryKey: summaryQueryKey,
    queryFn: async () => {
      if (!activeLessonId) return null;
      try {
        const data = await aiApi.getLessonSummary(activeLessonId);
        return data?.content || data?.summary || null;
      } catch (err: unknown) {
        const code = getApiErrorCode(err);
        if (code === "AI_SUMMARY_NOT_FOUND") return null;
        if (!code && getApiErrorStatus(err) === 404) return null;
        throw err;
      }
    },
    enabled: !!activeLessonId,
  });

  const generateSummaryMutation = useMutation({
    mutationFn: () => aiApi.generateLessonSummary(activeLessonId!),
    onSuccess: (data) => {
      queryClient.setQueryData(
        summaryQueryKey,
        data.content || data.summary || "Đã tạo tóm tắt nhưng không có nội dung."
      );
      toast.success("Đã tạo tóm tắt bài học bằng AI!");
    },
    onError: (err: any) => {
      toast.error(getApiErrorMessage(err, "Không thể tạo tóm tắt bài học"));
    },
  });

  const isLoadingSummary = isFetchingSummary || generateSummaryMutation.isPending;

  // 5. Tích hợp AI Chatbot
  const {
    messages,
    isLoading: isChatLoading,
    isTyping,
    error: chatError,
    initSession,
    sendMessage,
  } = useAIChat(activeLessonId);

  const [chatInput, setChatInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeLessonId) {
      initSession();
    }
  }, [activeLessonId, initSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendChat = () => {
    if (chatInput.trim()) {
      sendMessage(chatInput.trim());
      setChatInput("");
    }
  };

  // Điều hướng chuyển bài học mà không reload trang
  const handleSelectLesson = (targetLessonId: string) => {
    navigate(getLecturePath(targetLessonId));
  };

  // Trạng thái Loading
  if (isLoadingLessons) {
    return (
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px" }}>
        <Skeleton active paragraph={{ rows: 12 }} />
      </div>
    );
  }

  // Trạng thái Lỗi hoặc Lớp không có bài giảng
  if (isLessonsError || sortedLessons.length === 0) {
    return (
      <div style={{ maxWidth: 900, margin: "60px auto", textAlign: "center", padding: 24 }}>
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
            style={{ borderRadius: 8 }}
          >
            Quay lại lớp học
          </Button>
        </Empty>
      </div>
    );
  }

  // Trạng thái không tìm thấy bài học cụ thể
  if (!currentLesson) {
    return (
      <div style={{ maxWidth: 900, margin: "60px auto", textAlign: "center", padding: 24 }}>
        <Empty
          description={<Text type="secondary">Bài giảng yêu cầu không tồn tại trong lớp học này.</Text>}
        >
          <Button
            type="primary"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(baseClassPath)}
            style={{ borderRadius: 8 }}
          >
            Quay lại danh sách bài giảng
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "var(--color-bg-layout, #f8fafc)", minHeight: "100vh" }}>
      {/* Top Header Bar */}
      <div
        style={{
          backgroundColor: "#fff",
          borderBottom: "1px solid var(--color-border-default, #e2e8f0)",
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
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(baseClassPath)}
            style={{ borderRadius: 8, fontWeight: 500 }}
          >
            Lớp học
          </Button>
          <div>
            <Text strong style={{ fontSize: 16, display: "block" }}>
              {formatLessonDisplayTitle(currentIndex, currentLesson.title)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bài {currentIndex + 1} / {sortedLessons.length} bài giảng
            </Text>
          </div>
        </Space>

        {/* Nút Điều hướng nhanh & Trạng thái hoàn thành */}
        <Space size={12}>
          {!isTeacherPortal && (
            isCurrentCompleted ? (
              <Tag
                icon={<CheckCircleFilled style={{ color: "var(--color-success-base)" }} />}
                color="success"
                style={{ padding: "4px 10px", fontSize: 13, borderRadius: 6 }}
              >
                Đã học xong
              </Tag>
            ) : (
              <Button
                icon={<CheckCircleOutlined />}
                onClick={() => markCompletedMutation.mutate()}
                loading={markCompletedMutation.isPending}
                style={{ borderRadius: 6 }}
              >
                Đánh dấu đã học
              </Button>
            )
          )}

          <Button.Group>
            <Tooltip title={prevLesson ? `Bài trước: ${cleanLessonTitle(prevLesson.title)}` : "Đã là bài đầu tiên"}>
              <Button
                icon={<LeftOutlined />}
                disabled={!prevLesson}
                onClick={() => prevLesson && handleSelectLesson(prevLesson._id)}
              />
            </Tooltip>
            <Tooltip title={nextLesson ? `Bài tiếp: ${cleanLessonTitle(nextLesson.title)}` : "Đã là bài cuối cùng"}>
              <Button
                icon={<RightOutlined />}
                disabled={!nextLesson}
                onClick={() => nextLesson && handleSelectLesson(nextLesson._id)}
              />
            </Tooltip>
          </Button.Group>
        </Space>
      </div>

      {/* Main Content Layout: 70% Player / Details + 30% Sidebar */}
      <div
        style={{
          maxWidth: 1600,
          margin: "0 auto",
          padding: "24px 20px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 7fr) minmax(320px, 3fr)",
          gap: 24,
        }}
      >
        {/* Left Column: Player, Info, Summary */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 1. YouTube IFrame Player */}
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

          {/* 2. Lesson Header & Details Card */}
          <Card style={{ borderRadius: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <Space size={8} style={{ marginBottom: 8 }}>
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600 }}>
                    Bài {currentIndex + 1}
                  </Tag>
                  {currentLesson.duration && currentLesson.duration > 0 && (
                    <Tag icon={<ClockCircleOutlined />} style={{ borderRadius: 6 }}>
                      {currentLesson.duration} phút
                    </Tag>
                  )}
                </Space>

                <Title level={3} style={{ margin: "0 0 12px", fontSize: 22 }}>
                  {formatLessonDisplayTitle(currentIndex, currentLesson.title)}
                </Title>

                {currentLesson.description && (
                  <Paragraph style={{ color: "var(--color-text-description)", fontSize: 14, lineHeight: 1.6 }}>
                    {currentLesson.description}
                  </Paragraph>
                )}
              </div>

              {/* Action: AI Summary Button */}
              <Button
                icon={<RobotOutlined />}
                type="primary"
                ghost
                onClick={() => generateSummaryMutation.mutate()}
                loading={isLoadingSummary}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Tóm tắt AI
              </Button>
            </div>

            {/* Attachments Section if any */}
            {currentLesson.attachments && currentLesson.attachments.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border-default, #f1f5f9)" }}>
                <Text strong style={{ fontSize: 13, display: "block", marginBottom: 8 }}>
                  Tài liệu đính kèm ({currentLesson.attachments.length}):
                </Text>
                <Space size={10} wrap>
                  {currentLesson.attachments.map((file, fIdx) => (
                    <Button
                      key={file.publicId || `att-${fIdx}`}
                      size="small"
                      icon={<PaperClipOutlined />}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ borderRadius: 6 }}
                    >
                      {file.name}
                    </Button>
                  ))}
                </Space>
              </div>
            )}
          </Card>

          {/* 3. AI Summary Box */}
          {(summary || isLoadingSummary) && (
            <Card
              style={{
                borderRadius: 12,
                backgroundColor: "rgba(99, 102, 241, 0.04)",
                borderColor: "rgba(99, 102, 241, 0.2)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <RobotOutlined style={{ fontSize: 20, color: "#6366f1" }} />
                <Text strong style={{ fontSize: 16, color: "#4338ca" }}>
                  AI Scholar Tóm Tắt Bài Học
                </Text>
              </div>
              {isLoadingSummary && !summary ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6366f1", padding: "12px 0" }}>
                  <SyncOutlined spin />
                  <Text style={{ color: "#6366f1" }}>Đang phân tích và tổng hợp nội dung bài học...</Text>
                </div>
              ) : (
                <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {summary}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Column: Lessons Sidebar & AI Tutor */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Course Playlist Card */}
          <Card
            title={
              <div>
                <Text strong style={{ fontSize: 15 }}>
                  Danh sách bài giảng
                </Text>
                <div style={{ marginTop: 6 }}>
                  <Progress
                    percent={progressPercentage}
                    size="small"
                    strokeColor="var(--color-success-base, #10b981)"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Tiến độ: {completedCount}/{sortedLessons.length} bài
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {progressPercentage}%
                    </Text>
                  </div>
                </div>
              </div>
            }
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <div
              style={{
                maxHeight: "calc(100vh - 360px)",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {sortedLessons.map((item, idx) => {
                const isActive = currentLesson ? String(item._id) === String(currentLesson._id) : false;
                const isItemCompleted = Boolean(progressMap.get(String(item._id))?.completed);

                return (
                  <div
                    key={item._id}
                    onClick={() => handleSelectLesson(item._id)}
                    style={{
                      padding: "14px 16px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--color-border-default, #f1f5f9)",
                      backgroundColor: isActive
                        ? "var(--color-action-primary-bg-light, #e6f4ff)"
                        : "transparent",
                      borderLeft: isActive ? "4px solid var(--color-action-primary-bg, #1677ff)" : "4px solid transparent",
                      transition: "all 0.2s ease",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ marginTop: 2 }}>
                      {isItemCompleted ? (
                        <CheckCircleFilled style={{ color: "var(--color-success-base, #10b981)", fontSize: 16 }} />
                      ) : isActive ? (
                        <PlayCircleFilled style={{ color: "var(--color-action-primary-bg, #1677ff)", fontSize: 16 }} />
                      ) : (
                        <PlayCircleOutlined style={{ color: "var(--color-text-description, #94a3b8)", fontSize: 16 }} />
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        strong={isActive}
                        style={{
                          fontSize: 13,
                          display: "block",
                          color: isActive ? "var(--color-action-primary-bg, #1677ff)" : "inherit",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Bài {idx + 1}: {cleanLessonTitle(item.title)}
                      </Text>
                      {item.duration && item.duration > 0 ? (
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {item.duration} phút
                        </Text>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* AI Scholar Tutor Chat Box */}
          <Card
            title={
              <Space size={8}>
                <RobotOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                <Text strong style={{ fontSize: 14 }}>
                  Trợ lý học tập AI
                </Text>
              </Space>
            }
            extra={
              <Button type="text" size="small" icon={<SyncOutlined />} onClick={initSession} title="Làm mới chat" />
            }
            styles={{ body: { padding: 0 } }}
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <div
              style={{
                height: 280,
                overflowY: "auto",
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                backgroundColor: "#f8fafc",
              }}
            >
              {isChatLoading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                  <Spin tip="Đang kết nối AI..." />
                </div>
              ) : chatError ? (
                <div style={{ textAlign: "center", color: "var(--color-error-base)", padding: 12 }}>
                  <Text type="danger" style={{ fontSize: 12 }}>{chatError}</Text>
                  <Button type="link" size="small" onClick={initSession}>Thử lại</Button>
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", color: "var(--color-text-description)", marginTop: 60 }}>
                  <RobotOutlined style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>Hỏi AI Scholar về nội dung bài học này.</p>
                </div>
              ) : (
                messages.map((msg, mIdx) => (
                  <div
                    key={msg.id || mIdx}
                    style={{
                      alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                      maxWidth: "85%",
                      backgroundColor: msg.role === "user" ? "var(--color-action-primary-bg, #1677ff)" : "#fff",
                      color: msg.role === "user" ? "#fff" : "inherit",
                      padding: "8px 12px",
                      borderRadius: 10,
                      fontSize: 12,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    }}
                  >
                    {msg.content}
                  </div>
                ))
              )}
              {isTyping && (
                <div style={{ alignSelf: "flex-start", padding: "6px 12px", backgroundColor: "#fff", borderRadius: 10, fontSize: 12 }}>
                  <SyncOutlined spin style={{ marginRight: 6 }} /> AI đang phản hồi...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{ padding: 10, borderTop: "1px solid var(--color-border-default, #f1f5f9)", display: "flex", gap: 8 }}>
              <input
                type="text"
                placeholder="Hỏi AI về bài học..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendChat();
                  }
                }}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid var(--color-border-default, #cbd5e1)",
                  outline: "none",
                  fontSize: 12,
                }}
              />
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isTyping}
                style={{ borderRadius: 6 }}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LectureViewPage;
