import React from "react";
import { Table, Tag, Button, Avatar, Card, Typography, Tooltip, Progress, Space } from "antd";
import { UserOutlined, EyeOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { ColumnsType } from "antd/es/table";
import type { TodayClassRecord } from "../dashboard.types";

const { Title, Text } = Typography;

interface TodayClassesTableProps {
  classes: TodayClassRecord[];
  loading?: boolean;
}

export const TodayClassesTable: React.FC<TodayClassesTableProps> = ({ classes, loading }) => {
  const navigate = useNavigate();

  const columns: ColumnsType<TodayClassRecord> = [
    {
      title: "Lớp học",
      dataIndex: "className",
      key: "className",
      render: (text, record) => (
        <div>
          <Text style={{ fontWeight: 600, color: "#1f1f1f", display: "block" }}>
            {text}
          </Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.classCode} • {record.days}
          </Text>
        </div>
      ),
    },
    {
      title: "Giáo viên",
      dataIndex: "teacherName",
      key: "teacherName",
      render: (teacherName, record) => (
        <Space size="small">
          <Avatar
            src={record.teacherAvatar}
            icon={<UserOutlined />}
            style={{ backgroundColor: teacherName === "Chưa phân công" ? "#faad14" : "#1677ff" }}
          />
          <Text
            style={{
              fontSize: "13px",
              color: teacherName === "Chưa phân công" ? "#d48806" : "#262626",
              fontWeight: teacherName === "Chưa phân công" ? 500 : 400,
            }}
          >
            {teacherName}
          </Text>
        </Space>
      ),
    },
    {
      title: "Khóa học",
      dataIndex: "courseName",
      key: "courseName",
      render: (text) => (
        <Text style={{ fontSize: "13px", color: "#595959" }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      render: (time) => <Tag color="blue" style={{ borderRadius: "4px" }}>{time}</Tag>,
    },
    {
      title: "Sĩ số",
      key: "students",
      render: (_, record) => {
        const percent = Math.round((record.currentStudents / record.maxStudents) * 100);
        return (
          <div style={{ width: 120 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: 2 }}>
              <span>{record.currentStudents}/{record.maxStudents}</span>
              <span style={{ color: "#8c8c8c" }}>{percent}%</span>
            </div>
            <Progress percent={percent} size="small" showInfo={false} strokeColor={percent >= 100 ? "#ff4d4f" : "#1677ff"} />
          </div>
        );
      },
    },
    {
      title: "Hình thức",
      dataIndex: "learningMode",
      key: "learningMode",
      render: (mode: "Offline" | "Online" | "Hybrid") => {
        let color = "geekblue";
        if (mode === "Online") color = "purple";
        if (mode === "Hybrid") color = "cyan";
        return <Tag color={color} style={{ borderRadius: "4px" }}>{mode}</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        let color = "default";
        let label = status;
        if (status === "Active") {
          color = "success";
          label = "Đang hoạt động";
        } else if (status === "Upcoming") {
          color = "processing";
          label = "Sắp khai giảng";
        } else if (status === "Completed") {
          color = "warning";
          label = "Đã hoàn thành";
        } else if (status === "Cancelled") {
          color = "error";
          label = "Đã hủy";
        }
        return <Tag color={color} style={{ borderRadius: "6px" }}>{label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      align: "center",
      render: () => (
        <Tooltip title="Xem danh sách & chi tiết lớp">
          <Button
            type="text"
            icon={<EyeOutlined style={{ color: "#1677ff" }} />}
            onClick={() => navigate(`/admin/classes`)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <Card
        variant="borderless"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          marginBottom: "24px",
        }}
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Danh sách lớp học hôm nay & lịch học 🗓️
            </Title>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              Tổng hợp các lớp đang diễn ra và sắp khai giảng
            </Text>
          </div>

          <Button
            type="link"
            onClick={() => navigate("/admin/classes")}
            style={{ padding: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
          >
            Quản lý tất cả lớp <ArrowRightOutlined />
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={classes}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 5, showSizeChanger: false }}
          scroll={{ x: 800 }}
        />
      </Card>
    </motion.div>
  );
};
