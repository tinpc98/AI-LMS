import React, { useState } from "react";
import { Button, Modal, Form, Rate, Input, Tag } from "antd";
import { StarOutlined, CheckCircleFilled } from "@ant-design/icons";
import { cohortFeedbackApi } from "../../../api/cohortFeedbackApi";
import { toast } from "../../../utils/toast";
import { useAuth } from "../../../shared/hooks/useAuth";
import type { SubmitCohortFeedbackPayload } from "../cohortFeedback.types";

const { TextArea } = Input;

interface CohortFeedbackButtonProps {
  classId: string;
}

// BUG ĐÃ SỬA: key trước đây chỉ có classId, không có học sinh — trên máy dùng chung (phòng máy
// trường học), học sinh B đăng nhập sau có thể thấy nhầm "Đã đánh giá" của học sinh A vì cùng
// origin localStorage. Thêm userId vào key để mỗi học sinh có trạng thái riêng trên cùng trình
// duyệt.
const submittedKey = (classId: string, userId: string) =>
  `cohortFeedback:submitted:${userId}:${classId}`;

// Nút "Đánh giá lớp học" — chỉ hiển thị khi commitmentStatus đã COMPLETED/COMPLETED_PARTIAL
// (điều kiện lọc do component cha quyết định). EduSpace mechanism design Phần C.3.
export const CohortFeedbackButton: React.FC<CohortFeedbackButtonProps> = ({ classId }) => {
  const { user } = useAuth();
  const userId = user?.id || user?._id || "";
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(
    () => !!userId && localStorage.getItem(submittedKey(classId, userId)) === "1"
  );
  const [form] = Form.useForm<SubmitCohortFeedbackPayload>();

  const handleSubmit = async (values: SubmitCohortFeedbackPayload) => {
    try {
      setSubmitting(true);
      await cohortFeedbackApi.submit(classId, values);
      if (userId) localStorage.setItem(submittedKey(classId, userId), "1");
      setSubmitted(true);
      setOpen(false);
      form.resetFields();
      toast.success("Cảm ơn bạn đã đánh giá lớp học!");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Không thể gửi đánh giá, vui lòng thử lại.";
      toast.error(message);
      if (error?.response?.status === 409) {
        if (userId) localStorage.setItem(submittedKey(classId, userId), "1");
        setSubmitted(true);
        setOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Tag
        icon={<CheckCircleFilled />}
        color="success"
        style={{ borderRadius: 8, padding: "4px 10px" }}
      >
        Đã đánh giá
      </Tag>
    );
  }

  return (
    <>
      <Button
        size="small"
        icon={<StarOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        style={{ borderRadius: 8 }}
      >
        Đánh giá lớp học
      </Button>

      <Modal
        title="Đánh giá lớp học"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okButtonProps={{ loading: submitting }}
        okText="Gửi đánh giá"
        cancelText="Huỷ"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
          <Form.Item
            name="ratingClarity"
            label="Bài giảng rõ ràng, dễ hiểu"
            rules={[{ required: true, message: "Vui lòng đánh giá tiêu chí này" }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item
            name="ratingHelpfulness"
            label="Giáo viên hỗ trợ hữu ích"
            rules={[{ required: true, message: "Vui lòng đánh giá tiêu chí này" }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item name="comment" label="Nhận xét thêm (không bắt buộc)">
            <TextArea
              rows={3}
              maxLength={2000}
              showCount
              placeholder="Chia sẻ trải nghiệm của bạn..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default CohortFeedbackButton;
