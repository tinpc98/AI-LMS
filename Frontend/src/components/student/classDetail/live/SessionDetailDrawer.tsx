import React from "react";
import { Drawer, Button, Typography, Space, Descriptions, Tag } from "antd";
import {
  VideoCameraOutlined,
  ClockCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import SessionStatusTag from "./SessionStatusTag";
import type { IExtendedLiveSession } from "../../../types/studentLive";

const { Text, Title, Paragraph } = Typography;

interface SessionDetailDrawerProps {
  open: boolean;
  session: IExtendedLiveSession | null;
  onClose: () => void;
  onJoin?: (session: IExtendedLiveSession) => void;
}

export const SessionDetailDrawer: React.FC<SessionDetailDrawerProps> = React.memo(
  ({ open, session, onClose, onJoin }) => {
    if (!session) return null;

    const formattedStart = session.scheduledStart
      ? new Date(session.scheduledStart).toLocaleString("vi-VN")
      : "Chưa xác định";

    const isLive = session.status === "Live";

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <VideoCameraOutlined style={{ color: "#1890ff", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                Chi tiết phòng học trực tuyến
              </Title>
              <Space size={6} style={{ marginTop: 2 }}>
                <SessionStatusTag status={session.status} />
              </Space>
            </div>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Đóng
            </Button>
            {isLive && onJoin && (
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  onClose();
                  onJoin(session);
                }}
                style={{ borderRadius: 8, backgroundColor: "#52c41a" }}
              >
                Vào lớp ngay
              </Button>
            )}
          </Space>
        }
        width={560}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          {/* Room Specs Descriptions */}
          <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { width: "35%", fontWeight: 600, backgroundColor: "#fafafa" } }}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Tên buổi học">{session.title}</Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <SessionStatusTag status={session.status} />
            </Descriptions.Item>

            <Descriptions.Item label="Nền tảng phòng học">
              <Tag color="blue" icon={<GlobalOutlined />}>
                {session.platform || "Jitsi Meet"}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Mã phòng (Room ID)">
              <Text code>{session.meetingRoomId || "live-room"}</Text>
            </Descriptions.Item>

            <Descriptions.Item label="Giảng viên phụ trách">
              <Space size={6}>
                <UserOutlined style={{ color: "#1890ff" }} />
                <span>{session.teacherName || "Giảng viên môn học"}</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian bắt đầu">{formattedStart}</Descriptions.Item>
          </Descriptions>

          <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Hệ thống hỗ trợ tính năng học trực tuyến qua video & chat real-time, cho phép sinh viên học tập và trao đổi trực tiếp với giảng viên.
          </Paragraph>
        </div>
      </Drawer>
    );
  }
);

SessionDetailDrawer.displayName = "SessionDetailDrawer";

export default SessionDetailDrawer;
