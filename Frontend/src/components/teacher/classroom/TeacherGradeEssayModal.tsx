import React, { useEffect, useState, useCallback } from "react";
import { Modal, Form, InputNumber, Button, Typography, Space, Tag, Avatar, Spin, Card, Alert, Divider } from "antd";
import { CheckCircleOutlined, UserOutlined, EditOutlined, AlertOutlined, ReloadOutlined } from "@ant-design/icons";
import examApi from "../../../api/examApi";
import { toast } from "../../../utils/toast";

const { Text, Title, Paragraph } = Typography;

interface TeacherGradeEssayModalProps {
  open: boolean;
  onClose: () => void;
  attemptId: string | null;
  onGraded?: () => void;
}

export const TeacherGradeEssayModal: React.FC<TeacherGradeEssayModalProps> = React.memo(
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
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Không thể nạp dữ liệu chi tiết bài làm!");
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
        toast.success("Chấm điểm bài thi tự luận thành công!");
        onClose();
        if (onGraded) onGraded();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi lưu kết quả chấm điểm!");
      } finally {
        setSubmitting(false);
      }
    };

    const studentObj = reviewData?.student;
    const studentName = studentObj?.fullName || "Học sinh";
    const essayQuestions = (reviewData?.answersDetail || []).filter(
      (ans: any) => ans.type === "ESSAY" || ans.type === "Essay"
    );

    return (
      <Modal
        title={
          <Space align="center">
            <EditOutlined style={{ color: "#1890ff" }} />
            <span>Chấm điểm & Xem lại bài làm: {studentName}</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={800}
        destroyOnClose
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip="Đang tải dữ liệu bài làm của sinh viên..." />
          </div>
        ) : reviewData ? (
          <div>
            {/* Student & Attempt Header Card */}
            <Card style={{ marginBottom: 16, backgroundColor: "#f8f9fa", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <Space size={12}>
                  <Avatar
                    src={studentObj?.avatar || undefined}
                    icon={!studentObj?.avatar ? <UserOutlined /> : undefined}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                  <div>
                    <Text strong style={{ fontSize: 15, display: "block" }}>
                      {studentName} ({studentObj?.email || "Sinh viên"})
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Mã SV: STU-{((studentObj?._id || "").toString()).slice(-6).toUpperCase()}
                    </Text>
                  </div>
                </Space>

                <Space size={12}>
                  <div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>Điểm hiện tại</Text>
                    <Text strong style={{ color: "#1890ff", fontSize: 18 }}>
                      {reviewData.totalScore} / 10
                    </Text>
                  </div>
                  {reviewData.cheatWarnings > 0 && (
                    <Tag color="error" icon={<AlertOutlined />}>
                      Cảnh báo: {reviewData.cheatWarnings} lần
                    </Tag>
                  )}
                </Space>
              </div>
            </Card>

            {/* Essay Form / Questions List */}
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Title level={5} style={{ fontSize: 15, marginBottom: 12 }}>
                📝 Danh sách câu hỏi tự luận ({essayQuestions.length} câu)
              </Title>

              {essayQuestions.length > 0 ? (
                essayQuestions.map((ans: any, idx: number) => (
                  <Card key={ans.questionId || idx} style={{ marginBottom: 16, borderRadius: 8, border: "1px solid #e8e8e8" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 14 }}>
                        Câu {idx + 1}: {ans.questionContent || "Câu hỏi tự luận"}
                      </Text>
                      <Tag color="blue">Điểm tối đa: {ans.maxPoints || 1} điểm</Tag>
                    </div>

                    <div style={{ backgroundColor: "#f0f5ff", padding: 12, borderRadius: 6, marginBottom: 12 }}>
                      <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>
                        Bài làm của sinh viên:
                      </Text>
                      <Paragraph style={{ margin: 0, fontWeight: 500 }}>
                        {ans.studentAnswer || "(Sinh viên chưa nhập câu trả lời)"}
                      </Paragraph>
                    </div>

                    {ans.correctAnswer && (
                      <div style={{ backgroundColor: "#f6ffed", padding: 10, borderRadius: 6, marginBottom: 12 }}>
                        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 2 }}>
                          Đáp án gợi ý / Thang điểm:
                        </Text>
                        <Text style={{ color: "#389e0d", fontSize: 13 }}>{ans.correctAnswer}</Text>
                      </div>
                    )}

                    <Form.Item
                      name={`points_${ans.questionId}`}
                      label="Điểm chấm cho câu này"
                      rules={[
                        { required: true, message: "Vui lòng nhập điểm!" },
                        { type: "number", min: 0, max: ans.maxPoints || 10, message: `Điểm số từ 0 đến ${ans.maxPoints || 10}` },
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
                ))
              ) : (
                <Alert
                  message="Bài thi này 100% trắc nghiệm!"
                  description="Hệ thống đã tự động chấm điểm xong cho toàn bộ câu hỏi trắc nghiệm."
                  type="info"
                  showIcon
                  style={{ marginBottom: 20 }}
                />
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 20 }}>
                <Button onClick={onClose}>Hủy</Button>
                {essayQuestions.length > 0 && (
                  <Button type="primary" htmlType="submit" loading={submitting} icon={<CheckCircleOutlined />}>
                    Lưu kết quả chấm tự luận
                  </Button>
                )}
              </div>
            </Form>
          </div>
        ) : (
          <Alert message="Không tìm thấy bài làm để xem lại." type="warning" showIcon />
        )}
      </Modal>
    );
  }
);

TeacherGradeEssayModal.displayName = "TeacherGradeEssayModal";
