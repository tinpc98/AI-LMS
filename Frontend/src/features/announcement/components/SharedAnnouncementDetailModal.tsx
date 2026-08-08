import React from "react";
import { Modal, Button, Typography, Space, Avatar, Divider, Tag, Card } from "antd";
import {
  NotificationOutlined,
  ClockCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  PushpinOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import type { IAnnouncement } from "../../../api/announcementApi";
import type { IExtendedAnnouncement } from "../../../types/studentAnnouncement";

const { Text, Paragraph, Title } = Typography;

interface SharedAnnouncementDetailModalProps {
  open: boolean;
  item: IExtendedAnnouncement | IAnnouncement | null;
  onClose: () => void;
  className?: string; // Tên lớp học, nếu có
  extraActions?: React.ReactNode; // Dành cho nút Edit/Delete của giáo viên
}

export const SharedAnnouncementDetailModal: React.FC<SharedAnnouncementDetailModalProps> = React.memo(
  ({ open, item, onClose, className, extraActions }) => {
    if (!item) return null;

    // Lấy thông tin người tạo (Hỗ trợ cả object từ backend và authorName từ hook của student)
    const creatorObj = typeof item.createdBy === "object" ? item.createdBy : null;
    const authorName = (item as IExtendedAnnouncement).authorName || creatorObj?.fullName || "Giảng viên";
    const authorAvatar = (item as IExtendedAnnouncement).authorAvatar || creatorObj?.avatar;
    const authorEmail = creatorObj?.email || "";

    const isPinned = (item as IExtendedAnnouncement).isPinned || false;

    const formattedCreatedAt = item.createdAt
      ? new Date(item.createdAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Vừa đăng";

    const formattedUpdatedAt = item.updatedAt
      ? new Date(item.updatedAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <Modal
        open={open}
        onCancel={onClose}
        width={750}
        style={{ maxWidth: "90vw", top: 40 }}
        footer={null} // Bỏ footer mặc định, dùng footer tự chế bên dưới để gộp nút
        destroyOnClose
        closeIcon={false} // Ẩn nút X ở trên cùng để tránh trùng lặp với nút Đóng ở dưới
        title={
          <Space align="center">
            <NotificationOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "var(--color-text-title)" }}>
                Chi tiết thông báo {className ? `- ${className}` : ""}
              </Title>
            </div>
          </Space>
        }
      >
        <div style={{ padding: "8px 0" }}>
          {/* Author & Header Meta */}
          <div
            style={{
              backgroundColor: "var(--color-bg-page)",
              border: "1px solid var(--color-border-default)",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Space size={12} align="center">
              <Avatar src={authorAvatar} icon={!authorAvatar ? <UserOutlined /> : undefined} style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
              <div>
                <Text strong style={{ fontSize: 14, color: "var(--color-text-title)", display: "block" }}>
                  {authorName}
                </Text>
                <Space size={16} wrap style={{ marginTop: 2 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} /> Đăng lúc: {formattedCreatedAt}
                  </Text>
                  {authorEmail && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {authorEmail}
                    </Text>
                  )}
                </Space>
              </div>
            </Space>

            <Space size={8}>
              {isPinned && (
                <Tag color="gold" icon={<PushpinOutlined />}>
                  Đã ghim
                </Tag>
              )}
              <Tag color="blue" icon={<GlobalOutlined />}>
                Phạm vi: {item.scope || "Lớp học"}
              </Tag>
            </Space>
          </div>

          {/* Title */}
          <Title level={4} style={{ margin: "0 0 16px 0", color: "var(--color-text-title)", lineHeight: 1.4, fontWeight: 700 }}>
            {item.title}
          </Title>

          {/* Content */}
          <Card
            style={{ backgroundColor: "var(--color-bg-page)", borderRadius: 12, border: "1px solid var(--color-border-default)" }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Paragraph
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                whiteSpace: "pre-wrap",
                margin: 0,
                color: "var(--color-text-title)",
              }}
            >
              {item.content}
            </Paragraph>
          </Card>

          {/* Attachments List */}
          {item.attachments && item.attachments.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Text
                strong
                style={{ fontSize: 13, color: "var(--color-text-description)", display: "block", marginBottom: 12 }}
              >
                📎 TỆP ĐÍNH KÈM ({item.attachments.length}):
              </Text>
              <Space wrap size={12}>
                {item.attachments.map((att, idx) => (
                  <a
                    key={att.publicId || idx}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 16px",
                      backgroundColor: "var(--color-surface)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: 8,
                      fontSize: 13,
                      color: "var(--color-action-primary-base)",
                      fontWeight: 500,
                      transition: "all 0.2s",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-action-primary-base)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--color-border-default)";
                    }}
                  >
                    <PaperClipOutlined /> {att.name || `Tệp đính kèm ${idx + 1}`}
                  </a>
                ))}
              </Space>
            </div>
          )}

          <Divider style={{ margin: "24px 0" }} />

          {/* Footer actions and meta */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              {formattedUpdatedAt && formattedUpdatedAt !== formattedCreatedAt && (
                <Text type="secondary" style={{ fontSize: 11, fontStyle: "italic", display: "block" }}>
                  Cập nhật lần cuối: {formattedUpdatedAt}
                </Text>
              )}
            </div>
            
            <Space>
              {extraActions}
              <Button type="primary" onClick={onClose} style={{ borderRadius: 8, padding: "0 24px" }}>
                Đóng
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    );
  }
);

SharedAnnouncementDetailModal.displayName = "SharedAnnouncementDetailModal";

export default SharedAnnouncementDetailModal;
