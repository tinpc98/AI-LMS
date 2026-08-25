import React, { useState, useEffect } from "react";
import { Card, Typography, Space, Tooltip, Button } from "antd";
import { TeamOutlined, CalendarOutlined, BookOutlined, VideoCameraOutlined, FormOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getNextSessionInfo } from "../../../learning/utils/learningDashboard.utils";
import type { IStudentClass } from "../../../../types/studentClass";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

const TIMEZONE = "Asia/Ho_Chi_Minh";
const { Title, Text } = Typography;

interface TeacherClassCardProps {
  item: IStudentClass;
}

export const TeacherClassCard: React.FC<TeacherClassCardProps> = React.memo(({ item }) => {
  const navigate = useNavigate();
  const [, setTick] = useState(0);

  // Force re-render every minute to keep tag status accurate
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const nextSession = getNextSessionInfo(item.schedule);
  const courseName = item.subject || item.courseName || (item as any).course?.name || "Chưa gán khóa học";
  const currentStudentsCount = (item as any).currentStudents ?? item.totalStudents ?? 0;
  
  // Use real field if available, fallback to false if not present
  const isAttendanceDone = (item as any).isAttendanceDone ?? false;

  const isOnline = item.mode === "ONLINE";
  const isOffline = item.mode === "OFFLINE";

  const getStatus = () => {
    // 1. Chưa khai giảng
    if (item.startDate && dayjs(item.startDate).isAfter(dayjs().tz(TIMEZONE), 'day')) {
      return { 
        type: "NOT_STARTED",
        text: "Chưa khai giảng", 
        cardBorderClass: "border border-gray-200", 
        badgeClass: "bg-gray-100 text-gray-500 border-gray-200" 
      };
    }

    // 2. Đã kết thúc toàn bộ khóa học
    if (item.status === "Completed" || item.status === "completed" || 
       (item.endDate && dayjs(item.endDate).isBefore(dayjs().tz(TIMEZONE), 'day'))) {
      return { 
        type: "COMPLETED",
        text: "Khóa học kết thúc", 
        cardBorderClass: "border border-gray-200", 
        badgeClass: "bg-gray-100 text-gray-700 border-gray-300" 
      };
    }

    if (!item.schedule || !item.schedule.startTime || !item.schedule.endTime || !Array.isArray(item.schedule.days)) {
      return {
        type: "UNKNOWN",
        text: "Đang hoạt động",
        cardBorderClass: "border border-gray-200 hover:shadow-md transition-shadow",
        badgeClass: "bg-green-50 text-green-700 border-green-200"
      };
    }

    const now = dayjs().tz(TIMEZONE);
    const todayDayOfWeek = now.format("dddd");
    const hasSessionToday = item.schedule.days.includes(todayDayOfWeek);

    if (hasSessionToday) {
      const [startHour, startMin] = item.schedule.startTime.split(":").map(Number);
      const [endHour, endMin] = item.schedule.endTime.split(":").map(Number);
      
      const startTime = now.clone().hour(startHour).minute(startMin).second(0);
      const endTime = now.clone().hour(endHour).minute(endMin).second(0);

      // Đang dạy: (currentTime trong khoảng start-end)
      if (now.isBetween(startTime, endTime, null, "[]")) {
        return { 
          type: "TEACHING",
          text: "🔴 Đang dạy", 
          cardBorderClass: "border-2 border-red-500 shadow-md animate-pulse", 
          badgeClass: "bg-red-50 text-red-700 border-red-500" 
        };
      }
      
      // Sắp dạy: (currentTime < startTime)
      if (now.isBefore(startTime)) {
        return { 
          type: "UPCOMING_TODAY",
          text: `⏳ Sắp dạy · ${item.schedule.startTime}`, 
          cardBorderClass: "border-2 border-yellow-500 shadow-md", 
          badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-500" 
        };
      }

      // Đã qua giờ học hôm nay
      if (now.isAfter(endTime)) {
        if (!isAttendanceDone) {
          // Thiếu điểm danh (CRITICAL): (currentTime > endTime VÀ attendanceStatus == false)
          return {
            type: "MISSING_ATTENDANCE",
            text: "⚠️ Thiếu điểm danh",
            cardBorderClass: "border-2 border-orange-500 shadow-md",
            badgeClass: "bg-orange-50 text-orange-700 border-orange-500"
          }
        } else {
          // Đã hoàn thành: (currentTime > endTime VÀ attendanceStatus == true)
          return {
            type: "SESSION_COMPLETED",
            text: "✔️ Đã hoàn thành",
            cardBorderClass: "border border-gray-200 hover:shadow-md transition-shadow",
            badgeClass: "bg-gray-50 text-gray-500 border-gray-200"
          }
        }
      }
    }

    // Buổi dạy tiếp theo (Không có lịch hôm nay)
    if (nextSession.timestamp !== 9999999999999) {
      return {
        type: "UPCOMING_OTHER",
        text: `Buổi tới: ${nextSession.displayString.split(',')[0]} ${item.schedule.startTime}`,
        cardBorderClass: "border border-gray-200 hover:shadow-md transition-shadow",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200"
      };
    }

    return {
      type: "UNKNOWN",
      text: "Đang hoạt động",
      cardBorderClass: "border border-gray-200 hover:shadow-md transition-shadow",
      badgeClass: "bg-green-50 text-green-700 border-green-200"
    };
  };

  const status = getStatus();

  // CTA Renderer
  const renderCTA = () => {
    // Ưu tiên 1: Thiếu điểm danh -> Nút Cực kỳ nổi bật
    if (status.type === "MISSING_ATTENDANCE") {
      return (
        <Button 
          type="primary" 
          danger 
          icon={<FormOutlined />} 
          style={{ width: '100%', backgroundColor: '#fa541c', borderColor: '#fa541c', borderRadius: 8, height: 40, fontWeight: 600 }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/teacher/classroom-detail/${item._id}?tab=attendance`);
          }}
        >
          📝 ĐIỂM DANH NGAY
        </Button>
      );
    }

    // Ưu tiên 2: Lớp Online & (Đang dạy hoặc sắp dạy hôm nay) -> Nút Mở phòng Live
    if (isOnline && (status.type === "TEACHING" || status.type === "UPCOMING_TODAY")) {
      return (
        <Button 
          type="primary" 
          icon={<VideoCameraOutlined />} 
          style={{ width: '100%', borderRadius: 8, height: 40, fontWeight: 600 }}
          onClick={(e) => {
            e.stopPropagation();
            const link = (item as any).meetLink || `/teacher/live/${item._id}`;
            if (link.startsWith("http")) {
              window.open(link, "_blank");
            } else {
              navigate(link);
            }
          }}
        >
          🎥 Mở phòng Live
        </Button>
      );
    }

    // Ưu tiên 3: Đã hoàn thành hoặc không có lịch hôm nay -> Xem chi tiết lớp
    return (
      <Button 
        type="default" 
        style={{ width: '100%', borderRadius: 8, height: 40 }}
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/teacher/classroom-detail/${item._id}`);
        }}
      >
        Chi tiết lớp
      </Button>
    );
  };

  return (
    <Card
      hoverable
      bordered={false}
      onClick={() => navigate(`/teacher/classroom-detail/${item._id}`)}
      className={`rounded-2xl transition-all duration-300 h-full flex flex-col cursor-pointer ${status.cardBorderClass}`}
      styles={{ body: { padding: 20, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      <div style={{ flex: 1 }}>
        {/* Header: Status Tag at top left */}
        <div className="flex justify-between items-start mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.badgeClass}`}>
            {status.text}
          </span>
          <span className={`px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600`}>
            {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        {/* Class Name & Subject */}
        <Title
          level={5}
          style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700 }}
          ellipsis={{ rows: 2 }}
        >
          {item.name}
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
          <BookOutlined style={{ marginRight: 4 }} />{" "}
          {courseName}
        </Text>

        {/* Class Info Meta: Student count & Next Schedule */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            backgroundColor: "var(--color-bg-page)",
            borderRadius: 8,
            padding: "12px",
          }}
        >
          <Tooltip title={`Sĩ số: ${currentStudentsCount}/${item.capacity || 40}`}>
            <Space size={6} align="center">
              <TeamOutlined style={{ color: "var(--color-text-description)", fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
                {currentStudentsCount}
              </Text>
            </Space>
          </Tooltip>

          <Tooltip title={`Lịch tiếp theo: ${nextSession.displayString}`}>
            <Space size={6} align="center">
              <CalendarOutlined style={{ color: "var(--color-text-description)", fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {nextSession.displayString !== "Không có lịch học" && nextSession.displayString !== "Không xác định" 
                  ? nextSession.displayString 
                  : (item.startDate ? dayjs(item.startDate).format("DD/MM/YYYY") : "Chưa có lịch")}
              </Text>
            </Space>
          </Tooltip>
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ marginTop: 'auto', paddingTop: 16 }} onClick={(e) => e.stopPropagation()}>
        {renderCTA()}
      </div>
    </Card>
  );
});

TeacherClassCard.displayName = "TeacherClassCard";
export default TeacherClassCard;
