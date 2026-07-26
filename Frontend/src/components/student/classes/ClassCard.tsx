import React from "react";
import { Card, Typography, Avatar, Space, Tooltip } from "antd";
import { TeamOutlined, UserOutlined, CalendarOutlined, BookOutlined } from "@ant-design/icons";
import type { IStudentClass } from "../../types/studentClass";
import ClassStatusTag from "./ClassStatusTag";
import ClassProgress from "./ClassProgress";
import ClassCardActions from "./ClassCardActions";

const { Title, Text } = Typography;

interface ClassCardProps {
  item: IStudentClass;
}

export const ClassCard: React.FC<ClassCardProps> = React.memo(({ item }) => {
  const formattedStartDate = item.startDate
    ? new Date(item.startDate).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Bắt đầu mới";

  return (
    <Card
      hoverable
      bordered
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        transition: "all 0.3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        border: "1px solid #f0f0f0",
      }}
      styles={{ body: { padding: 20, display: "flex", flexDirection: "column", height: "100%" } }}
    >
      <div>
        {/* Header: Status Tag & Class Code */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <ClassStatusTag status={item.status} />
          {item.classCode && (
            <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>
              #{item.classCode}
            </Text>
          )}
        </div>

        {/* Class Name & Subject */}
        <Title level={5} style={{ margin: "0 0 4px 0", fontSize: 16, fontWeight: 700 }} ellipsis={{ rows: 2 }}>
          {item.className}
        </Title>
        <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 16 }}>
          <BookOutlined style={{ marginRight: 4 }} /> {item.subject || item.courseName || "Khóa học chính"}
        </Text>

        {/* Teacher Info */}
        <div
          style={{
            backgroundColor: "#fafafa",
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
            src={item.teacher?.avatar || undefined}
            icon={!item.teacher?.avatar ? <UserOutlined /> : undefined}
            style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
          />
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <Text type="secondary" style={{ fontSize: 11, display: "block", lineHeight: 1.2 }}>
              Giảng viên phụ trách
            </Text>
            <Text strong style={{ fontSize: 13, color: "#262626" }} ellipsis>
              {item.teacher?.fullName || "Chưa phân công"}
            </Text>
          </div>
        </div>

        {/* Class Info Meta: Student count & Start Date */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Tooltip title={`Sĩ số lớp: ${item.totalStudents || 0}/${item.maxStudents || 40}`}>
            <Space size={6} align="center">
              <TeamOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {item.totalStudents || 0} học viên
              </Text>
            </Space>
          </Tooltip>

          <Tooltip title={`Ngày khai giảng: ${formattedStartDate}`}>
            <Space size={6} align="center">
              <CalendarOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formattedStartDate}
              </Text>
            </Space>
          </Tooltip>
        </div>

        {/* Progress Bar */}
        <ClassProgress percent={item.progress} />
      </div>

      {/* Footer Actions */}
      <ClassCardActions classId={item._id} status={item.status} isLiveActive={item.isLiveActive} />
    </Card>
  );
});

ClassCard.displayName = "ClassCard";

export default ClassCard;
