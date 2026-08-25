import { Avatar, Tag, Tooltip, Typography } from "antd";
import { UserOutlined, CheckCircleFilled, ClockCircleOutlined } from "@ant-design/icons";
import type { TeacherOptionData } from "./teacherAssignmentUtils";
import { formatAvailabilitySummary } from "./teacherAssignmentUtils";

const MAX_SUBJECT_TAGS = 2;

interface TeacherOptionLabelProps {
  data: TeacherOptionData;
}

// Dùng chung cho AssignTeacherModal và ChangeTeacherModal — trước đây hai modal copy y hệt
// nhau khối JSX render option giáo viên; tách ra một chỗ để không phải sửa 2 nơi khi thêm
// thông tin chuyên môn/lịch rảnh.
const TeacherOptionLabel = ({ data }: TeacherOptionLabelProps) => {
  const { teacher, load, matchesSubject } = data;
  const statusText = load >= 3 ? "Busy" : "Available";
  const subjects = teacher.teachingSubjects || [];
  const extraSubjectCount = Math.max(0, subjects.length - MAX_SUBJECT_TAGS);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "6px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
        <Avatar size="small" src={teacher.avatar} icon={<UserOutlined />}>
          {teacher.fullName.charAt(0)}
        </Avatar>
        <div style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Typography.Text strong style={{ fontSize: 13, lineHeight: 1.2 }}>
              {teacher.fullName}
            </Typography.Text>
            {matchesSubject && (
              <Tooltip title="Có khai báo chuyên môn khớp với môn học của lớp này">
                <CheckCircleFilled
                  style={{ color: "var(--color-success-base, #52c41a)", fontSize: 12 }}
                />
              </Tooltip>
            )}
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 11, display: "block" }}>
            {teacher.email}
          </Typography.Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
            {subjects.slice(0, MAX_SUBJECT_TAGS).map((subject) => (
              <Tag
                key={subject}
                color="purple"
                style={{ margin: 0, fontSize: 10, lineHeight: "16px" }}
              >
                {subject}
              </Tag>
            ))}
            {extraSubjectCount > 0 && (
              <Tag style={{ margin: 0, fontSize: 10, lineHeight: "16px" }}>
                +{extraSubjectCount}
              </Tag>
            )}
            <Tooltip title="Lịch rảnh giáo viên tự khai báo trong hồ sơ cá nhân">
              <Tag
                icon={<ClockCircleOutlined />}
                style={{ margin: 0, fontSize: 10, lineHeight: "16px" }}
              >
                {formatAvailabilitySummary(teacher.availabilitySchedule)}
              </Tag>
            </Tooltip>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
          {load} Classes
        </Tag>
        <Tag
          color={statusText === "Available" ? "green" : "orange"}
          style={{ margin: 0, fontSize: 11 }}
        >
          {statusText}
        </Tag>
      </div>
    </div>
  );
};

export default TeacherOptionLabel;
