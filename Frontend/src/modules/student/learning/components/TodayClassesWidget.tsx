import React from "react";
import { Card, Typography, Space, Button, Tag, Avatar } from "antd";
import { ClockCircleOutlined, UserOutlined, VideoCameraOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { TodayClassItem } from "../types/learningDashboard.types";
import { formatSchedule } from "../utils/learningDashboard.utils";

const { Text } = Typography;

interface TodayClassesWidgetProps {
  todayClasses: TodayClassItem[];
}

export const TodayClassesWidget: React.FC<TodayClassesWidgetProps> = React.memo(({ todayClasses }) => {
  return (
    <Card
      title={
        <Space size={8}>
          <ClockCircleOutlined style={{ color: "#1890ff" }} />
          <span>Lịch học hôm nay ({todayClasses.length})</span>
        </Space>
      }
      bordered={false}
      style={{ borderRadius: 16, boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)" }}
    >
      {todayClasses.length === 0 ? (
        <div style={{ textAlign: "center", padding: "20px 0", color: "#8c8c8c" }}>
          Không có buổi học nào được lên lịch cho hôm nay.
        </div>
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
                justifyContent: "space-between",
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
                    {item.courseName} • GV: {item.teacherName} ({formatSchedule(item.timeSlot)})
                  </Text>
                </div>
              </Space>

              <Link to={`/student/classdetail/${item.id}?tab=${item.status === "LIVE" ? "live" : "overview"}`}>
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
