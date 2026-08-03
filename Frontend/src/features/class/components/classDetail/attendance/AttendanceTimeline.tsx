import React from "react";
import { Timeline, Card, Typography, Space } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import AttendanceStatusTag from "./AttendanceStatusTag";
import type { IExtendedAttendanceRecord } from "../../../../../types/studentAttendance";

const { Text, Paragraph } = Typography;

interface AttendanceTimelineProps {
  records: IExtendedAttendanceRecord[];
  onDetail: (item: IExtendedAttendanceRecord) => void;
}

export const AttendanceTimeline: React.FC<AttendanceTimelineProps> = React.memo(
  ({ records, onDetail }) => {
    const getTimelineDot = (status: string) => {
      switch (status) {
        case "Present":
          return <CheckCircleOutlined style={{ fontSize: 16, color: "var(--color-success-base)" }} />;
        case "Late":
          return <ClockCircleOutlined style={{ fontSize: 16, color: "var(--color-warning-base)" }} />;
        case "Absent":
          return <CloseCircleOutlined style={{ fontSize: 16, color: "var(--color-error-base)" }} />;
        case "Excused":
        default:
          return <InfoCircleOutlined style={{ fontSize: 16, color: "var(--color-action-primary-bg)" }} />;
      }
    };

    return (
      <Card
        title={
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            Dòng thời gian chuyên cần qua các buổi học
          </span>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          border: "1px solid var(--color-border-default)",
        }}
      >
        <div style={{ padding: "16px 8px" }}>
          <Timeline
            mode="left"
            items={records.map((rec) => {
              const dateStr = rec.date
                ? new Date(rec.date).toLocaleDateString("vi-VN", {
                    weekday: "short",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "Ngày học";

              return {
                dot: getTimelineDot(rec.status),
                children: (
                  <Card
                    size="small"
                    hoverable
                    onClick={() => onDetail(rec)}
                    style={{
                      borderRadius: 12,
                      marginBottom: 12,
                      backgroundColor: "var(--color-bg-page)",
                      border: "1px solid var(--color-border-default)",
                      transition: "var(--transition-fast)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <Space size={8}>
                        <Text strong style={{ fontSize: 14, color: "var(--color-text-title)" }}>
                          {dateStr}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({rec.sessionTime || "08:00 - 10:30"})
                        </Text>
                      </Space>

                      <AttendanceStatusTag status={rec.status} />
                    </div>

                    <Text
                      type="secondary"
                      style={{ fontSize: 12, display: "block", marginBottom: rec.note ? 4 : 0 }}
                    >
                      {rec.sessionTitle} • GV: {rec.teacherName}
                    </Text>

                    {rec.note && (
                      <Paragraph
                        type="secondary"
                        style={{
                          fontSize: 12,
                          margin: 0,
                          backgroundColor: "var(--color-surface)",
                          padding: "4px 8px",
                          borderRadius: 6,
                          border: "1px dashed var(--color-border-default)",
                        }}
                      >
                        💬 Ghi chú GV: {rec.note}
                      </Paragraph>
                    )}
                  </Card>
                ),
              };
            })}
          />
        </div>
      </Card>
    );
  }
);

AttendanceTimeline.displayName = "AttendanceTimeline";

export default AttendanceTimeline;
