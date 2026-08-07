import React, { useEffect, useState, useCallback } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Spin,
  Card,
  Alert,
  Divider,
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  EditOutlined,
  SafetyCertificateOutlined,
  BookOutlined,
} from "@ant-design/icons";
import examApi from "../../../../api/examApi";
import { toast } from "../../../../utils/toast";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";
import ExamResultCard from "../classDetail/exams/ExamResultCard";
import ExamQuestionReviewList from "../classDetail/exams/ExamQuestionReviewList";

const { Text, Title, Paragraph } = Typography;

interface TeacherGradeModalProps {
  open: boolean;
  onClose: () => void;
  attemptId: string | null;
  onGraded?: () => void;
}

const mapCheatType = (type: string) => {
  switch (type) {
    case "TAB_SWITCH":
      return "Rời khỏi màn hình bài thi";
    case "FULLSCREEN_EXIT":
      return "Thoát chế độ toàn màn hình";
    case "COPY_PASTE":
      return "Sao chép/Dán nội dung";
    case "MULTIPLE_FACES":
      return "Phát hiện nhiều khuôn mặt";
    default:
      return type;
  }
};

export const TeacherGradeModal: React.FC<TeacherGradeModalProps> = React.memo(
  ({ open, onClose, attemptId, onGraded }) => {
    const [reviewData, setReviewData] = useState<any | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    const fetchReviewData = useCallback(async () => {
      if (!attemptId) return;
      setLoading(true);
      try {
        const data = await examApi.getAttemptForReview(attemptId);
        setReviewData(data);

        // Pre-fill form values for essay questions
        if (data?.answersDetail) {
          const initialValues: Record<string, number> = {};
          data.answersDetail.forEach((ans: any) => {
            if (ans.type === "ESSAY" || ans.type === "Essay") {
              initialValues[`points_${ans.questionId}`] = ans.pointsEarned ?? 0;
            }
          });
          form.setFieldsValue(initialValues);
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Không thể nạp dữ liệu chi tiết bài làm!"));
        setReviewData(null);
      } finally {
        setLoading(false);
      }
    }, [attemptId, form]);

    useEffect(() => {
      if (open && attemptId) {
        fetchReviewData();
      }
    }, [open, attemptId, fetchReviewData]);

    const handleSubmit = async (values: any) => {
      if (!attemptId || !reviewData) return;
      setSubmitting(true);

      try {
        const essayGrades = (reviewData.answersDetail || [])
          .filter((ans: any) => ans.type === "ESSAY" || ans.type === "Essay")
          .map((ans: any) => ({
            questionId: (ans.questionId?._id || ans.questionId).toString(),
            pointsEarned: Number(values[`points_${ans.questionId}`] || 0),
          }));

        await examApi.gradeEssay(attemptId, essayGrades);
        toast.success("Đã chốt điểm bài thi thành công!");
        onClose();
        if (onGraded) onGraded();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi chốt điểm bài thi!"));
      } finally {
        setSubmitting(false);
      }
    };

    const studentObj = reviewData?.student;
    const studentName = studentObj?.fullName || "Học sinh";
    const essayQuestions = (reviewData?.answersDetail || []).filter(
      (ans: any) => ans.type === "ESSAY" || ans.type === "Essay"
    );
    const allQuestions = reviewData?.answersDetail || [];

    const isSuspended = (reviewData?.cheatWarnings || 0) >= 5;

    // Phân tích cheat logs
    const cheatLogs = reviewData?.cheatLogs || [];
    const cheatSummary: Record<string, number> = {};
    cheatLogs.forEach((log: any) => {
      const mapped = mapCheatType(log.cheatType);
      cheatSummary[mapped] = (cheatSummary[mapped] || 0) + 1;
    });

    const isGraded = reviewData?.status === "GRADED";
    let submitButtonText = essayQuestions.length > 0 ? "Lưu kết quả chấm" : "Xác nhận chốt điểm";
    if (isGraded) {
      submitButtonText = "Xác nhận điểm";
    }

    return (
      <Modal
        title={
          <Space align="center">
            <EditOutlined style={{ color: "var(--color-action-primary-bg)" }} />
            <span>Chấm điểm & Xem lại bài làm: {studentName}</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={900}
        centered
        destroyOnClose
        styles={{ body: { maxHeight: "75vh", overflowY: "auto", paddingRight: 8, paddingTop: 16 } }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip="Đang tải dữ liệu bài làm của sinh viên..." />
          </div>
        ) : reviewData ? (
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {/* Student Info Card */}
            <Card style={{ marginBottom: 16, backgroundColor: "var(--color-bg-page)", borderRadius: 8 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <Space size={12}>
                  <Avatar
                    src={studentObj?.avatar || undefined}
                    icon={!studentObj?.avatar ? <UserOutlined /> : undefined}
                    style={{ backgroundColor: "var(--color-action-primary-bg)" }}
                  />
                  <div>
                    <Text strong style={{ fontSize: 15, display: "block" }}>
                      {studentName} ({studentObj?.email || "Sinh viên"})
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Mã SV: STU-{(studentObj?._id || "").toString().slice(-6).toUpperCase()}
                    </Text>
                  </div>
                </Space>
              </div>
            </Card>

            {/* Kết quả Card (dùng chung ExamResultCard) */}
            <div style={{ marginBottom: 16 }}>
              <ExamResultCard
                attempt={{
                  ...reviewData,
                  totalScore: reviewData.totalScore,
                  createdAt: reviewData.submittedAt
                }}
                maxScore={10}
                isSuspended={isSuspended}
              />
            </div>

            {/* Khối Giám sát bài thi */}
            <Card
              size="small"
              title={
                <Space>
                  <SafetyCertificateOutlined style={{ color: "var(--color-primary-base)" }} />
                  <Text strong>Giám sát bài thi</Text>
                </Space>
              }
              style={{ marginBottom: 16, borderRadius: 12, border: "1px solid var(--color-border-default)" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {reviewData?.cheatWarnings > 0 ? (
                  <>
                    <Text>
                      Số lần vi phạm: <Text strong style={{ color: "var(--color-error-text)" }}>{reviewData.cheatWarnings}/5</Text>
                    </Text>
                    {Object.keys(cheatSummary).length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text type="secondary">Chi tiết:</Text>
                        <ul style={{ margin: "4px 0 0 20px", padding: 0 }}>
                          {Object.entries(cheatSummary).map(([key, count]) => (
                            <li key={key}>
                              <Text>{key} ({count} lần)</Text>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <Space>
                    <CheckCircleOutlined style={{ color: "var(--color-success-base)" }} />
                    <Text strong style={{ color: "var(--color-success-text)" }}>Không phát hiện vi phạm</Text>
                  </Space>
                )}
              </div>
            </Card>

            <Divider style={{ margin: "20px 0" }} />

            {/* Essay Questions List */}
            {essayQuestions.length > 0 && (
              <>
                <Title level={5} style={{ fontSize: 15, marginBottom: 12 }}>
                  📝 Danh sách câu hỏi tự luận cần chấm ({essayQuestions.length} câu)
                </Title>
                {essayQuestions.map((ans: any, idx: number) => (
                  <Card
                    key={ans.questionId || idx}
                    style={{ marginBottom: 16, borderRadius: 8, border: "1px solid var(--color-border-default)" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <Text strong style={{ fontSize: 14 }}>
                        Câu {idx + 1}: {ans.questionContent || "Câu hỏi tự luận"}
                      </Text>
                      <Tag color="blue">Điểm tối đa: {ans.maxPoints || 1} điểm</Tag>
                    </div>

                    <div
                      style={{
                        backgroundColor: "var(--color-bg-primary-tint)",
                        padding: 12,
                        borderRadius: 6,
                        marginBottom: 12,
                      }}
                    >
                      <Text
                        type="secondary"
                        style={{ fontSize: 12, display: "block", marginBottom: 2 }}
                      >
                        Bài làm của sinh viên:
                      </Text>
                      <Paragraph style={{ margin: 0, fontWeight: 500 }}>
                        {ans.studentAnswer || "(Sinh viên chưa nhập câu trả lời)"}
                      </Paragraph>
                    </div>

                    {ans.correctAnswer && (
                      <div
                        style={{
                          backgroundColor: "var(--color-success-bg)",
                          padding: 10,
                          borderRadius: 6,
                          marginBottom: 12,
                        }}
                      >
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, display: "block", marginBottom: 2 }}
                        >
                          Đáp án gợi ý / Thang điểm:
                        </Text>
                        <Text style={{ color: "var(--color-success-text)", fontSize: 13 }}>{ans.correctAnswer}</Text>
                      </div>
                    )}

                    <Form.Item
                      name={`points_${ans.questionId}`}
                      label="Điểm chấm cho câu này"
                      rules={[
                        { required: true, message: "Vui lòng nhập điểm!" },
                        {
                          type: "number",
                          min: 0,
                          max: ans.maxPoints || 10,
                          message: `Điểm số từ 0 đến ${ans.maxPoints || 10}`,
                        },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <InputNumber
                        min={0}
                        max={ans.maxPoints || 10}
                        step={0.25}
                        placeholder="Nhập điểm chấm (VD: 1.5)"
                        style={{ width: 200 }}
                      />
                    </Form.Item>
                  </Card>
                ))}
                <Divider style={{ margin: "20px 0" }} />
              </>
            )}

            {/* All Questions Review */}
            <Text
              strong
              style={{ fontSize: 15, color: "var(--color-text-title)", display: "block", marginBottom: 12 }}
            >
              <BookOutlined style={{ marginRight: 6 }} /> Danh sách toàn bộ câu hỏi & Đáp án:
            </Text>

            <ExamQuestionReviewList
              questionsList={allQuestions}
              studentAnswerLabel="Đáp án học sinh chọn"
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
              <Button onClick={onClose}>Hủy</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<CheckCircleOutlined />}
              >
                {submitButtonText}
              </Button>
            </div>
          </Form>
        ) : (
          <Alert message="Không tìm thấy bài làm để xem lại." type="warning" showIcon />
        )}
      </Modal>
    );
  }
);

TeacherGradeModal.displayName = "TeacherGradeModal";

export default TeacherGradeModal;
