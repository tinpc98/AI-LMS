import React from "react";
import { Card, Typography, List, Button, Space } from "antd";
import { WarningOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Ho_Chi_Minh";
const { Title, Text } = Typography;

interface PendingAttendanceWidgetProps {
  classes: any[];
  loading?: boolean;
}

export const PendingAttendanceWidget: React.FC<PendingAttendanceWidgetProps> = ({ classes, loading }) => {
  const navigate = useNavigate();
  
  // Filter classes to find those needing attendance today
  const pendingClasses = classes.filter((cls) => {
    if (!cls.schedule || !cls.schedule.startTime || !cls.schedule.endTime || !Array.isArray(cls.schedule.days)) {
      return false;
    }

    const now = dayjs().tz(TIMEZONE);
    const todayDayOfWeek = now.format("dddd");
    const hasSessionToday = cls.schedule.days.includes(todayDayOfWeek);

    if (hasSessionToday) {
      const [endHour, endMin] = cls.schedule.endTime.split(":").map(Number);
      const endTime = now.clone().hour(endHour).minute(endMin).second(0);
      
      // Deterministic mock for attendance (until backend is ready)
      // If it doesn't have isAttendanceDone, we randomly assign based on id length to keep it stable
      const mockIsAttendanceDone = cls.isAttendanceDone ?? ((cls._id || "").length % 3 === 0);

      // Nếu đã qua giờ học và chưa điểm danh
      if (now.isAfter(endTime) && !mockIsAttendanceDone) {
        return true;
      }
    }
    
    return false;
  });

  return (
    <Card
      title={
        <Space>
          <WarningOutlined style={{ color: "#faad14" }} />
          <Text strong>⚠️ Buổi dạy chờ điểm danh</Text>
        </Space>
      }
      loading={loading}
      style={{
        borderRadius: 12,
        marginBottom: 24,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        border: "1px solid #ffe58f",
        backgroundColor: "#fffbe6"
      }}
      bodyStyle={{ padding: pendingClasses.length === 0 ? "24px" : "12px 24px" }}
    >
      {pendingClasses.length === 0 ? (
        <div style={{ textAlign: "center", color: "#8c8c8c" }}>
          <CheckCircleIcon />
          <Text style={{ display: "block", marginTop: 8 }}>
            Tuyệt vời! Bạn đã hoàn thành toàn bộ điểm danh.
          </Text>
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={pendingClasses}
          renderItem={(cls) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  danger
                  size="small"
                  style={{ borderRadius: 6, fontWeight: 500 }}
                  onClick={() => navigate(`/teacher/classroom-detail/${cls._id}?tab=attendance`)}
                >
                  Điểm danh <RightOutlined style={{ fontSize: 10 }} />
                </Button>
              ]}
            >
              <List.Item.Meta
                title={<Text strong>{cls.className}</Text>}
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {cls.schedule?.startTime} - {cls.schedule?.endTime}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

// Helper SVG Icon for Empty State
const CheckCircleIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: "0 auto" }}>
    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" fill="#E6F4EA"/>
    <path d="M16.0303 8.96967C16.3232 9.26256 16.3232 9.73744 16.0303 10.0303L11.0303 15.0303C10.7374 15.3232 10.2626 15.3232 9.96967 15.0303L7.96967 13.0303C7.67678 12.7374 7.67678 12.2626 7.96967 11.9697C8.26256 11.6768 8.73744 11.6768 9.03033 11.9697L10.5 13.4393L14.9697 8.96967C15.2626 8.67678 15.7374 8.67678 16.0303 8.96967Z" fill="#34A853"/>
  </svg>
);

export default PendingAttendanceWidget;
