import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Space } from "antd";
import { NotificationOutlined, CheckCircleOutlined } from "@ant-design/icons";
import announcementApi from "../../../api/announcementApi";
import { toast } from "../../../utils/toast";

interface CreateAnnouncementModalProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  onSaved?: () => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = React.memo(
  ({ open, onClose, classId, onSaved }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
      if (open) {
        form.resetFields();
      }
    }, [open, form]);

    const handleSubmit = async (values: any) => {
      if (!classId) return;
      const titleTrimmed = values.title?.trim();
      const contentTrimmed = values.content?.trim();

      if (!titleTrimmed || !contentTrimmed) {
        toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo!");
        return;
      }

      setSubmitting(true);

      try {
        await announcementApi.createAnnouncement({
          title: titleTrimmed,
          content: contentTrimmed,
          classId,
          scope: "Class",
        });
        toast.success("Đăng thông báo mới cho lớp thành công!");

        onClose();
        if (onSaved) onSaved();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi đăng thông báo!");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal
        title={
          <Space align="center">
            <NotificationOutlined style={{ color: "#1890ff" }} />
            <span>Đăng thông báo mới cho lớp học</span>
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
            <Input
              placeholder="Ví dụ: Thông báo đổi lịch học tuần tới / Nhắc nhở nộp bài tập"
              maxLength={150}
            />
          </Form.Item>

          <Form.Item
            name="content"
            label="Nội dung chi tiết thông báo"
            rules={[{ required: true, message: "Vui lòng nhập nội dung thông báo!" }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="Soạn nội dung thông báo gửi đến toàn thể học sinh trong lớp..."
            />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<CheckCircleOutlined />}
            >
              Đăng thông báo
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
);

CreateAnnouncementModal.displayName = "CreateAnnouncementModal";
