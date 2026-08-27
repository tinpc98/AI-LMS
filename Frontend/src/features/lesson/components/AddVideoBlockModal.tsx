import React, { useState } from "react";
import { Modal, Form, Input, InputNumber, Alert } from "antd";
import { parseYouTubeUrl } from "../../../shared/utils/youtube";
import type { LessonVideoBlockData } from "../lesson.types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (video: LessonVideoBlockData) => void;
}

// TÍNH NĂNG MỚI (mục 1): MVP chỉ hỗ trợ nhúng YouTube (unlisted) — không tự host video, không
// gọi oEmbed API để tự lấy thời lượng nên giáo viên phải tự nhập (theo đúng đặc tả mục 1.3).
export const AddVideoBlockModal: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [form] = Form.useForm();
  const [urlError, setUrlError] = useState<string | null>(null);

  const handleFinish = (values: { url: string; title?: string; durationSeconds: number }) => {
    const parsed = parseYouTubeUrl(values.url);
    if (!parsed) {
      setUrlError("Đường dẫn không phải link YouTube hợp lệ (youtube.com hoặc youtu.be).");
      return;
    }
    setUrlError(null);
    onSubmit({
      platform: "YOUTUBE",
      externalId: parsed.videoId,
      url: values.url.trim(),
      title: values.title?.trim(),
      durationSeconds: values.durationSeconds,
    });
    form.resetFields();
  };

  return (
    <Modal
      title="Thêm block Video (YouTube)"
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={() => form.submit()}
      okText="Thêm"
      cancelText="Hủy"
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="url"
          label="Link YouTube (unlisted/public)"
          rules={[{ required: true, message: "Vui lòng nhập link YouTube!" }]}
        >
          <Input placeholder="https://www.youtube.com/watch?v=..." />
        </Form.Item>
        {urlError && (
          <Alert type="error" showIcon message={urlError} style={{ marginBottom: 16 }} />
        )}

        <Form.Item name="title" label="Tiêu đề video (tùy chọn)">
          <Input placeholder="VD: Bài giảng lý thuyết Đạo hàm" />
        </Form.Item>

        <Form.Item
          name="durationSeconds"
          label="Thời lượng video (giây)"
          rules={[{ required: true, message: "Vui lòng nhập thời lượng!" }]}
          extra="Dùng để tính % học sinh đã xem — nhập đúng thời lượng thật của video."
        >
          <InputNumber min={1} style={{ width: "100%" }} placeholder="VD: 600 (10 phút)" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddVideoBlockModal;
