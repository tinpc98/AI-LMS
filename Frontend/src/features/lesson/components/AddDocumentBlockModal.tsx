import React, { useState } from "react";
import { Modal, Upload, Button, Typography, Alert } from "antd";
import { UploadOutlined, FileTextOutlined } from "@ant-design/icons";
import { lessonApi } from "../../../api/lessonApi";
import type { LessonDocumentBlockData } from "../lesson.types";

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (document: LessonDocumentBlockData) => void;
}

// TÍNH NĂNG MỚI (mục 1): upload tài liệu (PDF/DOCX/PPTX/XLSX/ảnh, ≤50MB) qua
// POST /lessons/upload-document rồi gắn publicId trả về vào block DOCUMENT.
export const AddDocumentBlockModal: React.FC<Props> = ({ open, onClose, onSubmit }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    setError(null);
    try {
      const res = await lessonApi.uploadDocument(file as File);
      onSuccess?.(res.data);
      onSubmit(res.data.document);
    } catch (err: any) {
      const message = err?.response?.data?.message || "Tải lên tài liệu thất bại.";
      setError(message);
      onError?.(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal title="Thêm block Tài liệu" open={open} onCancel={onClose} footer={null} destroyOnClose>
      <Text type="secondary" style={{ display: "block", marginBottom: 16, fontSize: 13 }}>
        Chấp nhận PDF, DOCX, PPTX, XLSX, ảnh — tối đa 50MB.
      </Text>

      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}

      <Upload.Dragger
        customRequest={handleUpload}
        showUploadList={false}
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
        disabled={uploading}
      >
        <p className="ant-upload-drag-icon">
          <FileTextOutlined style={{ fontSize: 32, color: "var(--color-action-primary-bg)" }} />
        </p>
        <p className="ant-upload-text">Kéo thả file vào đây, hoặc bấm để chọn file</p>
        <Button icon={<UploadOutlined />} loading={uploading} style={{ marginTop: 8 }}>
          {uploading ? "Đang tải lên..." : "Chọn file"}
        </Button>
      </Upload.Dragger>
    </Modal>
  );
};

export default AddDocumentBlockModal;
