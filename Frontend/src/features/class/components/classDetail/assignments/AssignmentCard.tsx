import React from "react";
import { Card, Tag, Avatar, Typography, Space, Tooltip, Button } from "antd";
import {
  ClockCircleOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  TrophyOutlined,
  UserOutlined,
  PaperClipOutlined,
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

    const hasSubmitted =
      item.status === "Submitted" || item.status === "Late" || item.status === "Graded";
    const isGraded =
      item.status === "Graded" &&
      item.submission?.grade !== null &&
      item.submission?.grade !== undefined;

    // Deadline badge indicator
    let deadlineBadgeColor = "green";
    let deadlineBadgeText = "Còn hạn nộp";
    if (item.isOverdue) {
      deadlineBadgeColor = "red";
      deadlineBadgeText = "Quá hạn nộp";
    } else if (item.hoursRemaining !== undefined && item.hoursRemaining < 24) {
      deadlineBadgeColor = "orange";
      deadlineBadgeText = `Còn ${item.hoursRemaining} giờ`;
    }

    const teacherName =
      typeof item.teacherId === "object" && (item.teacherId as any)?.fullName
        ? (item.teacherId as any).fullName
        : "Giảng viên";

    return (
      <Card
        hoverable
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "all 0.3s ease",
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
        {/* Top Header: Status Tag & Deadline Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <AssignmentStatusTag status={item.status} />
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
              color: "#1f2937",
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
            backgroundColor: "#fafafa",
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
            <Text strong style={{ color: item.isOverdue ? "#cf1322" : "#1f2937" }}>
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
              backgroundColor: "#f9f0ff",
              border: "1px solid #d3ade6",
              borderRadius: 8,
              padding: "6px 12px",
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 12, color: "#531dab", fontWeight: 600 }}>
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
              borderTop: "1px dashed #f0f0f0",
              marginBottom: 12,
            }}
          >
            <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
            <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
              {teacherName}
            </Text>
          </div>

          {/* Action Buttons */}
          <Space size={6} style={{ width: "100%", justifyContent: "space-between" }}>
            <Button
              type="default"
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => onDetail(item)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Chi tiết
            </Button>

            {isGraded ? (
              <Button
                type="primary"
                size="small"
                icon={<TrophyOutlined />}
                onClick={() => onFeedback(item)}
                style={{ borderRadius: 6, fontSize: 12, backgroundColor: "#722ed1" }}
              >
                Xem điểm
              </Button>
            ) : (
              <Button
                type={hasSubmitted ? "default" : "primary"}
                size="small"
                icon={<UploadOutlined />}
                onClick={() => onSubmit(item)}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                {hasSubmitted ? "Cập nhật bài" : "Nộp bài"}
              </Button>
            )}
          </Space>
        </div>
      </Card>
    );
  }
);

AssignmentCard.displayName = "AssignmentCard";

export default AssignmentCard;
