import { useEffect, useMemo, useState } from "react";
import { Avatar, Card, Descriptions, Modal, Select, Tag, Typography } from "antd";
import { UserOutlined, SwapOutlined } from "@ant-design/icons";
import type { AccountRecord, ClassRecord, CourseRecord } from "./teacherAssignment.types";
import { checkScheduleConflict, formatScheduleDays, formatScheduleTime } from "./teacherAssignmentUtils";
import ConflictAlert from "./ConflictAlert";

interface ChangeTeacherModalProps {
  open: boolean;
  classRecord?: ClassRecord;
  teachers: AccountRecord[];
  courses: CourseRecord[];
  allClasses: ClassRecord[];
  teachingLoadMap: Record<string, number>;
  onChange: (classId: string, newTeacherId: string) => Promise<void>;
  onCancel: () => void;
}

const ChangeTeacherModal = ({
  open,
  classRecord,
  teachers,
  courses,
  allClasses,
  teachingLoadMap,
  onChange,
  onCancel,
}: ChangeTeacherModalProps) => {
  const [newTeacherId, setNewTeacherId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && classRecord) {
      setNewTeacherId(null);
    }
  }, [open, classRecord]);

  const currentTeacher = useMemo(() => {
    if (!classRecord?.teacherId) return null;
    return teachers.find((t) => t.id === classRecord.teacherId) || null;
  }, [classRecord, teachers]);

  const courseName = useMemo(() => {
    if (!classRecord) return "—";
    const found = courses.find((c) => c.id === classRecord.courseId);
    return found ? found.courseName : classRecord.courseId;
  }, [classRecord, courses]);

  const conflictResult = useMemo(() => {
    if (!classRecord || !newTeacherId) {
      return { hasConflict: false };
    }
    return checkScheduleConflict(classRecord, newTeacherId, allClasses);
  }, [classRecord, newTeacherId, allClasses]);

  const availableTeachers = useMemo(() => {
    // Exclude current teacher from selection dropdown if desired or keep all
    return teachers.filter((t) => t.id !== classRecord?.teacherId);
  }, [teachers, classRecord]);

  const teacherOptions = useMemo(() => {
    return availableTeachers.map((teacher) => {
      const load = teachingLoadMap[teacher.id] || 0;
      const statusText = load >= 3 ? "Busy" : "Available";

      return {
        value: teacher.id,
        searchValue: `${teacher.fullName} ${teacher.email}`.toLowerCase(),
        label: (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "4px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
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
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                {load} Classes
              </Tag>
              <Tag color={statusText === "Available" ? "green" : "orange"} style={{ margin: 0, fontSize: 11 }}>
                {statusText}
              </Tag>
            </div>
          </div>
        ),
      };
    });
  }, [availableTeachers, teachingLoadMap]);

  const handleSave = async () => {
    if (!classRecord || !newTeacherId || conflictResult.hasConflict) return;
    setSubmitting(true);
    try {
      await onChange(classRecord.id, newTeacherId);
    } finally {
      setSubmitting(false);
    }
  };

  if (!classRecord) return null;

  return (
    <Modal
      title={
        <span>
          <SwapOutlined style={{ marginRight: 8, color: "#1890ff" }} /> Change Assigned Teacher
        </span>
      }
      open={open}
      onOk={handleSave}
      onCancel={onCancel}
      confirmLoading={submitting}
      okButtonProps={{ disabled: !newTeacherId || conflictResult.hasConflict }}
      destroyOnClose
      width={580}
    >
      <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Class">
          <Typography.Text strong>{classRecord.className}</Typography.Text> ({classRecord.classCode})
        </Descriptions.Item>
        <Descriptions.Item label="Course">{courseName}</Descriptions.Item>
        <Descriptions.Item label="Schedule">
          {formatScheduleDays(classRecord.schedule?.days)} • {formatScheduleTime(classRecord.schedule?.startTime, classRecord.schedule?.endTime)}
        </Descriptions.Item>
      </Descriptions>

      <Card size="small" title="Current Teacher" style={{ marginBottom: 16, background: "#f8fafc" }}>
        {currentTeacher ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Avatar src={currentTeacher.avatar} icon={<UserOutlined />}>
              {currentTeacher.fullName.charAt(0)}
            </Avatar>
            <div>
              <Typography.Text strong style={{ display: "block" }}>
                {currentTeacher.fullName}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {currentTeacher.email} • {teachingLoadMap[currentTeacher.id] || 0} active classes
              </Typography.Text>
            </div>
          </div>
        ) : (
          <Typography.Text type="secondary">No teacher currently assigned.</Typography.Text>
        )}
      </Card>

      <div>
        <Typography.Text style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
          Select New Teacher:
        </Typography.Text>
        <Select
          style={{ width: "100%" }}
          placeholder="Choose replacement teacher..."
          value={newTeacherId}
          onChange={(val) => setNewTeacherId(val)}
          options={teacherOptions}
          filterOption={(input, option) =>
            (option?.searchValue as string)?.includes(input.toLowerCase())
          }
          showSearch
        />
      </div>

      <ConflictAlert conflict={conflictResult} />
    </Modal>
  );
};

export default ChangeTeacherModal;
