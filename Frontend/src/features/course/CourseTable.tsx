import { Avatar, Button, Empty, Table, Tooltip } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  SyncOutlined,
  DeleteOutlined,
  UnlockOutlined,
} from "@ant-design/icons";
import type { CourseRecord } from "./course.types";

interface CourseTableProps {
  data: CourseRecord[];
  loading: boolean;
  onView: (course: CourseRecord) => void;
  onEdit: (course: CourseRecord) => void;
  onChangeStatus?: (course: CourseRecord) => void;
  onDelete?: (course: CourseRecord) => void;
  onRestore?: (course: CourseRecord) => void;
  onPermanentDelete?: (course: CourseRecord) => void;
  isTrash?: boolean;
  pagination?: any;
  onChange?: (pagination: any, filters: any, sorter: any) => void;
}

const getStatusColor = (status: CourseRecord["status"]) => {
  switch (status) {
    case "Published":
      return "green";
    case "Draft":
      return "orange";
    case "Closed":
      return "red";
    default:
      return "default";
  }
};

const CourseTable = ({
  data,
  loading,
  onView,
  onEdit,
  onChangeStatus,
  onDelete,
  onRestore,
  onPermanentDelete,
  isTrash,
  pagination,
  onChange,
}: CourseTableProps) => {
  const columns = [
    {
      title: "Thumbnail",
      dataIndex: "thumbnail",
      key: "thumbnail",
      width: 70,
      render: (_: string, record: CourseRecord) => (
        <Avatar shape="square" src={record.thumbnail || undefined}>
          {record.courseName.charAt(0).toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: "Course Name",
      dataIndex: "courseName",
      key: "courseName",
      sorter: true,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
    },
    {
      title: "Duration",
      key: "duration",
      render: (_: unknown, record: CourseRecord) => `${record.durationWeeks} weeks`,
    },
    {
      title: "Tuition Fee",
      key: "tuitionFee",
      render: (_: unknown, record: CourseRecord) => `${record.tuitionFee.toLocaleString()} VND`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: CourseRecord["status"]) => (
        <span style={{ color: getStatusColor(status) }}>{status}</span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => new Date(value).toLocaleDateString("en-GB"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: CourseRecord) => (
        <div style={{ display: "flex", gap: 6 }}>
          {isTrash ? (
            <>
              {onRestore && (
                <Tooltip title="Restore">
                  <Button
                    size="small"
                    icon={<UnlockOutlined />}
                    onClick={() => onRestore(record)}
                  />
                </Tooltip>
              )}
              {onPermanentDelete && (
                <Tooltip title="Permanent Delete">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onPermanentDelete(record)}
                  />
                </Tooltip>
              )}
            </>
          ) : (
            <>
              <Tooltip title="View">
                <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
              </Tooltip>
              <Tooltip title="Edit">
                <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
              </Tooltip>
              {onChangeStatus && (
                <Tooltip title="Change Status">
                  <Button
                    size="small"
                    icon={<SyncOutlined />}
                    onClick={() => onChangeStatus(record)}
                  />
                </Tooltip>
              )}
              {onDelete && (
                <Tooltip title="Delete">
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onDelete(record)}
                  />
                </Tooltip>
              )}
            </>
          )}
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
      pagination={pagination}
      onChange={onChange}
      locale={{
        emptyText: loading ? null : <Empty description="No courses found" />,
      }}
    />
  );
};

export default CourseTable;
