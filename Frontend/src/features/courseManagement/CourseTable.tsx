import { Avatar, Button, Empty, Table, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, SyncOutlined, DeleteOutlined } from "@ant-design/icons";
import type { CourseRecord } from "./course.types";

interface CourseTableProps {
  data: CourseRecord[];
  loading: boolean;
  onView: (course: CourseRecord) => void;
  onEdit: (course: CourseRecord) => void;
  onChangeStatus: (course: CourseRecord) => void;
  onDelete: (course: CourseRecord) => void;
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

const CourseTable = ({ data, loading, onView, onEdit, onChangeStatus, onDelete }: CourseTableProps) => {
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
      sorter: (a: CourseRecord, b: CourseRecord) => a.courseName.localeCompare(b.courseName),
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
      render: (status: CourseRecord["status"]) => <span style={{ color: getStatusColor(status) }}>{status}</span>,
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
      locale={{ emptyText: <Empty description="No courses found" /> }}
    />
  );
};

export default CourseTable;
