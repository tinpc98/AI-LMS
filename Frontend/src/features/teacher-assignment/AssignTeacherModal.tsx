import { useEffect, useMemo, useState } from "react";
import { Avatar, Descriptions, Modal, Select, Tag, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import type { AccountRecord, ClassRecord, CourseRecord } from "./teacherAssignment.types";
import {
  checkScheduleConflict,
  formatScheduleDays,
  formatScheduleTime,
} from "./teacherAssignmentUtils";
import ConflictAlert from "./ConflictAlert";

interface AssignTeacherModalProps {
  open: boolean;
  classRecord?: ClassRecord;
  teachers: AccountRecord[];
  courses: CourseRecord[];
  allClasses: ClassRecord[];
  teachingLoadMap: Record<string, number>;
  onAssign: (classId: string, teacherId: string) => Promise<void>;
  onCancel: () => void;
}

const AssignTeacherModal = ({
  open,
  classRecord,
  teachers,
  courses,
  allClasses,
  teachingLoadMap,
  onAssign,
  onCancel,
}: AssignTeacherModalProps) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedTeacherId(null);
    }
  }, [open]);

  const courseName = useMemo(() => {
    if (!classRecord) return "—";
    const found = courses.find((c) => c.id === classRecord.courseId);
    return found ? found.courseName : classRecord.courseId;
  }, [classRecord, courses]);

  const conflictResult = useMemo(() => {
    if (!classRecord || !selectedTeacherId) {
      return { hasConflict: false };
    }
    return checkScheduleConflict(classRecord, selectedTeacherId, allClasses);
  }, [classRecord, selectedTeacherId, allClasses]);

  const teacherOptions = useMemo(() => {
    return teachers.map((teacher) => {
      const load = teachingLoadMap[teacher.id] || 0;
      const statusText = load >= 3 ? "Busy" : "Available";

      return {
        value: teacher.id,
        searchValue: `${teacher.fullName} ${teacher.email}`.toLowerCase(),
        label: (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "4px 0",
            }}
          >
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
              <Tag
                color={statusText === "Available" ? "green" : "orange"}
                style={{ margin: 0, fontSize: 11 }}
              >
                {statusText}
              </Tag>
            </div>
          </div>
        ),
      };
    });
  }, [teachers, teachingLoadMap]);

  const handleOk = async () => {
    if (!classRecord || !selectedTeacherId || conflictResult.hasConflict) return;
    setSubmitting(true);
    try {
      await onAssign(classRecord.id, selectedTeacherId);
    } finally {
      setSubmitting(false);
    }
  };

  if (!classRecord) return null;

  return (
    <Modal
      title="Assign Teacher to Class"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={submitting}
      okButtonProps={{ disabled: !selectedTeacherId || conflictResult.hasConflict }}
      destroyOnClose
      width={560}
    >
      <div style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="Class">
            <Typography.Text strong>{classRecord.className}</Typography.Text> (
            {classRecord.classCode})
          </Descriptions.Item>
          <Descriptions.Item label="Course">{courseName}</Descriptions.Item>
          <Descriptions.Item label="Schedule">
            {formatScheduleDays(classRecord.schedule?.days)} •{" "}
            {formatScheduleTime(classRecord.schedule?.startTime, classRecord.schedule?.endTime)}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <div style={{ marginTop: 16 }}>
        <Typography.Text style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
          Select Teacher:
        </Typography.Text>
        <Select
          style={{ width: "100%" }}
          placeholder="Choose a teacher from list..."
          value={selectedTeacherId}
          onChange={(val) => setSelectedTeacherId(val)}
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

export default AssignTeacherModal;
