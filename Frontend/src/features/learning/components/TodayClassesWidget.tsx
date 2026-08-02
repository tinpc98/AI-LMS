import React from "react";
import { Card, Typography, Button, Tag, Avatar } from "antd";
import {
  ClockCircleOutlined,
  UserOutlined,
  VideoCameraOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { TodayClassItem } from "../types/learningDashboard.types";
import { formatSchedule } from "../utils/learningDashboard.utils";

const { Text } = Typography;

interface TodayClassesWidgetProps {
  todayClasses: TodayClassItem[];
}

export const TodayClassesWidget: React.FC<TodayClassesWidgetProps> = React.memo(
  ({ todayClasses }) => {
    return (
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOutlined style={{ color: "#1890ff", fontSize: 16 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#1f2937" }}>
              Lịch học hôm nay
            </span>
            <Text
              style={{
                fontSize: 12,
                color: todayClasses.length > 0 ? "#1890ff" : "#8c8c8c",
                backgroundColor: todayClasses.length > 0 ? "#e6f7ff" : "#f5f5f5",
                borderRadius: 8,
                padding: "1px 8px",
                fontWeight: 600,
              }}
            >
              {todayClasses.length}
            </Text>
          </div>
        }
        style={{
          borderRadius: 20,
          border: "1px solid #f0f0f0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          height: "100%",
        }}
        styles={{ body: { padding: "8px 20px 20px" } }}
      >
        {todayClasses.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              color: "#bfbfbf",
              fontSize: 13,
            }}
          >
            <CalendarOutlined style={{ fontSize: 28, marginBottom: 10, display: "block" }} />
            Không có buổi học nào hôm nay.
            <br />
            <Text style={{ fontSize: 12, color: "#d1d5db" }}>Tận dụng thời gian ôn tập nhé!</Text>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayClasses.map((item) => {
              const isLive = item.status === "LIVE";

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: isLive ? "#fff1f0" : "#fafafa",
                    border: `1.5px solid ${isLive ? "#ffccc7" : "#f0f0f0"}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    transition: "all 0.2s ease",
                    boxShadow: isLive ? "0 2px 12px rgba(255,77,79,0.12)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <Avatar
                      icon={<UserOutlined />}
                      src={item.teacherAvatar}
                      size={40}
                      style={{ backgroundColor: isLive ? "#ff4d4f" : "#1890ff", flexShrink: 0 }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                          marginBottom: 3,
                        }}
                      >
                        <Text strong style={{ fontSize: 14, color: "#1f2937" }}>
                          {item.className}
                        </Text>
                        {isLive ? (
                          <Tag
                            color="error"
                            icon={<VideoCameraOutlined />}
                            style={{ borderRadius: 6, fontWeight: 600, fontSize: 11 }}
                          >
                            🔴 ĐANG LIVE
                          </Tag>
                        ) : (
                          <Tag color="blue" style={{ borderRadius: 6, fontSize: 11 }}>
                            Sắp diễn ra
                          </Tag>
                        )}
                      </div>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>
                        {item.courseName}
                        <span style={{ margin: "0 5px", color: "#d1d5db" }}>•</span>
                        <ClockCircleOutlined style={{ marginRight: 3, fontSize: 11 }} />
                        {formatSchedule(item.timeSlot)}
                        <span style={{ margin: "0 5px", color: "#d1d5db" }}>•</span>
                        GV: {item.teacherName}
                      </Text>
                    </div>
                  </div>

                  <Link
                    to={`/student/classdetail/${item.id}?tab=${isLive ? "live" : "overview"}`}
                  >
                    <Button
                      type={isLive ? "primary" : "default"}
                      danger={isLive}
                      size="small"
                      icon={isLive ? <VideoCameraOutlined /> : <ArrowRightOutlined />}
                      style={{
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: isLive ? 700 : 500,
                        flexShrink: 0,
                      }}
                    >
                      {isLive ? "Vào lớp ngay" : "Xem chi tiết"}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  }
);

TodayClassesWidget.displayName = "TodayClassesWidget";

export default TodayClassesWidget;
