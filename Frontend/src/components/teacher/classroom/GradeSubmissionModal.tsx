import React, { useEffect, useState } from "react";
import { Modal, Form, InputNumber, Input, Button, Typography, Space, Tag, Avatar } from "antd";
import { CheckCircleOutlined, UserOutlined, EditOutlined } from "@ant-design/icons";
import assignmentApi from "../../../api/assignmentApi";
import { toast } from "../../../utils/toast";
import type { ISubmission } from "../../../interface/assignmentInterface";

const { Text, Title, Paragraph } = Typography;

interface GradeSubmissionModalProps {
  open: boolean;
  onClose: () => void;
  submission: ISubmission | null;
  onGraded?: () => void;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = React.memo(
  ({ open, onClose, submission, onGraded }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const studentObj = typeof submission?.studentId === "object" ? submission.studentId : null;
    const studentName = studentObj?.fullName || "Học sinh";
    const studentEmail = studentObj?.email || "";

    useEffect(() => {
      if (open && submission) {
        form.setFieldsValue({
          grade: submission.grade !== null && submission.grade !== undefined ? submission.grade : 10,
          feedback: submission.feedback || "",
          aiFeedback: submission.aiFeedback || "",
        });
      }
    }, [open, submission, form]);

    const handleSubmit = async (values: any) => {
      if (!submission?._id) return;
      setSubmitting(true);

      try {
        await assignmentApi.gradeSubmission(submission._id, {
          grade: Number(values.grade),
          feedback: values.feedback?.trim() || "",
          aiFeedback: values.aiFeedback?.trim() || "",
        });

        toast.success(`Đã chấm điểm cho học sinh ${studentName} thành công!`);
        onClose();
        if (onGraded) onGraded();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi chấm bài!");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal
        title={
          <Space align="center">
            <EditOutlined style={{ color: "#1890ff" }} />
            <span>Chấm điểm & Nhận xét bài làm</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnClose
      >
        {submission && (
          <div style={{ marginBottom: 20, padding: 12, backgroundColor: "#f5f5f5", borderRadius: 8 }}>
            <Space size={12}>
              <Avatar
                src={studentObj?.avatar || undefined}
                icon={!studentObj?.avatar ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "#1890ff" }}
              />
              <div>
                <Text strong style={{ fontSize: 14, display: "block" }}>
                  {studentName}
                </Text>
                {studentEmail && <Text type="secondary" style={{ fontSize: 12 }}>{studentEmail}</Text>}
              </div>
            </Space>
          </div>
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="grade"
            label="Điểm số (Thang điểm 100 hoặc 10)"
            rules={[
              { required: true, message: "Vui lòng nhập điểm số!" },
              { type: "number", min: 0, max: 100, message: "Điểm số từ 0 đến 100!" },
            ]}
          >
            <InputNumber min={0} max={100} step={0.5} style={{ width: "100%" }} placeholder="Nhập điểm số (Ví dụ: 8.5 hoặc 85)" />
          </Form.Item>

          <Form.Item name="feedback" label="Nhận xét / Lời phê của giáo viên">
            <Input.TextArea rows={3} placeholder="Nhập nhận xét chi tiết, khen ngợi hoặc lưu ý bài làm cho học sinh..." />
          </Form.Item>

          <Form.Item name="aiFeedback" label="Gợi ý đánh giá tự động (AI Feedback)">
            <Input.TextArea rows={2} placeholder="Nhập gợi ý feedback tự động từ AI (nếu có)..." />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<CheckCircleOutlined />}>
              Lưu kết quả chấm
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
);

GradeSubmissionModal.displayName = "GradeSubmissionModal";
