import React from "react";
import { Card, Timeline, Typography, Tag, Space } from "antd";
import { CalendarOutlined, ClockCircleOutlined, VideoCameraOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface ScheduleTimelineProps {
  schedule?: Array<{ dayOfWeek: string; time: string }>;
}

export const ScheduleTimeline: React.FC<ScheduleTimelineProps> = React.memo(({ schedule = [] }) => {
  if (schedule.length === 0) return null;

  return (
    <Card
      title={
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          <CalendarOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Lịch học cố định trong tuần
        </span>
      }
      style={{ borderRadius: 16, border: "1px solid #f0f0f0", marginBottom: 24 }}
    >
      <div style={{ padding: "8px 0" }}>
        <Timeline
          items={schedule.map((item, idx) => ({
            dot: <VideoCameraOutlined style={{ fontSize: 14, color: "#1890ff" }} />,
            children: (
              <div style={{ marginBottom: 8 }}>
                <Space size={8}>
                  <Tag color="blue" style={{ borderRadius: 6, fontWeight: 700 }}>
                    {item.dayOfWeek}
                  </Tag>
                  <Text strong style={{ fontSize: 13, color: "#1f2937" }}>
                    <ClockCircleOutlined style={{ marginRight: 4 }} /> {item.time}
                  </Text>
                </Space>
                <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2 }}>
                  Lớp học trực tuyến diễn ra định kỳ hàng tuần.
                </Text>
              </div>
            ),
          }))}
        />
      </div>
    </Card>
  );
});

ScheduleTimeline.displayName = "ScheduleTimeline";

export default ScheduleTimeline;
