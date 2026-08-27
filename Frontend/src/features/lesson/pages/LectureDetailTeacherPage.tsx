import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Typography,
  Space,
  Card,
  Empty,
  Skeleton,
  Drawer,
  Tag,
  Switch,
  Popconfirm,
  message,
} from "antd";
import {
  ArrowLeftOutlined,
  MenuOutlined,
  EditOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  VideoCameraOutlined,
  FileTextOutlined,
  FormOutlined,
  PlayCircleFilled,
  PlayCircleOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

import { lessonApi } from "../../../api/lessonApi";
import CreateLessonModal from "../components/CreateLessonModal";
import AddVideoBlockModal from "../components/AddVideoBlockModal";
import AddDocumentBlockModal from "../components/AddDocumentBlockModal";
import AddPracticeQuizBlockModal from "../components/AddPracticeQuizBlockModal";
import { sortLessons, cleanLessonTitle } from "../utils/lessonHelper";
import type {
  Lesson,
  LessonBlock,
  CreateLessonBlockInput,
  LessonVideoBlockData,
  LessonDocumentBlockData,
  PracticeQuiz,
} from "../lesson.types";

const { Title, Text } = Typography;

const statusColor: Record<Lesson["status"], string> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

const toBlockInput = (block: LessonBlock): CreateLessonBlockInput => ({
  type: block.type,
  isRequired: block.isRequired,
  video: block.video ?? undefined,
  document: block.document ?? undefined,
  quizId: typeof block.quizId === "string" ? block.quizId : block.quizId?._id,
});

// TÍNH NĂNG MỚI (mục 1) — dựng lại hoàn toàn: bản cũ gọi PATCH /lessons/:id/quiz và
// DELETE /lessons/:id/attachments/:publicId, cả 2 route đều không tồn tại (Lesson giờ là tập
// hợp block Video/Tài liệu/Practice Quiz, không còn videoIds/documentIds/quiz rời). Trang này
// là nơi giáo viên thực sự soạn được nội dung — mirror cấu trúc trang xem của học sinh
// (LectureViewPage.tsx) để dùng chung sidebar/điều hướng.
export const LectureDetailTeacherPage: React.FC = () => {
  const { classId = "", lectureId = "" } = useParams<{ classId?: string; lectureId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const baseClassPath = `/teacher/classroom-detail/${classId}`;
  const getLecturePath = (targetLessonId: string) =>
    `/teacher/classroom-detail/${classId}/lecture/${targetLessonId}`;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditInfoOpen, setIsEditInfoOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [savingBlocks, setSavingBlocks] = useState(false);

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

  const currentIndex = useMemo(() => {
    if (!lectureId) return -1;
    return sortedLessons.findIndex((l) => String(l._id) === String(lectureId));
  }, [sortedLessons, lectureId]);

  const activeLessonId = currentIndex >= 0 ? lectureId : sortedLessons[0]?._id;

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

  const invalidateLesson = () => {
    queryClient.invalidateQueries({ queryKey: ["lesson", activeLessonId] });
    queryClient.invalidateQueries({ queryKey: ["lessons", classId] });
  };

  const persistBlocks = async (newBlocks: CreateLessonBlockInput[]) => {
    if (!currentLesson) return;
    setSavingBlocks(true);
    try {
      await lessonApi.updateLesson(currentLesson._id, { blocks: newBlocks });
      invalidateLesson();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không lưu được thay đổi.");
    } finally {
      setSavingBlocks(false);
    }
  };

  const sortedBlocks = currentLesson
    ? [...currentLesson.blocks].sort((a, b) => a.order - b.order)
    : [];

  const handleAddVideo = (video: LessonVideoBlockData) => {
    setIsVideoModalOpen(false);
    const newBlocks = [
      ...sortedBlocks.map(toBlockInput),
      { type: "VIDEO" as const, isRequired: true, video },
    ];
    persistBlocks(newBlocks);
  };

  const handleAddDocument = (document: LessonDocumentBlockData) => {
    setIsDocumentModalOpen(false);
    const newBlocks = [
      ...sortedBlocks.map(toBlockInput),
      { type: "DOCUMENT" as const, isRequired: true, document },
    ];
    persistBlocks(newBlocks);
  };

  const handleAddQuiz = (quizId: string) => {
    setIsQuizModalOpen(false);
    const newBlocks = [
      ...sortedBlocks.map(toBlockInput),
      { type: "PRACTICE_QUIZ" as const, isRequired: true, quizId },
    ];
    persistBlocks(newBlocks);
  };

  const handleRemoveBlock = (blockId: string) => {
    const newBlocks = sortedBlocks.filter((b) => b._id !== blockId).map(toBlockInput);
    persistBlocks(newBlocks);
  };

  const handleToggleRequired = (blockId: string, isRequired: boolean) => {
    const newBlocks = sortedBlocks.map((b) =>
      b._id === blockId ? { ...toBlockInput(b), isRequired } : toBlockInput(b)
    );
    persistBlocks(newBlocks);
  };

  const moveBlock = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sortedBlocks.length) return;
    const reordered = [...sortedBlocks];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    persistBlocks(reordered.map(toBlockInput));
  };

  const handlePublish = async () => {
    if (!currentLesson) return;
    try {
      await lessonApi.updateLessonStatus(currentLesson._id, "PUBLISHED");
      message.success("Đã xuất bản bài giảng");
      invalidateLesson();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không xuất bản được — cần ít nhất 1 block.");
    }
  };

  const handleArchive = async () => {
    if (!currentLesson) return;
    try {
      await lessonApi.updateLessonStatus(currentLesson._id, "ARCHIVED");
      message.success("Đã lưu trữ bài giảng");
      invalidateLesson();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không lưu trữ được bài giảng.");
    }
  };

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
                ? "Không thể tải danh sách bài giảng."
                : "Lớp học này chưa có bài giảng nào."}
            </Text>
          }
        >
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(baseClassPath)}>
              Quay lại lớp học
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Tạo bài giảng đầu tiên
            </Button>
          </Space>
        </Empty>
        {isCreateModalOpen && (
          <CreateLessonModal
            classId={classId}
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={(lesson) => {
              setIsCreateModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ["lessons", classId] });
              navigate(getLecturePath(lesson._id));
            }}
          />
        )}
      </div>
    );
  }

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
            Danh sách bài giảng
          </Button>
        </Space>

        {currentLesson && (
          <Space size={12}>
            <Tag color={statusColor[currentLesson.status]}>{currentLesson.status}</Tag>
            {currentLesson.status === "DRAFT" && (
              <Button type="primary" onClick={handlePublish}>
                Xuất bản
              </Button>
            )}
            {currentLesson.status !== "ARCHIVED" && (
              <Popconfirm
                title="Lưu trữ bài giảng này?"
                onConfirm={handleArchive}
                okText="Lưu trữ"
                cancelText="Hủy"
              >
                <Button>Lưu trữ</Button>
              </Popconfirm>
            )}
          </Space>
        )}
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
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
                  <Text style={{ color: "#64748b", marginTop: 8, display: "block", fontSize: 15 }}>
                    {currentLesson.description || "Chưa có mô tả cho bài giảng này."}
                  </Text>
                </div>
                <Button icon={<EditOutlined />} onClick={() => setIsEditInfoOpen(true)}>
                  Sửa thông tin
                </Button>
              </div>
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Title level={4} style={{ margin: 0, color: "#334155" }}>
                Nội dung bài giảng
              </Title>
              <Space wrap>
                <Button icon={<VideoCameraOutlined />} onClick={() => setIsVideoModalOpen(true)}>
                  Thêm Video
                </Button>
                <Button icon={<FileTextOutlined />} onClick={() => setIsDocumentModalOpen(true)}>
                  Thêm Tài liệu
                </Button>
                <Button
                  icon={<FormOutlined />}
                  onClick={() => setIsQuizModalOpen(true)}
                  disabled={sortedBlocks.some((b) => b.type === "PRACTICE_QUIZ")}
                  title={
                    sortedBlocks.some((b) => b.type === "PRACTICE_QUIZ")
                      ? "Mỗi bài giảng chỉ có tối đa 1 Practice Quiz"
                      : undefined
                  }
                >
                  Thêm Practice Quiz
                </Button>
              </Space>
            </div>

            {sortedBlocks.length === 0 ? (
              <Card style={{ borderRadius: 16, textAlign: "center", padding: "24px 0" }}>
                <Text type="secondary">
                  Chưa có block nội dung nào — thêm Video/Tài liệu/Quiz ở trên. Cần ít nhất 1 block
                  để xuất bản.
                </Text>
              </Card>
            ) : (
              sortedBlocks.map((block, index) => (
                <Card
                  key={block._id}
                  style={{ borderRadius: 12 }}
                  styles={{ body: { padding: 16 } }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ fontSize: 28, color: "#1677ff", flexShrink: 0 }}>
                      {block.type === "VIDEO" && <VideoCameraOutlined />}
                      {block.type === "DOCUMENT" && <FileTextOutlined />}
                      {block.type === "PRACTICE_QUIZ" && <FormOutlined />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text strong>
                        {block.type === "VIDEO" && (block.video?.title || "Video bài giảng")}
                        {block.type === "DOCUMENT" && (block.document?.title || "Tài liệu")}
                        {block.type === "PRACTICE_QUIZ" &&
                          (typeof block.quizId === "object"
                            ? (block.quizId as PracticeQuiz).title
                            : "Practice Quiz")}
                      </Text>
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {block.type === "VIDEO" && `${block.video?.durationSeconds ?? 0} giây`}
                          {block.type === "DOCUMENT" && block.document?.fileType?.toUpperCase()}
                          {block.type === "PRACTICE_QUIZ" &&
                            typeof block.quizId === "object" &&
                            `${(block.quizId as PracticeQuiz).questions.length} câu hỏi`}
                        </Text>
                      </div>
                    </div>
                    <Space>
                      <Space size={4} style={{ marginRight: 8 }}>
                        <Switch
                          size="small"
                          checked={block.isRequired}
                          onChange={(checked) => handleToggleRequired(block._id, checked)}
                          disabled={savingBlocks}
                        />
                        <Text style={{ fontSize: 12 }}>Bắt buộc</Text>
                      </Space>
                      <Button
                        size="small"
                        icon={<ArrowUpOutlined />}
                        disabled={index === 0 || savingBlocks}
                        onClick={() => moveBlock(index, -1)}
                      />
                      <Button
                        size="small"
                        icon={<ArrowDownOutlined />}
                        disabled={index === sortedBlocks.length - 1 || savingBlocks}
                        onClick={() => moveBlock(index, 1)}
                      />
                      <Popconfirm
                        title="Xóa block này khỏi bài giảng?"
                        onConfirm={() => handleRemoveBlock(block._id)}
                        okText="Xóa"
                        cancelText="Hủy"
                      >
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={savingBlocks}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                </Card>
              ))
            )}
          </>
        )}
      </div>

      <Drawer
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong style={{ fontSize: 16 }}>
              Danh sách bài giảng
            </Text>
            <Button
              size="small"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Tạo mới
            </Button>
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
                {item.status === "PUBLISHED" ? (
                  <CheckCircleFilled style={{ color: "#10b981", fontSize: 18 }} />
                ) : isActive ? (
                  <PlayCircleFilled style={{ color: "#1677ff", fontSize: 18 }} />
                ) : (
                  <PlayCircleOutlined style={{ color: "#94a3b8", fontSize: 18 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    strong={isActive}
                    style={{
                      fontSize: 14,
                      display: "block",
                      color: isActive ? "#1677ff" : "inherit",
                    }}
                  >
                    Bài {idx + 1}: {cleanLessonTitle(item.title)}
                  </Text>
                  <Tag color={statusColor[item.status]} style={{ marginTop: 2 }}>
                    {item.status}
                  </Tag>
                </div>
              </div>
            );
          })}
        </div>
      </Drawer>

      {isCreateModalOpen && (
        <CreateLessonModal
          classId={classId}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={(lesson) => {
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ["lessons", classId] });
            navigate(getLecturePath(lesson._id));
          }}
        />
      )}

      {isEditInfoOpen && currentLesson && (
        <CreateLessonModal
          classId={classId}
          lessonData={currentLesson}
          onClose={() => setIsEditInfoOpen(false)}
          onCreated={() => {}}
          onUpdated={() => {
            setIsEditInfoOpen(false);
            invalidateLesson();
          }}
        />
      )}

      <AddVideoBlockModal
        open={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onSubmit={handleAddVideo}
      />
      <AddDocumentBlockModal
        open={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        onSubmit={handleAddDocument}
      />
      {currentLesson && (
        <AddPracticeQuizBlockModal
          open={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          topicId={currentLesson.topicId}
          onSubmit={handleAddQuiz}
        />
      )}
    </div>
  );
};

export default LectureDetailTeacherPage;
