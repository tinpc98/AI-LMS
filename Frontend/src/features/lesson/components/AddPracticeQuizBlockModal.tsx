import React, { useEffect, useMemo, useState } from "react";
import { Modal, Form, Input, Select, Alert, Typography } from "antd";
import axiosClient from "../../../api/axiosClient";
import { lessonApi } from "../../../api/lessonApi";
import { extractPlainText } from "../../question/contentText";
import type { Question } from "../../question/question.types";

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  topicId: string;
  onSubmit: (quizId: string) => void;
}

// TÍNH NĂNG MỚI (mục 1.4): Practice Quiz chỉ chấp nhận câu hỏi MCQ/TRUE_FALSE (chấm tự động
// 100%, xem practiceQuiz.model.js) — lọc sẵn ở đây để giáo viên không chọn nhầm câu tự luận
// (sẽ luôn bị chấm sai vì không có options[].isCorrect để so khớp).
export const AddPracticeQuizBlockModal: React.FC<Props> = ({
  open,
  onClose,
  topicId,
  onSubmit,
}) => {
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !topicId) return;
    setLoading(true);
    axiosClient
      .get("/questions", { params: { topicId, limit: 200 } })
      .then((res) => {
        const all: Question[] = res.data?.data || [];
        setQuestions(all.filter((q) => q.type === "MCQ" || q.type === "TRUE_FALSE"));
      })
      .catch(() => setError("Không tải được danh sách câu hỏi."))
      .finally(() => setLoading(false));
  }, [open, topicId]);

  const questionOptions = useMemo(
    () =>
      questions.map((q) => ({
        value: q._id,
        label: `[${q.type === "MCQ" ? "TN" : "Đ/S"}] ${extractPlainText(q.content).slice(0, 80) || "(chưa có nội dung)"}`,
      })),
    [questions]
  );

  const handleFinish = async (values: { title: string; questionIds: string[] }) => {
    setSubmitting(true);
    setError(null);
    try {
      const quizRes = await lessonApi.createPracticeQuiz({
        title: values.title.trim(),
        questions: values.questionIds.map((questionId, order) => ({ questionId, order })),
      });
      onSubmit(quizRes.data.quiz._id);
      form.resetFields();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Tạo Practice Quiz thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Thêm block Practice Quiz"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
      okText="Tạo & Thêm"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnClose
      width={640}
    >
      <Text type="secondary" style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
        Practice Quiz phục vụ việc học (không tính vào điểm tổng kết) — chỉ hiện câu Trắc nghiệm và
        Đúng/Sai của Topic này (chấm tự động được). Cần thêm câu hỏi khác? Vào Ngân hàng câu hỏi
        trước.
      </Text>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="title"
          label="Tiêu đề Practice Quiz"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
        >
          <Input placeholder="VD: Kiểm tra nhanh - Đạo hàm" />
        </Form.Item>

        <Form.Item
          name="questionIds"
          label="Chọn câu hỏi"
          rules={[{ required: true, message: "Vui lòng chọn ít nhất 1 câu hỏi!" }]}
        >
          <Select
            mode="multiple"
            loading={loading}
            options={questionOptions}
            placeholder={
              questionOptions.length === 0 && !loading
                ? "Topic này chưa có câu hỏi Trắc nghiệm/Đúng-Sai nào"
                : "Chọn câu hỏi cho quiz"
            }
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddPracticeQuizBlockModal;
