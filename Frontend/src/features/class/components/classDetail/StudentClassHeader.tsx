import React from "react";
import { Button, Typography, Space, Avatar, Row, Col } from "antd";
import { ArrowLeftOutlined, UserOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ClassStatusTag from "../classes/ClassStatusTag";
import type { StudentClassStatus } from "../../../../types/studentClass";

const { Title, Text } = Typography;

interface StudentClassHeaderProps {
  className: string;
  classCode?: string;
  subject?: string;
  semester?: string;
  status?: StudentClassStatus;
  teacher?: {
    _id?: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  } | null;
}

export const StudentClassHeader: React.FC<StudentClassHeaderProps> = React.memo(
  ({
    className,
    classCode,
    subject,
    semester,
    status = "Active",
    teacher,
  }) => {
    const navigate = useNavigate();
    const displaySubject = subject || "Chưa gán khóa học";

    return (
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          padding: "24px 28px",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--color-border-default)",
          marginBottom: 24,
        }}
      >
        {/* Back Button */}
        <div style={{ marginBottom: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/student/myclasses")}
            style={{ paddingLeft: 0, fontSize: 14, color: "var(--color-text-body)" }}
          >
            Quay lại danh sách lớp học
          </Button>
        </div>

        <Row gutter={[24, 16]} align="middle" justify="space-between">
          {/* Class Title & Details */}
          <Col xs={24}>
            <Space align="center" size={12} style={{ marginBottom: 6, flexWrap: "wrap" }}>
              <ClassStatusTag status={status} />
              {classCode && (
                <Text
                  type="secondary"
                  style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}
                >
                  #{classCode}
                </Text>
              )}
              {semester && (
                <Text type="secondary" style={{ fontSize: 13 }}>
                  • {semester}
                </Text>
              )}
            </Space>

            <Title level={3} style={{ margin: "0 0 6px 0", fontWeight: 700, color: "var(--color-text-title)" }}>
              {className}
            </Title>

            <Space size={16} wrap style={{ fontSize: 14 }}>
              <Text type="secondary">
                <BookOutlined style={{ marginRight: 6 }} />
                Môn học: <strong style={{ color: "var(--color-text-title)" }}>{displaySubject}</strong>
              </Text>
              {teacher?.fullName && (
                <Text type="secondary">
                  <UserOutlined style={{ marginRight: 6 }} />
                  Giảng viên: <strong style={{ color: "var(--color-text-title)" }}>{teacher.fullName}</strong>
                </Text>
              )}
            </Space>
          </Col>
        </Row>
      </div>
    );
  }
);

StudentClassHeader.displayName = "StudentClassHeader";

export default StudentClassHeader;
