import React from "react";
import { Table, Tag, Button, Typography, Space, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ArrowRightOutlined, TeamOutlined, BookOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

interface ClassItem {
  _id: string;
  className: string;
  classCode?: string;
  joinCode?: string;
  courseId?:
    | {
        courseName?: string;
      }
    | string;
  students?: any[];
  currentStudents?: number;
  maxStudents?: number;
  status?: string;
}

interface TeacherClassListTableProps {
  classes: ClassItem[];
  loading?: boolean;
}

export const TeacherClassListTable: React.FC<TeacherClassListTableProps> = React.memo(
  ({ classes, loading }) => {
    const navigate = useNavigate();

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

    const columns: ColumnsType<ClassItem> = [
      {
        title: "Tên lớp học & Mã",
        dataIndex: "className",
        key: "className",
        render: (text, record) => (
          <div>
            <Text strong style={{ fontSize: 14, display: "block" }}>
              {text}
            </Text>
            {(record.joinCode || record.classCode) && (
              <Tag color="cyan" style={{ marginTop: 4, fontFamily: "monospace" }}>
                Mã: {record.joinCode || record.classCode}
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: "Khóa học",
        dataIndex: "courseId",
        key: "courseId",
        render: (courseId) => {
          const name = typeof courseId === "object" ? courseId?.courseName : "-";
          return (
            <Space>
              <BookOutlined style={{ color: "#1890ff" }} />
              <span>{name || "Chưa gán khóa học"}</span>
            </Space>
          );
        },
      },
      {
        title: "Sĩ số",
        key: "students",
        render: (_, record) => {
          const count =
            record.currentStudents ?? (Array.isArray(record.students) ? record.students.length : 0);
          const max = record.maxStudents || 30;
          return (
            <Space>
              <TeamOutlined style={{ color: "#52c41a" }} />
              <span>
                <strong>{count}</strong> / {max}
              </span>
            </Space>
          );
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => getStatusTag(status),
      },
      {
        title: "Thao tác",
        key: "action",
        align: "right",
        render: (_, record) => (
          <Button
            type="primary"
            size="small"
            icon={<ArrowRightOutlined />}
            onClick={() => navigate(`/teacher/classroom-detail/${record._id}`)}
            style={{ borderRadius: 6, fontWeight: 600 }}
          >
            Vào quản lý lớp
          </Button>
        ),
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={classes}
        rowKey="_id"
        loading={loading}
        pagination={false}
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid #f0f0f0",
        }}
      />
    );
  }
);

TeacherClassListTable.displayName = "TeacherClassListTable";
