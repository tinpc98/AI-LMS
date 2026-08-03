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
            <CalendarOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 16 }} />
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-title)" }}>
              Lịch học hôm nay
            </span>
            <Text
              style={{
                fontSize: 12,
                color: todayClasses.length > 0 ? "var(--color-action-primary-bg)" : "var(--color-text-description)",
                backgroundColor: todayClasses.length > 0 ? "var(--color-bg-primary-tint)" : "var(--color-bg-page)",
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
          border: "1px solid var(--color-border-default)",
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
              color: "var(--color-text-disabled)",
              fontSize: 13,
            }}
          >
            <CalendarOutlined style={{ fontSize: 28, marginBottom: 10, display: "block" }} />
            Không có buổi học nào hôm nay.
            <br />
            <Text style={{ fontSize: 12, color: "var(--color-border-default)" }}>Tận dụng thời gian ôn tập nhé!</Text>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {todayClasses.map((item) => {
              const isLive = item.status === "LIVE";

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: isLive ? "var(--color-error-bg)" : "var(--color-bg-page)",
                    border: `1.5px solid ${isLive ? "var(--color-border-default)" : "var(--color-border-default)"}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    flexWrap: "wrap",
                    transition: "var(--transition-fast)",
                    boxShadow: isLive ? "0 2px 12px rgba(255,77,79,0.12)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <Avatar
                      icon={<UserOutlined />}
                      src={item.teacherAvatar}
                      size={40}
                      style={{ backgroundColor: isLive ? "var(--color-error-base)" : "var(--color-action-primary-bg)", flexShrink: 0 }}
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
                        <Text strong style={{ fontSize: 14, color: "var(--color-text-title)" }}>
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
                      <Text style={{ fontSize: 12, color: "var(--color-text-description)" }}>
                        {item.courseName}
                        <span style={{ margin: "0 5px", color: "var(--color-border-default)" }}>•</span>
                        <ClockCircleOutlined style={{ marginRight: 3, fontSize: 11 }} />
                        {formatSchedule(item.timeSlot)}
                        <span style={{ margin: "0 5px", color: "var(--color-border-default)" }}>•</span>
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
