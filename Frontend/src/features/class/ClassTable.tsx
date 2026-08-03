import { Button, Empty, Table, Tag, Tooltip } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  SyncOutlined,
  DeleteOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import type { ClassRecord, ClassStatus, Pagination } from "./class.types";
import {
  formatClassStatus,
  formatLearningMode,
  formatScheduleDays,
} from "../../shared/utils/labelFormatters";
import { StatusBadge } from "../../shared/components/StatusBadge";

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
      title: "Mã lớp",
      dataIndex: "classCode",
      key: "classCode",
      width: 110,
      ellipsis: true,
      sorter: true,
    },
    {
      title: "Tên lớp học",
      dataIndex: "className",
      key: "className",
      width: 220,
      ellipsis: true,
      sorter: true,
    },
    {
      title: "Khóa học",
      dataIndex: "courseId",
      key: "courseId",
      width: 180,
      ellipsis: true,
      render: (value: string) => courseOptions.find((item) => item.id === value)?.label || value,
    },
    {
      title: "Giảng viên",
      dataIndex: "teacher",
      key: "teacher",
      width: 150,
      ellipsis: true,
      render: (teacher?: { id: string; fullName: string } | null) =>
        teacher ? teacher.fullName : "—",
    },
    {
      title: "Hình thức",
      dataIndex: "learningMode",
      key: "learningMode",
      width: 120,
      ellipsis: true,
      render: (mode: string) => <Tag color="blue">{formatLearningMode(mode)}</Tag>,
    },
    {
      title: "Lịch học",
      key: "schedule",
      width: 200,
      ellipsis: true,
      render: (_: unknown, record: ClassRecord) => {
        const days = formatScheduleDays(record.schedule?.days, true);
        const timeRange = `${record.schedule?.startTime || ""}-${record.schedule?.endTime || ""}`;
        return `${days !== "Chưa xếp lịch" ? days : "—"} • ${timeRange !== "-" ? timeRange : "—"}`;
      },
    },
    {
      title: "Sĩ số",
      key: "students",
      width: 90,
      sorter: true,
      dataIndex: "maxStudents",
      render: (_: unknown, record: ClassRecord) =>
        `${record.currentStudents}/${record.maxStudents}`,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      sorter: true,
      render: (status: ClassStatus) => <StatusBadge status={status} />,
    },
    {
      title: "Thời gian",
      key: "duration",
      width: 160,
      sorter: true,
      dataIndex: "startDate",
      render: (_: unknown, record: ClassRecord) =>
        `${new Date(record.startDate).toLocaleDateString("vi-VN")} → ${new Date(record.endDate).toLocaleDateString("vi-VN")}`,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right" as const,
      width: 130,
      render: (_: unknown, record: ClassRecord) => {
        if (activeTab === "trash") {
          return (
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <Tooltip title="Xem chi tiết">
                <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
              </Tooltip>
              {onRestore && (
                <Tooltip title="Khôi phục">
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
                <Tooltip title="Xóa vĩnh viễn">
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
            <Tooltip title="Xem chi tiết">
              <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
            </Tooltip>
            <Tooltip title="Chỉnh sửa">
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
            </Tooltip>
            <Tooltip title="Đổi trạng thái">
              <Button size="small" icon={<SyncOutlined />} onClick={() => onChangeStatus(record)} />
            </Tooltip>
            <Tooltip title="Xóa lớp">
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
