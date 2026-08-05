import React from "react";
import { Card, Tag, Avatar, Typography, Space, Tooltip, Button } from "antd";
import {
  ClockCircleOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import AssignmentStatusTag from "./AssignmentStatusTag";
import type { IExtendedAssignment } from "../../../../../types/studentAssignment";

const { Text, Paragraph } = Typography;

interface AssignmentCardProps {
  item: IExtendedAssignment;
  onDetail: (item: IExtendedAssignment) => void;
  onSubmit: (item: IExtendedAssignment) => void;
  onFeedback: (item: IExtendedAssignment) => void;
  onCancelSubmission: (assignmentId: string) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = React.memo(
  ({ item, onDetail, onSubmit, onFeedback, onCancelSubmission }) => {
    const formattedDeadline = item.deadline
      ? new Date(item.deadline).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Không giới hạn";

    const teacherName =
      typeof item.teacherId === "object" && (item.teacherId as any)?.fullName
        ? (item.teacherId as any).fullName
        : typeof item.teacherId === "object" && (item.teacherId as any)?.username
        ? (item.teacherId as any).username
        : "Giảng viên";

    // Xử lý trạng thái mới theo đặc tả
    // Dữ liệu bài nộp
    const submission = item.submission;
    
    // Trạng thái
    const isDraft = submission?.status === "draft";
    const isSubmitted = item.status === "Submitted" || item.status === "Late" || item.status === "Graded";
    const isGraded = item.status === "Graded" && submission?.grade !== null && submission?.grade !== undefined;
    
    // Hiển thị Deadline
    let deadlineBadgeColor = "green";
    let deadlineBadgeText = "Còn hạn nộp";
    if (item.isOverdue) {
      deadlineBadgeColor = "red";
      deadlineBadgeText = "Quá hạn nộp";
    } else if (item.hoursRemaining !== undefined && item.hoursRemaining < 24) {
      deadlineBadgeColor = "orange";
      deadlineBadgeText = `Còn ${item.hoursRemaining} giờ`;
    }
    
    let badgeText = "Chưa nộp";
    let badgeColor = "default";
    let badgeIcon = <ClockCircleOutlined />;

    if (isGraded) {
      badgeText = `Đã chấm · ${submission?.grade}`;
      badgeColor = "purple";
      badgeIcon = <TrophyOutlined />;
    } else if (isSubmitted) {
      badgeText = "Đã nộp";
      badgeColor = "success";
      badgeIcon = <CheckCircleOutlined />;
    } else if (isDraft) {
      badgeText = "Đang làm dở";
      badgeColor = "processing";
      badgeIcon = <ClockCircleOutlined />;
    } else if (item.isOverdue) {
      badgeText = "Quá hạn chưa nộp";
      badgeColor = "error";
      badgeIcon = <InfoCircleOutlined />;
    }

    let btnText = "";
    let btnIcon = null;
    let btnType: "primary" | "default" = "primary";
    let btnAction = () => {};

    if (isGraded) {
      btnText = "Xem kết quả";
      btnIcon = <TrophyOutlined />;
      btnType = "primary";
      btnAction = () => onDetail(item);
    } else if (isSubmitted) {
      btnText = "Xem bài làm của tôi";
      btnIcon = <EyeOutlined />;
      btnType = "default";
      btnAction = () => onDetail(item);
    } else if (isDraft && !item.isOverdue) {
      btnText = "Tiếp tục làm bài";
      btnIcon = <UploadOutlined />;
      btnType = "primary";
      btnAction = () => onSubmit(item);
    } else if (!isDraft && !item.isOverdue) {
      btnText = "Nộp bài";
      btnIcon = <UploadOutlined />;
      btnType = "primary";
      btnAction = () => onSubmit(item);
    } else {
      btnText = "Xem chi tiết";
      btnIcon = <InfoCircleOutlined />;
      btnType = "default";
      btnAction = () => onDetail(item);
    }

    return (
      <Card
        hoverable
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--color-border-default)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "var(--transition-fast)",
        }}
        styles={{
          body: {
            padding: 20,
            display: "flex",
            flexDirection: "column",
            flex: 1,
          },
        }}
      >
        {/* Top Header: Status Tag, Mode Tag & Deadline Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 4,
          }}
        >
          <Space size={4}>
            <Tag color={badgeColor} icon={badgeIcon} style={{ borderRadius: 8, fontWeight: 600 }}>
              {badgeText}
            </Tag>
            {item.submissionMode === "link" && <Tag color="cyan">🔗 Link</Tag>}
            {item.submissionMode === "direct" && <Tag color="orange">✍️ Trực tiếp</Tag>}
            {item.submissionMode === "any" && <Tag color="green">🎯 Tự chọn</Tag>}
          </Space>
          <Tag color={deadlineBadgeColor} style={{ borderRadius: 6, margin: 0, fontWeight: 600 }}>
            {deadlineBadgeText}
          </Tag>
        </div>

        {/* Assignment Title */}
        <Tooltip title={item.title}>
          <Text
            strong
            style={{
              fontSize: 16,
              color: "var(--color-text-title)",
              lineHeight: 1.4,
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </Text>
        </Tooltip>

        {/* Short Description */}
        <Paragraph
          type="secondary"
          style={{
            fontSize: 12,
            margin: "0 0 12px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 36,
          }}
        >
          {item.description || "Không có mô tả chi tiết cho bài tập này."}
        </Paragraph>

        {/* Attachments & Deadline Details */}
        <div
          style={{
            backgroundColor: "var(--color-bg-page)",
            borderRadius: 8,
            padding: "8px 12px",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
              marginBottom: 4,
            }}
          >
            <Text type="secondary">
              <ClockCircleOutlined style={{ marginRight: 4 }} /> Hạn nộp:
            </Text>
            <Text strong style={{ color: item.isOverdue ? "var(--color-error-text)" : "var(--color-text-title)" }}>
              {formattedDeadline}
            </Text>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 12,
            }}
          >
            <Text type="secondary">
              <PaperClipOutlined style={{ marginRight: 4 }} /> File đính kèm:
            </Text>
            <Text strong>{item.attachments?.length || 0} file</Text>
          </div>
        </div>

        {/* Grade Badge if Graded */}
        {isGraded && (
          <div
            style={{
              backgroundColor: "var(--color-secondary-bg)",
              border: "1px solid var(--color-secondary-border)",
              borderRadius: 8,
              padding: "6px 12px",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "var(--color-secondary-active)", fontWeight: 600 }}>
              <TrophyOutlined style={{ marginRight: 6 }} /> Điểm số đạt được:
            </Text>
            <Tag
              color="purple"
              style={{ borderRadius: 6, fontWeight: 700, fontSize: 13, margin: 0 }}
            >
              {item.submission?.grade} / 10
            </Tag>
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          {/* Teacher Info */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              paddingTop: 10,
              borderTop: "1px dashed var(--color-border-default)",
              marginBottom: 12,
            }}
          >
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
              {teacherName}
            </Text>
          </div>

          {/* Action Buttons */}
          <Space size={6} style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              type={btnType}
              size="small"
              icon={btnIcon}
              onClick={btnAction}
              style={{ borderRadius: 6, fontSize: 12, ...(btnType === "primary" && isGraded ? { backgroundColor: "var(--color-secondary-icon)" } : {}) }}
            >
              {btnText}
            </Button>
          </Space>
        </div>
      </Card>
    );
  }
);

AssignmentCard.displayName = "AssignmentCard";

export default AssignmentCard;
