import { Avatar, Button, Empty, Table, Tag, Tooltip, Typography } from "antd";
import {
  EyeOutlined,
  UserAddOutlined,
  SwapOutlined,
  UserDeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { AccountRecord, ClassRecord, CourseRecord } from "./teacherAssignment.types";
import { formatScheduleDays, formatScheduleTime } from "./teacherAssignmentUtils";

interface TeacherAssignmentTableProps {
  data: ClassRecord[];
  loading: boolean;
  courses: CourseRecord[];
  teachers: AccountRecord[];
  onView: (record: ClassRecord) => void;
  onAssign: (record: ClassRecord) => void;
  onChange: (record: ClassRecord) => void;
  onRemove: (record: ClassRecord) => void;
}

const getLearningModeColor = (mode: string) => {
  switch (mode) {
    case "Offline":
      return "cyan";
    case "Online":
      return "purple";
    case "Hybrid":
      return "geekblue";
    default:
      return "default";
  }
};

const TeacherAssignmentTable = ({
  data,
  loading,
  courses,
  teachers,
  onView,
  onAssign,
  onChange,
  onRemove,
}: TeacherAssignmentTableProps) => {
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const columns = [
    {
      title: "Class",
      key: "class",
      width: 220,
      ellipsis: true,
      render: (_: unknown, record: ClassRecord) => (
        <div>
          <Typography.Text strong style={{ display: "block" }}>
            {record.className}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.classCode}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Course",
      dataIndex: "courseId",
      key: "courseId",
      width: 180,
      ellipsis: true,
      render: (courseId: string) => {
        const course = courseMap.get(courseId);
        return course ? course.courseName : courseId;
      },
    },
    {
      title: "Teacher",
      dataIndex: "teacherId",
      key: "teacherId",
      width: 200,
      ellipsis: true,
      render: (teacherId?: string | null) => {
        if (!teacherId) {
          return <Tag color="orange">Unassigned</Tag>;
        }
        const teacher = teacherMap.get(teacherId);
        if (!teacher) {
          return <Typography.Text type="secondary">ID: {teacherId}</Typography.Text>;
        }
        return (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar size="small" src={teacher.avatar} icon={<UserOutlined />}>
              {teacher.fullName.charAt(0)}
            </Avatar>
            <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              <Typography.Text strong style={{ display: "block", fontSize: 13, lineHeight: 1.2 }}>
                {teacher.fullName}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                {teacher.email}
              </Typography.Text>
            </div>
          </div>
        );
      },
    },
    {
      title: "Schedule",
      key: "schedule",
      width: 200,
      render: (_: unknown, record: ClassRecord) => {
        const days = formatScheduleDays(record.schedule?.days);
        const time = formatScheduleTime(record.schedule?.startTime, record.schedule?.endTime);
        return (
          <div>
            <Typography.Text style={{ display: "block", fontSize: 13 }}>{days}</Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {time}
            </Typography.Text>
          </div>
        );
      },
    },
    {
      title: "Students",
      key: "students",
      width: 100,
      align: "center" as const,
      render: (_: unknown, record: ClassRecord) => (
        <Typography.Text style={{ fontSize: 13 }}>
          {record.currentStudents}/{record.maxStudents}
        </Typography.Text>
      ),
    },
    {
      title: "Teaching Mode",
      dataIndex: "learningMode",
      key: "learningMode",
      width: 130,
      render: (mode: string) => <Tag color={getLearningModeColor(mode)}>{mode}</Tag>,
    },
    {
      title: "Assignment Status",
      key: "assignmentStatus",
      width: 140,
      render: (_: unknown, record: ClassRecord) =>
        record.teacherId ? <Tag color="green">Assigned</Tag> : <Tag color="orange">Unassigned</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 140,
      align: "right" as const,
      render: (_: unknown, record: ClassRecord) => {
        const isAssigned = !!record.teacherId;

        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <Tooltip title="View Details">
              <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
            </Tooltip>

            {!isAssigned ? (
              <Tooltip title="Assign Teacher">
                <Button
                  size="small"
                  type="primary"
                  icon={<UserAddOutlined />}
                  onClick={() => onAssign(record)}
                />
              </Tooltip>
            ) : (
              <>
                <Tooltip title="Change Teacher">
                  <Button size="small" icon={<SwapOutlined />} onClick={() => onChange(record)} />
                </Tooltip>
                <Tooltip title="Remove Assignment">
                  <Button
                    size="small"
                    danger
                    icon={<UserDeleteOutlined />}
                    onClick={() => onRemove(record)}
                  />
                </Tooltip>
              </>
            )}
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
      pagination={{ pageSize: 6 }}
      scroll={{ x: 1150 }}
      locale={{ emptyText: <Empty description="No class assignments found" /> }}
    />
  );
};

export default TeacherAssignmentTable;
