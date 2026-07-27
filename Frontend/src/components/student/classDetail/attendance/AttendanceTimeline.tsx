import React from "react";
import { Timeline, Card, Typography, Space, Button } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import AttendanceStatusTag from "./AttendanceStatusTag";
import type { IExtendedAttendanceRecord } from "../../../../types/studentAttendance";

const { Text, Title, Paragraph } = Typography;

interface AttendanceTimelineProps {
  records: IExtendedAttendanceRecord[];
  onDetail: (item: IExtendedAttendanceRecord) => void;
}

export const AttendanceTimeline: React.FC<AttendanceTimelineProps> = React.memo(({ records, onDetail }) => {
  const getTimelineDot = (status: string) => {
    switch (status) {
      case "Present":
        return <CheckCircleOutlined style={{ fontSize: 16, color: "#52c41a" }} />;
      case "Late":
        return <ClockCircleOutlined style={{ fontSize: 16, color: "#faad14" }} />;
      case "Absent":
        return <CloseCircleOutlined style={{ fontSize: 16, color: "#ff4d4f" }} />;
      case "Excused":
      default:
        return <InfoCircleOutlined style={{ fontSize: 16, color: "#1890ff" }} />;
    }
  };

  return (
    <Card
      title={<span style={{ fontSize: 15, fontWeight: 700 }}>Dòng thời gian chuyên cần qua các buổi học</span>}
      style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", border: "1px solid #f0f0f0" }}
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
                    backgroundColor: "#fafafa",
                    border: "1px solid #f0f0f0",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <Space size={8}>
                      <Text strong style={{ fontSize: 14, color: "#1f2937" }}>
                        {dateStr}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ({rec.sessionTime || "08:00 - 10:30"})
                      </Text>
                    </Space>

                    <AttendanceStatusTag status={rec.status} />
                  </div>

                  <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: rec.note ? 4 : 0 }}>
                    {rec.sessionTitle} • GV: {rec.teacherName}
                  </Text>

                  {rec.note && (
                    <Paragraph
                      type="secondary"
                      style={{
                        fontSize: 12,
                        margin: 0,
                        backgroundColor: "#fff",
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px dashed #d9d9d9",
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
});

AttendanceTimeline.displayName = "AttendanceTimeline";

export default AttendanceTimeline;
