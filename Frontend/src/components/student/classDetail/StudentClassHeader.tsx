import React from "react";
import { Button, Typography, Space, Avatar, Row, Col } from "antd";
import { ArrowLeftOutlined, UserOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import ClassStatusTag from "../classes/ClassStatusTag";
import type { StudentClassStatus } from "../../../types/studentClass";

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
    subject = "Khóa học chính",
    semester = "HK1 (2025-2026)",
    status = "Active",
    teacher,
  }) => {
    const navigate = useNavigate();

    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: "24px 28px",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          marginBottom: 24,
        }}
      >
        {/* Back Button */}
        <div style={{ marginBottom: 16 }}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate("/student/myclasses")}
            style={{ paddingLeft: 0, fontSize: 14, color: "#595959" }}
          >
            Quay lại danh sách lớp học
          </Button>
        </div>

        <Row gutter={[24, 16]} align="middle" justify="space-between">
          {/* Class Title & Details */}
          <Col xs={24} md={14} lg={16}>
            <Space align="center" size={12} style={{ marginBottom: 6, flexWrap: "wrap" }}>
              <ClassStatusTag status={status} />
              {classCode && (
                <Text type="secondary" style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>
                  #{classCode}
                </Text>
              )}
              <Text type="secondary" style={{ fontSize: 13 }}>
                • {semester}
              </Text>
            </Space>

            <Title level={3} style={{ margin: "0 0 6px 0", fontWeight: 700, color: "#1f2937" }}>
              {className}
            </Title>

            <Text type="secondary" style={{ fontSize: 14 }}>
              <BookOutlined style={{ marginRight: 6 }} />
              Môn học: <strong style={{ color: "#262626" }}>{subject}</strong>
            </Text>
          </Col>

          {/* Teacher Summary Badge */}
          <Col xs={24} md={10} lg={8} style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                backgroundColor: "#fafafa",
                border: "1px solid #f0f0f0",
                padding: "10px 16px",
                borderRadius: 12,
                textAlign: "left",
              }}
            >
              <Avatar
                size={40}
                src={teacher?.avatar || undefined}
                icon={!teacher?.avatar ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
              />
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                  Giảng viên phụ trách
                </Text>
                <Text strong style={{ fontSize: 14, color: "#1f2937" }}>
                  {teacher?.fullName || "Chưa phân công"}
                </Text>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    );
  }
);

StudentClassHeader.displayName = "StudentClassHeader";

export default StudentClassHeader;
