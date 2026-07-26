import React from "react";
import { Modal, Typography, Space, Alert } from "antd";
import { PlayCircleOutlined, VideoCameraOutlined, UserOutlined } from "@ant-design/icons";
import type { IExtendedLiveSession } from "../../../types/studentLive";

const { Text, Title } = Typography;

interface JoinClassModalProps {
  open: boolean;
  session: IExtendedLiveSession | null;
  onClose: () => void;
  onConfirm: () => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = React.memo(
  ({ open, session, onClose, onConfirm }) => {
    if (!session) return null;

    return (
      <Modal
        open={open}
        onCancel={onClose}
        onOk={onConfirm}
        okText="Tham gia ngay"
        cancelText="Hủy bỏ"
        okButtonProps={{ style: { borderRadius: 8, backgroundColor: "#52c41a" } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        title={
          <Space align="center">
            <VideoCameraOutlined style={{ color: "#52c41a", fontSize: 22 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Xác nhận gia nhập lớp học</span>
          </Space>
        }
        centered
        width={480}
      >
        <div style={{ padding: "12px 0" }}>
          <Title level={5} style={{ margin: "0 0 8px 0", color: "#1f2937" }}>
            {session.title}
          </Title>

          <Space size={16} style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <UserOutlined style={{ marginRight: 4 }} /> Giảng viên: <strong>{session.teacherName || "Giảng viên"}</strong>
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Nền tảng: <strong>{session.platform || "Jitsi Meet"}</strong>
            </Text>
          </Space>

          <Alert
            message="Lưu ý khi tham gia lớp học trực tuyến"
            description="Vui lòng cho phép trình duyệt truy cập micro và webcam khi được yêu cầu để tương tác với giảng viên và lớp học."
            type="info"
            showIcon
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>
    );
  }
);

JoinClassModal.displayName = "JoinClassModal";

export default JoinClassModal;
