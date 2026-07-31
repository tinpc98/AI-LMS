import React, { useState, useMemo } from "react";
import { Table, Avatar, Tag, Input, Card, Typography, Space, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface StudentItem {
  _id?: string;
  studentId?:
    | {
        _id?: string;
        fullName?: string;
        email?: string;
        avatar?: string;
      }
    | string;
  fullName?: string;
  email?: string;
  avatar?: string;
  joinedAt?: string;
  notes?: string;
  status?: string;
}

interface TeacherStudentTableTabProps {
  students: StudentItem[];
  loading?: boolean;
}

export const TeacherStudentTableTab: React.FC<TeacherStudentTableTabProps> = React.memo(
  ({ students = [], loading = false }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const filteredStudents = useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      return students.filter((item) => {
        const studentObj = typeof item.studentId === "object" ? item.studentId : null;
        const name = studentObj?.fullName || item.fullName || "";
        const email = studentObj?.email || item.email || "";
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      });
    }, [students, searchQuery]);

    const columns: ColumnsType<StudentItem> = [
      {
        title: "#",
        key: "index",
        width: 60,
        render: (_, __, index) => index + 1,
      },
      {
        title: "Học sinh",
        key: "student",
        render: (_, record) => {
          const studentObj = typeof record.studentId === "object" ? record.studentId : null;
          const name = studentObj?.fullName || record.fullName || "Học sinh";
          const email = studentObj?.email || record.email || "";
          const avatarUrl = studentObj?.avatar || record.avatar;

          return (
            <Space size={12}>
              <Avatar
                src={avatarUrl || undefined}
                icon={!avatarUrl ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "#1890ff" }}
              />
              <div>
                <Text strong style={{ fontSize: 14, display: "block" }}>
                  {name}
                </Text>
                {email && (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {email}
                  </Text>
                )}
              </div>
            </Space>
          );
        },
      },
      {
        title: "Mã sinh viên",
        key: "studentCode",
        render: (_, record, index) => {
          const studentObj = typeof record.studentId === "object" ? record.studentId : null;
          const id = studentObj?._id || record._id || `${index}`;
          return <Text style={{ fontFamily: "monospace" }}>STU-{id.slice(-6).toUpperCase()}</Text>;
        },
      },
      {
        title: "Ngày tham gia",
        dataIndex: "joinedAt",
        key: "joinedAt",
        render: (joinedAt) =>
          joinedAt ? new Date(joinedAt).toLocaleDateString("vi-VN") : "Đã vào lớp",
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => <Tag color="success">{status || "Chính thức"}</Tag>,
      },
    ];

    return (
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <Title level={5} style={{ margin: 0 }}>
                👥 Danh sách học sinh ({filteredStudents.length})
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Danh sách các tài khoản học sinh đã được Admin xếp vào lớp học.
              </Text>
            </div>

            <Input
              placeholder="Tìm kiếm theo tên hoặc email học sinh..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 280, borderRadius: 8 }}
              allowClear
            />
          </div>
        }
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey={(record, index) => record._id || `${index}`}
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchQuery
                    ? "Không tìm thấy học sinh nào phù hợp từ khóa!"
                    : "Lớp học chưa có học sinh nào."
                }
              />
            ),
          }}
        />
      </Card>
    );
  }
);

TeacherStudentTableTab.displayName = "TeacherStudentTableTab";
