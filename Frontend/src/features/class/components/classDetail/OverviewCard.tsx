import React from "react";
import { Card, Descriptions, Tag, Button, Typography, Space } from "antd";
import {
  InfoCircleOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import ClassStatusTag from "../classes/ClassStatusTag";
import type { StudentClassStatus } from "../../../../types/studentClass";
import { formatLearningMode } from "../../../../shared/utils/labelFormatters";
import { formatSchedule } from "../../../learning/utils/learningDashboard.utils";

const { Paragraph, Text } = Typography;

interface OverviewCardProps {
  className: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  currentStudents?: number;
  maxStudents?: number;
  status?: StudentClassStatus;
  learningMode?: string;
  schedule?: {
    days?: string[];
    startTime?: string;
    endTime?: string;
  } | null;
  googleCalendarEventId?: string;
}

export const OverviewCard: React.FC<OverviewCardProps> = React.memo(
  ({
    className,
    description,
    startDate,
    endDate,
    currentStudents = 0,
    maxStudents = 40,
    status = "Active",
    learningMode = "Offline",
    schedule,
    googleCalendarEventId,
  }) => {
    const formattedStartDate = startDate
      ? new Date(startDate).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Chưa cập nhật";

    const formattedEndDate = endDate
      ? new Date(endDate).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Chưa cập nhật";

    return (
      <Card
        title={
          <Space align="center">
            <InfoCircleOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Thông tin tổng quan lớp học</span>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: 24 } }}
      >
        {/* Class Description */}
        <div style={{ marginBottom: 20 }}>
          <Text
            strong
            style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 6 }}
          >
            Mô tả lớp học:
          </Text>
          <Paragraph type="secondary" style={{ fontSize: 13, lineHeight: 1.6, margin: 0 }}>
            {description || "Chưa có thông tin mô tả chi tiết cho lớp học này."}
          </Paragraph>
        </div>

        {/* Descriptions Grid */}
        <Descriptions
          bordered
          column={{ xs: 1, sm: 2, md: 2 }}
          size="middle"
          styles={{
            label: { backgroundColor: "var(--color-bg-page)", fontWeight: 600, width: "35%" },
          }}
        >
          <Descriptions.Item label="Trạng thái lớp">
            <ClassStatusTag status={status} />
          </Descriptions.Item>

          <Descriptions.Item label="Hình thức học">
            <Tag color="cyan">{formatLearningMode(learningMode)}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Lịch học định kỳ" span={2}>
            <Space size={6}>
              <ClockCircleOutlined style={{ color: "var(--color-text-description)" }} />
              <span>{formatSchedule(schedule)}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày bắt đầu">
            <Space size={6}>
              <CalendarOutlined style={{ color: "var(--color-text-description)" }} />
              <span style={{ whiteSpace: "nowrap" }}>{formattedStartDate}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Ngày kết thúc">
            <Space size={6}>
              <CalendarOutlined style={{ color: "var(--color-text-description)" }} />
              <span style={{ whiteSpace: "nowrap" }}>{formattedEndDate}</span>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Sĩ số lớp học" span={2}>
            <Space size={6}>
              <TeamOutlined style={{ color: "var(--color-text-description)" }} />
              <span style={{ whiteSpace: "nowrap" }}>
                {currentStudents} / {maxStudents} học viên
              </span>
            </Space>
          </Descriptions.Item>
        </Descriptions>

        {/* Calendar Integration */}
        {googleCalendarEventId && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--color-border-default)" }}>
            <Text
              strong
              style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 12 }}
            >
              Lịch & Đồng bộ:
            </Text>
            <Space size={12} wrap>
              <Button
                type="default"
                icon={<CalendarOutlined style={{ color: "var(--color-action-primary-bg)" }} />}
                style={{ borderRadius: 8 }}
              >
                Đồng bộ Google Calendar
              </Button>
            </Space>
          </div>
        )}
      </Card>
    );
  }
);

OverviewCard.displayName = "OverviewCard";

export default OverviewCard;
