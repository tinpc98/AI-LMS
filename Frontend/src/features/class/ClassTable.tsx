import { Button, Empty, Table, Tag, Tooltip } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  SyncOutlined,
  DeleteOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import type { ClassRecord, ClassStatus, Pagination } from "./class.types";

interface ClassTableProps {
  data: ClassRecord[];
  loading: boolean;
  activeTab?: string;
  pagination?: Pagination;
  onChange?: (pagination: any, filters: any, sorter: any) => void;
  courseOptions: Array<{ id: string; label: string }>;
  teacherOptions: Array<{ id: string; label: string }>;
  onView: (record: ClassRecord) => void;
  onEdit: (record: ClassRecord) => void;
  onChangeStatus: (record: ClassRecord) => void;
  onDelete: (record: ClassRecord) => void;
  onRestore?: (record: ClassRecord) => void;
  onForceDelete?: (record: ClassRecord) => void;
}

const getStatusColor = (status: ClassStatus) => {
  switch (status) {
    case "Ongoing":
    case "Ready":
      return "green";
    case "Draft":
      return "blue";
    case "Completed":
      return "default";
    case "Cancelled":
    case "Archived":
      return "red";
    default:
      return "default";
  }
};

const ClassTable = ({
  data,
  loading,
  activeTab,
  pagination,
  onChange,
  courseOptions,
  teacherOptions,
  onView,
  onEdit,
  onChangeStatus,
  onDelete,
  onRestore,
  onForceDelete,
}: ClassTableProps) => {
  const columns = [
    {
      title: "Class Code",
      dataIndex: "classCode",
      key: "classCode",
      width: 110,
      ellipsis: true,
      sorter: true,
    },
    {
      title: "Class Name",
      dataIndex: "className",
      key: "className",
      width: 220,
      ellipsis: true,
      sorter: true,
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
      dataIndex: "teacher",
      key: "teacher",
      width: 150,
      ellipsis: true,
      render: (teacher?: { id: string; fullName: string } | null) =>
        teacher ? teacher.fullName : "—",
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
        const days = record.schedule?.days?.join(", ");
        const timeRange = `${record.schedule?.startTime || ""}-${record.schedule?.endTime || ""}`;
        return `${days || "—"} • ${timeRange !== "-" ? timeRange : "—"}`;
      },
    },
    {
      title: "Students",
      key: "students",
      width: 90,
      sorter: true,
      dataIndex: "maxStudents", // mapping sorter to maxStudents temporarily as currentStudents is not explicitly in whitelist
      render: (_: unknown, record: ClassRecord) =>
        `${record.currentStudents}/${record.maxStudents}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      sorter: true,
      render: (status: ClassStatus) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Duration",
      key: "duration",
      width: 140,
      sorter: true,
      dataIndex: "startDate", // used for sorting
      render: (_: unknown, record: ClassRecord) =>
        `${new Date(record.startDate).toLocaleDateString("vi-VN")} → ${new Date(record.endDate).toLocaleDateString("vi-VN")}`,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 130,
      render: (_: unknown, record: ClassRecord) => {
        if (activeTab === "trash") {
          return (
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <Tooltip title="View">
                <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
              </Tooltip>
              {onRestore && (
                <Tooltip title="Restore">
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    icon={<UndoOutlined />}
                    onClick={() => onRestore(record)}
                  />
                </Tooltip>
              )}
              {onForceDelete && (
                <Tooltip title="Permanent Delete">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onForceDelete(record)}
                  />
                </Tooltip>
              )}
            </div>
          );
        }

        return (
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
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(record)}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      onChange={onChange}
      pagination={
        pagination
          ? {
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
            }
          : false
      }
      scroll={{ x: 1200 }}
      locale={{
        emptyText: loading ? null : <Empty description="No classes found" />,
      }}
    />
  );
};

export default ClassTable;
