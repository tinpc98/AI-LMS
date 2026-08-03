import React from "react";
import { Drawer, Avatar, Tag, Typography, Space, Card, Divider } from "antd";
import {
  NotificationOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import type { IAnnouncement } from "../../../../api/announcementApi";

const { Text, Title, Paragraph } = Typography;

interface TeacherAnnouncementDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  announcement: IAnnouncement | null;
  className?: string;
}

export const TeacherAnnouncementDetailDrawer: React.FC<TeacherAnnouncementDetailDrawerProps> =
  React.memo(({ open, onClose, announcement, className = "Lớp học" }) => {
    const creatorObj = typeof announcement?.createdBy === "object" ? announcement.createdBy : null;
    const creatorName = creatorObj?.fullName || "Giáo viên";
    const creatorEmail = creatorObj?.email || "";

    return (
      <Drawer
        title={
          <Space>
            <NotificationOutlined style={{ color: "var(--color-action-primary-bg)" }} />
            <span>Chi tiết thông báo - {className}</span>
          </Space>
        }
        placement="right"
        width={560}
        onClose={onClose}
        open={open}
        styles={{ body: { padding: 24 } }}
      >
        {announcement ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Header Info */}
            <div>
              <Title
                level={4}
                style={{ margin: 0, marginBottom: 8, color: "var(--color-text-title)", fontWeight: 700 }}
              >
                {announcement.title}
              </Title>

              <Space size={12} align="center" style={{ marginTop: 4 }}>
                <Avatar
                  src={creatorObj?.avatar || undefined}
                  icon={!creatorObj?.avatar ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: "var(--color-action-primary-bg)" }}
                />
                <div>
                  <Text strong style={{ fontSize: 14, display: "block" }}>
                    {creatorName}
                  </Text>
                  {creatorEmail && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {creatorEmail}
                    </Text>
                  )}
                </div>
              </Space>
            </div>

            <Divider style={{ margin: "8px 0" }} />

            {/* Time & Scope Badges */}
            <Space size={12} wrap>
              {announcement.createdAt && (
                <Tag icon={<ClockCircleOutlined />} color="blue">
                  Đăng lúc: {new Date(announcement.createdAt).toLocaleString("vi-VN")}
                </Tag>
              )}
              {announcement.updatedAt && announcement.updatedAt !== announcement.createdAt && (
                <Tag color="cyan">
                  Cập nhật: {new Date(announcement.updatedAt).toLocaleString("vi-VN")}
                </Tag>
              )}
            </Space>

            {/* Content Box */}
            <Card
              style={{ backgroundColor: "var(--color-bg-page)", borderRadius: 8, marginTop: 8 }}
              styles={{ body: { padding: 16 } }}
            >
              <Paragraph
                style={{
                  fontSize: 15,
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  margin: 0,
                  color: "var(--color-text-title)",
                }}
              >
                {announcement.content}
              </Paragraph>
            </Card>

            {/* Attachments */}
            {announcement.attachments && announcement.attachments.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <Text
                  strong
                  style={{ fontSize: 13, color: "var(--color-text-description)", display: "block", marginBottom: 8 }}
                >
                  📎 TỆP ĐÍNH KÈM ({announcement.attachments.length}):
                </Text>
                <Space wrap size={8}>
                  {announcement.attachments.map((att, idx) => (
                    <a
                      key={att.publicId || idx}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 12px",
                        backgroundColor: "var(--color-bg-primary-tint)",
                        border: "1px solid var(--color-border-primary-tint)",
                        borderRadius: 6,
                        fontSize: 13,
                      }}
                    >
                      <PaperClipOutlined /> {att.name || `Tệp ${idx + 1}`}
                    </a>
                  ))}
                </Space>
              </div>
            )}
          </div>
        ) : null}
      </Drawer>
    );
  });

TeacherAnnouncementDetailDrawer.displayName = "TeacherAnnouncementDetailDrawer";
