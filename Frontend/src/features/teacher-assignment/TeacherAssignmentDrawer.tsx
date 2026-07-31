import { Avatar, Badge, Descriptions, Drawer, Tag, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { AccountRecord, ClassRecord, CourseRecord } from "./teacherAssignment.types";
import { formatScheduleDays, formatScheduleTime } from "./teacherAssignmentUtils";

interface TeacherAssignmentDrawerProps {
  open: boolean;
  classRecord?: ClassRecord;
  teacher?: AccountRecord | null;
  courses: CourseRecord[];
  onClose: () => void;
}

const TeacherAssignmentDrawer = ({
  open,
  classRecord,
  teacher,
  courses,
  onClose,
}: TeacherAssignmentDrawerProps) => {
  if (!classRecord) return null;

  const courseName =
    courses.find((c) => c.id === classRecord.courseId)?.courseName || classRecord.courseId;
  const isAssigned = !!classRecord.teacherId;

  return (
    <Drawer
      title="Class Assignment Details"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
    >
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {classRecord.className}
        </Typography.Title>
        <Typography.Text type="secondary">{classRecord.classCode}</Typography.Text>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <Tag color={isAssigned ? "green" : "orange"}>
            {isAssigned ? "Assigned" : "Unassigned"}
          </Tag>
          <Tag color="blue">{classRecord.learningMode}</Tag>
          <Tag>{classRecord.status}</Tag>
        </div>
      </div>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Course">
          <Typography.Text strong>{courseName}</Typography.Text>
        </Descriptions.Item>

        <Descriptions.Item label="Assigned Teacher">
          {isAssigned && teacher ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar src={teacher.avatar} icon={<UserOutlined />}>
                {teacher.fullName.charAt(0)}
              </Avatar>
              <div>
                <Typography.Text strong style={{ display: "block" }}>
                  {teacher.fullName}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                  {teacher.email}
                </Typography.Text>
                {teacher.phone && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Phone: {teacher.phone}
                  </Typography.Text>
                )}
              </div>
            </div>
          ) : (
            <Badge status="warning" text="No teacher assigned yet" />
          )}
        </Descriptions.Item>

        <Descriptions.Item label="Schedule Days">
          {formatScheduleDays(classRecord.schedule?.days)}
        </Descriptions.Item>

        <Descriptions.Item label="Class Hours">
          {formatScheduleTime(classRecord.schedule?.startTime, classRecord.schedule?.endTime)}
        </Descriptions.Item>

        <Descriptions.Item label="Learning Mode">
          <Tag
            color={
              classRecord.learningMode === "Offline"
                ? "cyan"
                : classRecord.learningMode === "Online"
                  ? "purple"
                  : "geekblue"
            }
          >
            {classRecord.learningMode}
          </Tag>
        </Descriptions.Item>

        <Descriptions.Item label="Classroom Location">
          {classRecord.classRoom || "N/A"}
        </Descriptions.Item>

        <Descriptions.Item label="Students Enrolled">
          <Typography.Text strong>
            {classRecord.currentStudents} / {classRecord.maxStudents}
          </Typography.Text>
        </Descriptions.Item>

        <Descriptions.Item label="Class Duration">
          {new Date(classRecord.startDate).toLocaleDateString("vi-VN")} →{" "}
          {new Date(classRecord.endDate).toLocaleDateString("vi-VN")}
        </Descriptions.Item>

        <Descriptions.Item label="Description">
          {classRecord.description || "No description provided."}
        </Descriptions.Item>

        {classRecord.note && (
          <Descriptions.Item label="Notes">{classRecord.note}</Descriptions.Item>
        )}
      </Descriptions>
    </Drawer>
  );
};

export default TeacherAssignmentDrawer;
