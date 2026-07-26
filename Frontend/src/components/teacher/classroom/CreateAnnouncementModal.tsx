import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Space, Typography } from "antd";
import { NotificationOutlined, CheckCircleOutlined } from "@ant-design/icons";
import announcementApi from "../../../api/announcementApi";
import type { IAnnouncement } from "../../../api/announcementApi";
import { toast } from "../../../utils/toast";

const { Text } = Typography;

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  initialData?: IAnnouncement | null;
  onSaved?: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = React.memo(
  ({ open, onClose, classId, initialData, onSaved }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const isEditing = !!initialData?._id;

    useEffect(() => {
      if (open) {
        if (initialData) {
          form.setFieldsValue({
            title: initialData.title || "",
            content: initialData.content || "",
          });
        } else {
          form.resetFields();
        }
      }
    }, [open, initialData, form]);

    const handleSubmit = async (values: any) => {
      if (!classId && !isEditing) return;
      setSubmitting(true);

      try {
        if (isEditing && initialData) {
          await announcementApi.updateAnnouncement(initialData._id, {
            title: values.title.trim(),
            content: values.content.trim(),
          });
          toast.success("Cập nhật thông báo lớp học thành công!");
        } else {
          await announcementApi.createAnnouncement({
            title: values.title.trim(),
            content: values.content.trim(),
            classId,
            scope: "Class",
          });
          toast.success("Đăng thông báo mới cho lớp thành công!");
        }

        onClose();
        if (onSaved) onSaved();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi lưu thông báo!");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal
        title={
          <Space align="center">
            <NotificationOutlined style={{ color: "#1890ff" }} />
            <span>{isEditing ? "Chỉnh sửa thông báo lớp học" : "Đăng thông báo mới cho lớp học"}</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit} style={{ marginTop: 16 }}>
          <Form.Item
            name="title"
            label="Tiêu đề thông báo"
            rules={[{ required: true, message: "Vui lòng nhập tiêu đề thông báo!" }]}
          >
            <Input placeholder="Ví dụ: Thông báo đổi lịch học tuần tới / Nhắc nhở nộp bài tập" maxLength={150} />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung chi tiết thông báo"
            rules={[{ required: true, message: "Vui lòng nhập nội dung thông báo!" }]}
          >
            <Input.TextArea rows={5} placeholder="Soạn nội dung thông báo gửi đến toàn thể học sinh trong lớp..." />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<CheckCircleOutlined />}>
              {isEditing ? "Lưu thay đổi" : "Đăng thông báo"}
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
);

CreateAnnouncementModal.displayName = "CreateAnnouncementModal";
