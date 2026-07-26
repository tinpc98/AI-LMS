import { Button, Empty, Table, Tag, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, SyncOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ClassRecord, ClassStatus } from "./class.types";

interface ClassTableProps {
  data: ClassRecord[];
  loading: boolean;
  courseOptions: Array<{ id: string; label: string }>;
  teacherOptions: Array<{ id: string; label: string }>;
  onView: (record: ClassRecord) => void;
  onEdit: (record: ClassRecord) => void;
  onChangeStatus: (record: ClassRecord) => void;
  onDelete: (record: ClassRecord) => void;
}

const getStatusColor = (status: ClassStatus) => {
  switch (status) {
    case "Active":
      return "green";
    case "Upcoming":
      return "blue";
    case "Completed":
      return "default";
    case "Cancelled":
      return "red";
    default:
      return "default";
  }
};

const ClassTable = ({ data, loading, courseOptions, teacherOptions, onView, onEdit, onChangeStatus, onDelete }: ClassTableProps) => {
  const columns = [
    {
      title: "Class Code",
      dataIndex: "classCode",
      key: "classCode",
      width: 110,
      ellipsis: true,
    },
    {
      title: "Class Name",
      dataIndex: "className",
      key: "className",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Course",
      dataIndex: "courseId",
      key: "courseId",
      width: 180,
      ellipsis: true,
      render: (value: string) => courseOptions.find((item) => item.id === value)?.label || value,
    },
    {
      title: "Teacher",
      dataIndex: "teacherId",
      key: "teacherId",
      width: 150,
      ellipsis: true,
      render: (value?: string | null) => (value ? teacherOptions.find((item) => item.id === value)?.label || value : "—"),
    },
    {
      title: "Learning Mode",
      dataIndex: "learningMode",
      key: "learningMode",
      width: 110,
      ellipsis: true,
    },
    {
      title: "Schedule",
      key: "schedule",
      width: 180,
      ellipsis: true,
      render: (_: unknown, record: ClassRecord) => {
        const days = record.schedule.days.join(", ");
        const timeRange = `${record.schedule.startTime}-${record.schedule.endTime}`;
        return `${days || "—"} • ${timeRange || "—"}`;
      },
    },
    {
      title: "Students",
      key: "students",
      width: 90,
      render: (_: unknown, record: ClassRecord) => `${record.currentStudents}/${record.maxStudents}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: ClassStatus) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Duration",
      key: "duration",
      width: 140,
      render: (_: unknown, record: ClassRecord) => `${new Date(record.startDate).toLocaleDateString("vi-VN")} → ${new Date(record.endDate).toLocaleDateString("vi-VN")}`,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 130,
      render: (_: unknown, record: ClassRecord) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Tooltip title="View">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title="Change Status">
            <Button size="small" icon={<SyncOutlined />} onClick={() => onChangeStatus(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 6 }}
      scroll={{ x: 1200 }}
      locale={{
        emptyText: loading ? null : (
          <Empty description="No classes found" />
        ),
      }}
    />
  );
};

export default ClassTable;
