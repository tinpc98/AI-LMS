import React from "react";
import { Card, Typography, Space, Button, Tag, Avatar } from "antd";
import { ClockCircleOutlined, UserOutlined, VideoCameraOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { TodayClassItem } from "../types/learningDashboard.types";

const { Text, Title } = Typography;

interface TodayClassesWidgetProps {
  todayClasses: TodayClassItem[];
}

export const TodayClassesWidget: React.FC<TodayClassesWidgetProps> = React.memo(({ todayClasses }) => {
  return (
    <Card
      title={
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          <ClockCircleOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Lịch học hôm nay ({todayClasses.length})
        </span>
      }
      style={{ borderRadius: 16, border: "1px solid #f0f0f0", marginBottom: 24 }}
      styles={{ body: { padding: 16 } }}
    >
      {todayClasses.length === 0 ? (
        <Text type="secondary" style={{ fontSize: 13, fontStyle: "italic" }}>
          Hôm nay bạn không có lịch học trực tuyến nào.
        </Text>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {todayClasses.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: item.status === "LIVE" ? "#fff1f0" : "#fafafa",
                border: item.status === "LIVE" ? "1px solid #ffccc7" : "1px solid #f0f0f0",
                borderRadius: 12,
                padding: "12px 16px",
                display: "flex",
                justify: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <Space size={12}>
                <Avatar icon={<UserOutlined />} src={item.teacherAvatar} style={{ backgroundColor: "#1890ff" }} />
                <div>
                  <Space size={6}>
                    <Text strong style={{ fontSize: 14, color: "#1f2937" }}>
                      {item.className}
                    </Text>
                    {item.status === "LIVE" ? (
                      <Tag color="error" icon={<VideoCameraOutlined className="animate-pulse" />} style={{ borderRadius: 6 }}>
                        🔴 LỚP ĐANG LIVE
                      </Tag>
                    ) : (
                      <Tag color="blue" style={{ borderRadius: 6 }}>
                        Sắp diễn ra
                      </Tag>
                    )}
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                    {item.courseName} • GV: {item.teacherName} ({item.timeSlot})
                  </Text>
                </div>
              </Space>

              <Link to={`/classdetail/${item.id}?tab=${item.status === "LIVE" ? "live" : "overview"}`}>
                <Button
                  type={item.status === "LIVE" ? "primary" : "default"}
                  danger={item.status === "LIVE"}
                  size="small"
                  icon={<ArrowRightOutlined />}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  {item.status === "LIVE" ? "Vào lớp ngay" : "Xem chi tiết"}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
});

TodayClassesWidget.displayName = "TodayClassesWidget";

export default TodayClassesWidget;
