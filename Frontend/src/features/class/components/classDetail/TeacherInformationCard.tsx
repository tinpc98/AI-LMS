import React from "react";
import { Card, Avatar, Typography, Tag, Space, Divider } from "antd";
import { UserOutlined, MailOutlined, BookOutlined, ClockCircleOutlined } from "@ant-design/icons";
import EmptyState from "../../../../shared/components/EmptyState";

const { Title, Text } = Typography;

interface TeacherInformationCardProps {
  teacher?: {
    _id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
    teachingSubjects?: string[];
    availabilitySchedule?: Record<
      string,
      { startTime?: string; endTime?: string; available?: boolean }
    > | null;
  } | null;
}

export const TeacherInformationCard: React.FC<TeacherInformationCardProps> = React.memo(
  ({ teacher }) => {
    if (!teacher) {
      return (
        <Card
          title={
            <Space align="center">
              <UserOutlined style={{ color: "#722ed1", fontSize: 18 }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Thông tin giảng viên</span>
            </Space>
          }
          style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", marginBottom: 24 }}
          styles={{ body: { padding: 20 } }}
        >
          <EmptyState
            description="Lớp học hiện chưa có thông tin phân công giảng viên."
            style={{ border: "none" }}
          />
        </Card>
      );
    }

    const subjects =
      teacher.teachingSubjects && teacher.teachingSubjects.length > 0
        ? teacher.teachingSubjects
        : ["Công nghệ thông tin", "Khoa học máy tính"];

    const hasSchedule =
      teacher.availabilitySchedule && Object.keys(teacher.availabilitySchedule).length > 0;

    return (
      <Card
        title={
          <Space align="center">
            <UserOutlined style={{ color: "#722ed1", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Giảng viên phụ trách</span>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: 24 } }}
      >
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Avatar
            size={72}
            src={teacher.avatar || undefined}
            icon={!teacher.avatar ? <UserOutlined style={{ fontSize: 36 }} /> : undefined}
            style={{ backgroundColor: "#1890ff", marginBottom: 12, border: "2px solid #e6f7ff" }}
          />
          <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>
            {teacher.fullName}
          </Title>
          <Space size={6} style={{ marginTop: 4 }}>
            <MailOutlined style={{ color: "#8c8c8c", fontSize: 13 }} />
            <Text type="secondary" style={{ fontSize: 13 }}>
              {teacher.email || "Chưa cập nhật email"}
            </Text>
          </Space>
        </div>

        <Divider style={{ margin: "16px 0" }} />

        {/* Teaching Subjects */}
        <div style={{ marginBottom: 16 }}>
          <Text
            strong
            style={{ fontSize: 13, color: "#595959", display: "block", marginBottom: 8 }}
          >
            <BookOutlined style={{ marginRight: 6 }} /> Chuyên môn giảng dạy:
          </Text>
          <Space wrap size={[6, 6]}>
            {subjects.map((sub, index) => (
              <Tag color="purple" key={index} style={{ borderRadius: 8 }}>
                {sub}
              </Tag>
            ))}
          </Space>
        </div>

        {/* Availability Schedule */}
        {hasSchedule && (
          <div>
            <Text
              strong
              style={{ fontSize: 13, color: "#595959", display: "block", marginBottom: 8 }}
            >
              <ClockCircleOutlined style={{ marginRight: 6 }} /> Khung giờ tiếp sinh viên:
            </Text>
            <div style={{ backgroundColor: "#fafafa", borderRadius: 8, padding: "8px 12px" }}>
              {Object.entries(teacher.availabilitySchedule!).map(([day, info]) => {
                if (!info?.available) return null;
                return (
                  <div
                    key={day}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      margin: "2px 0",
                    }}
                  >
                    <Text strong>{day}:</Text>
                    <Text type="secondary">
                      {info.startTime} - {info.endTime}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    );
  }
);

TeacherInformationCard.displayName = "TeacherInformationCard";

export default TeacherInformationCard;
