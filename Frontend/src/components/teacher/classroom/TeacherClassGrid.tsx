import React, { useState } from "react";
import { Row, Col, Card, Tag, Button, Typography, Space, Tooltip, Badge } from "antd";
import {
  TeamOutlined,
  KeyOutlined,
  CopyOutlined,
  CheckOutlined,
  ArrowRightOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface ClassItem {
  _id: string;
  className: string;
  classCode?: string;
  joinCode?: string;
  courseId?: {
    courseName?: string;
  } | string;
  students?: any[];
  currentStudents?: number;
  maxStudents?: number;
  status?: string;
  learningMode?: string;
}

interface TeacherClassGridProps {
  classes: ClassItem[];
  loading?: boolean;
}

export const TeacherClassGrid: React.FC<TeacherClassGridProps> = React.memo(({ classes, loading }) => {
  const navigate = useNavigate();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusTag = (status?: string) => {
    switch (status) {
      case "Ready":
      case "Active":
      case "Ongoing":
      case "active":
        return <Tag color="success">Đang hoạt động</Tag>;
      case "Draft":
      case "Upcoming":
        return <Tag color="processing">Sắp diễn ra</Tag>;
      case "Completed":
      case "completed":
        return <Tag color="default">Đã kết thúc</Tag>;
      case "Cancelled":
      case "closed":
        return <Tag color="error">Đã đóng</Tag>;
      default:
        return <Tag color="blue">{status || "Hoạt động"}</Tag>;
    }
  };

  return (
    <Row gutter={[20, 20]}>
      {classes.map((cls) => {
        const studentCount = cls.currentStudents ?? (Array.isArray(cls.students) ? cls.students.length : 0);
        const max = cls.maxStudents || 30;
        const code = cls.joinCode || cls.classCode || "";
        const courseName = typeof cls.courseId === "object" ? cls.courseId?.courseName : "";

        return (
          <Col xs={24} sm={12} lg={8} key={cls._id}>
            <Card
              hoverable
              loading={loading}
              style={{
                borderRadius: 14,
                border: "1px solid #f0f0f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
              styles={{ body: { padding: 20, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" } }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700, flex: 1 }} ellipsis={{ rows: 2 }}>
                    {cls.className}
                  </Title>
                  {getStatusTag(cls.status)}
                </div>

                {courseName && (
                  <Text type="secondary" style={{ display: "block", fontSize: 13, marginBottom: 12 }} ellipsis>
                    <BookOutlined style={{ marginRight: 6 }} />
                    Khóa học: {courseName}
                  </Text>
                )}

                {code && (
                  <div
                    style={{
                      backgroundColor: "#f0f5ff",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #adc6ff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <Space size={6}>
                      <KeyOutlined style={{ color: "#1d39c4" }} />
                      <Text style={{ fontSize: 12, color: "#595959" }}>Mã tham gia:</Text>
                      <Text strong style={{ fontSize: 13, color: "#1d39c4", fontFamily: "monospace" }}>
                        {code}
                      </Text>
                    </Space>
                    <Tooltip title={copiedId === cls._id ? "Đã chép mã" : "Sao chép mã tham gia"}>
                      <Button
                        type="text"
                        size="small"
                        icon={copiedId === cls._id ? <CheckOutlined style={{ color: "#52c41a" }} /> : <CopyOutlined />}
                        onClick={() => handleCopyCode(cls._id, code)}
                      />
                    </Tooltip>
                  </div>
                )}
              </div>

              <div style={{ paddingTop: 12, borderTop: "1px solid #f5f5f5" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Space size={6}>
                    <TeamOutlined style={{ color: "#52c41a" }} />
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      Sĩ số: <strong>{studentCount}</strong> / {max} học sinh
                    </Text>
                  </Space>
                  {cls.learningMode && <Tag style={{ margin: 0 }}>{cls.learningMode}</Tag>}
                </div>

                <Button
                  type="primary"
                  block
                  icon={<ArrowRightOutlined />}
                  onClick={() => navigate(`/teacher/classroom-detail/${cls._id}`)}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Vào quản lý lớp
                </Button>
              </div>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
});

TeacherClassGrid.displayName = "TeacherClassGrid";
