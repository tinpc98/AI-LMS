import React, { useState, useEffect } from "react";
import { Card, Typography, Avatar, Space, Tooltip } from "antd";
import { TeamOutlined, UserOutlined, CalendarOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import type { IStudentClass } from "../../../../types/studentClass";
import ClassProgress from "./ClassProgress";
import ClassCardActions from "./ClassCardActions";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import isBetween from "dayjs/plugin/isBetween";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getNextSessionInfo } from "../../../learning/utils/learningDashboard.utils";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);

const TIMEZONE = "Asia/Ho_Chi_Minh";

const { Title, Text } = Typography;

interface ClassCardProps {
  item: IStudentClass;
}

export const ClassCard: React.FC<ClassCardProps> = React.memo(({ item }) => {
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

  const getDynamicBadge = () => {
    // 1. Chưa khai giảng
    if (item.startDate && dayjs(item.startDate).isAfter(dayjs().tz(TIMEZONE), 'day')) {
      return { 
        text: "Chưa khai giảng", 
        cardBorderClass: "border border-gray-200", 
        badgeClass: "bg-gray-100 text-gray-500 border-gray-200" 
      };
    }

    // 2. Đã kết thúc hoặc trạng thái hoàn thành
    if (item.status === "Completed" || item.status === "completed" || 
       (item.endDate && dayjs(item.endDate).isBefore(dayjs().tz(TIMEZONE), 'day'))) {
      return { 
        text: "Đã kết thúc", 
        cardBorderClass: "border border-gray-200", 
        badgeClass: "bg-gray-100 text-gray-700 border-gray-300" 
      };
    }

    if (!item.schedule || !item.schedule.startTime || !item.schedule.endTime || !Array.isArray(item.schedule.days)) {
      return null;
    }

    const now = dayjs().tz(TIMEZONE);
    const todayDayOfWeek = now.format("dddd");

    const hasSessionToday = item.schedule.days.includes(todayDayOfWeek);

    if (hasSessionToday) {
      const [startHour, startMin] = item.schedule.startTime.split(":").map(Number);
      const [endHour, endMin] = item.schedule.endTime.split(":").map(Number);
      
      const startTime = now.clone().hour(startHour).minute(startMin).second(0);
      const endTime = now.clone().hour(endHour).minute(endMin).second(0);

      // 3. Đang học
      if (now.isBetween(startTime, endTime, null, "[]")) {
        return { 
          text: "Đang học", 
          cardBorderClass: "border-2 border-red-500 shadow-md animate-pulse", 
          badgeClass: "bg-red-50 text-red-700 border-red-500" 
        };
      }
      
      // 4. Sắp học
      if (now.isBefore(startTime)) {
        return { 
          text: `Sắp học · ${item.schedule.startTime}`, 
          cardBorderClass: "border-2 border-yellow-500 shadow-md animate-pulse", 
          badgeClass: "bg-yellow-50 text-yellow-700 border-yellow-500" 
        };
      }

      // 5. Đã học xong hôm nay
      if (now.isAfter(endTime)) {
        return {
          text: "Đã học hôm nay",
          cardBorderClass: "border border-gray-200 hover:shadow-md transition-shadow",
          badgeClass: "bg-gray-50 text-gray-500 border-gray-200"
        }
      }
    }

    // 6. Buổi học tiếp theo (Không có lịch hôm nay)
    if (nextSession.timestamp !== 9999999999999) {
      return {
        text: `Buổi tới: ${nextSession.displayString.split(',')[0]} ${item.schedule.startTime}`,
        cardBorderClass: "border border-gray-200 hover:shadow-md transition-shadow",
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200"
      };
    }

    return null;
  };

  const badge = getDynamicBadge() || { 
    text: "Đang hoạt động", 
    cardBorderClass: "border border-gray-200 hover:shadow-md transition-shadow", 
    badgeClass: "bg-green-50 text-green-700 border-green-200" 
  };

  const teacherName = item.teacher?.fullName || (item as any).teacherId?.fullName || (item as any).teacherName || "Chưa phân công";
  const teacherAvatar = item.teacher?.avatar || (item as any).teacherId?.avatar || (item as any).teacherAvatar;
  
  // Resolve course/subject name safely
  const courseName = item.subject || item.courseName || (item as any).course?.name || "Chưa gán khóa học";
  
  // Resolve current students safely 
  const currentStudentsCount = (item as any).currentStudents ?? item.totalStudents ?? 0;

  // Handle card click
  const handleCardClick = () => {
    navigate(`/student/classdetail/${item._id}`);
  };

  return (
    <Card
      hoverable
      bordered={false}
      onClick={handleCardClick}
      className={`rounded-2xl transition-all duration-300 h-full flex flex-col cursor-pointer ${badge.cardBorderClass}`}
      styles={{ body: { padding: 20, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      <div style={{ flex: 1 }}>
        {/* Header: Status Tag at top left */}
        <div className="flex justify-between items-start mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.badgeClass}`}>
            {badge.text}
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

        {/* Teacher Info */}
        <div
          style={{
            backgroundColor: "var(--color-bg-page)",
            borderRadius: 10,
            padding: "10px 12px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Avatar
            size={32}
            src={teacherAvatar}
            icon={!teacherAvatar ? <UserOutlined /> : undefined}
            style={{ backgroundColor: "var(--color-action-primary-bg)", flexShrink: 0 }}
          />
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <Text type="secondary" style={{ fontSize: 11, display: "block", lineHeight: 1.2 }}>
              Giảng viên phụ trách
            </Text>
            <Text strong style={{ fontSize: 13, color: "var(--color-text-title)" }} ellipsis>
              {teacherName}
            </Text>
          </div>
        </div>

        {/* Class Info Meta: Student count & Start Date */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Tooltip title={`Sĩ số lớp: ${currentStudentsCount}/${item.capacity || 40}`}>
            <Space size={6} align="center">
              <TeamOutlined style={{ color: "var(--color-text-description)", fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {currentStudentsCount} học viên
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

        {/* Progress Bar */}
        {item.progress !== null && item.progress !== undefined ? (
          <ClassProgress percent={item.progress} />
        ) : (
          <div className="flex flex-col items-center justify-center p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200 mt-2">
            <Text type="secondary" className="text-xs">Chưa có dữ liệu tiến độ</Text>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div onClick={(e) => e.stopPropagation()}>
        <ClassCardActions item={item} />
      </div>
    </Card>
  );
});

ClassCard.displayName = "ClassCard";

export default ClassCard;
