import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, Skeleton, Empty, Button, Tag, Typography } from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import axiosClient from "../../../api/axiosClient";
import PageContainer from "../../../shared/components/PageContainer";
import type { IExam } from "../../../types/exam";
import { resolveExamDisplayStatus } from "../../../types/exam";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import dayjs from "dayjs";

const { Title, Text } = Typography;

export default function StudentExamPage() {
  const [exams, setExams] = useState<IExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await axiosClient.get("/exams/my");
        setExams(response.data.data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách đề thi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  // Phân loại exam theo status thực tế từ backend + thời gian
  const upcomingExams = exams.filter((exam) => {
    const displayStatus = resolveExamDisplayStatus(exam.status, exam.startAt, exam.endAt);
    return (
      displayStatus === "PUBLISHED" || displayStatus === "UPCOMING" || displayStatus === "ONGOING"
    );
  });

  const historyExams = exams.filter((exam) => {
    const displayStatus = resolveExamDisplayStatus(exam.status, exam.startAt, exam.endAt);
    return displayStatus === "COMPLETED" || displayStatus === "ARCHIVED";
  });

  const handleStartAttempt = async (exam: IExam) => {
    try {
      // Correct route: POST /exams/:examId/start (không phải /exam-attempts/start)
      const response = await axiosClient.post<{
        success: boolean;
        data: { _id: string; sessionToken?: string };
      }>(`/exams/${exam._id}/start`, {});
      const attempt = response.data.data;
      const attemptId = attempt._id;
      if (attempt.sessionToken) {
        localStorage.setItem(`exam_token_${attemptId}`, attempt.sessionToken);
        localStorage.setItem(`exam_token_latest`, attempt.sessionToken);
      }
      navigate(`/exam/${attemptId}`);
    } catch (error: unknown) {
      console.error("Lỗi khi tạo phiên làm bài:", error);
      toast.error(getApiErrorMessage(error, "Không thể bắt đầu bài thi."), "Lỗi bài thi");
    }
  };

  const renderExamList = (list: IExam[], isHistory: boolean) => {
    if (list.length === 0) {
      return (
        <div className="py-16 text-center border border-dashed border-outline-variant rounded-2xl bg-surface-container-low mt-4">
          <Empty
            description={
              <span className="text-secondary font-medium">
                {isHistory
                  ? "Bạn chưa hoàn thành bài thi nào."
                  : "Hiện tại chưa có kỳ thi nào sắp tới. Hãy dành thời gian ôn luyện các chuyên đề nhé!"}
              </span>
            }
          />
        </div>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        {list.map((exam) => {
          const displayStatus = resolveExamDisplayStatus(exam.status, exam.startAt, exam.endAt);
          const startAtMs = exam.startAt ? new Date(exam.startAt).getTime() : null;
          const endAtMs = exam.endAt ? new Date(exam.endAt).getTime() : null;

          return (
            <div
              key={exam._id}
              className="p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Title level={5} className="!mb-1">
                    {exam.title}
                  </Title>
                  <div className="flex gap-3 text-sm text-gray-500 mt-1 flex-wrap">
                    <span>
                      <ClockCircleOutlined className="mr-1" />
                      {exam.duration} phút
                    </span>
                    {startAtMs && (
                      <span>
                        <CalendarOutlined className="mr-1" />
                        {dayjs(startAtMs).format("DD/MM/YYYY HH:mm")}
                      </span>
                    )}
                    {endAtMs && (
                      <span>
                        <BookOutlined className="mr-1" />
                        Kết thúc: {dayjs(endAtMs).format("DD/MM/YYYY HH:mm")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Tag
                    color={
                      displayStatus === "ONGOING"
                        ? "green"
                        : displayStatus === "UPCOMING"
                          ? "blue"
                          : displayStatus === "COMPLETED" || displayStatus === "ARCHIVED"
                            ? "default"
                            : "orange"
                    }
                  >
                    {displayStatus === "ONGOING"
                      ? "Đang diễn ra"
                      : displayStatus === "UPCOMING"
                        ? "Sắp diễn ra"
                        : displayStatus === "COMPLETED"
                          ? "Đã kết thúc"
                          : displayStatus === "ARCHIVED"
                            ? "Đã lưu trữ"
                            : "Mở thi"}
                  </Tag>
                  {!isHistory && (displayStatus === "ONGOING" || displayStatus === "PUBLISHED") && (
                    <Button type="primary" size="small" onClick={() => handleStartAttempt(exam)}>
                      Vào thi
                    </Button>
                  )}
                  {isHistory && (
                    <Button
                      icon={<CheckCircleOutlined />}
                      size="small"
                      onClick={() => navigate(`/student/exam/${exam._id}/results`)}
                    >
                      Xem kết quả
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton active paragraph={{ rows: 5 }} />
      </PageContainer>
    );
  }

  const tabItems = [
    {
      key: "upcoming",
      label: `Kỳ thi đang mở (${upcomingExams.length})`,
      children: renderExamList(upcomingExams, false),
    },
    {
      key: "history",
      label: `Lịch sử thi (${historyExams.length})`,
      children: renderExamList(historyExams, true),
    },
  ];

  return (
    <PageContainer title="Kỳ thi của tôi">
      <Tabs items={tabItems} />
    </PageContainer>
  );
}
