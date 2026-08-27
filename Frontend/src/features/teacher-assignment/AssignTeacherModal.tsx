import { useMemo, useState } from "react";
import { Descriptions, Modal, Select, Typography } from "antd";
import type { AccountRecord, ClassRecord, CourseRecord } from "./teacherAssignment.types";
import {
  checkScheduleConflict,
  formatScheduleDays,
  formatScheduleTime,
  getCourseSubjectName,
  buildTeacherOptionsData,
} from "./teacherAssignmentUtils";
import ConflictAlert from "./ConflictAlert";
import TeacherOptionLabel from "./TeacherOptionLabel";

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

  // Xoá lựa chọn cũ mỗi lần modal được mở lại.
  //
  // Trước đây việc này nằm trong useEffect, nên khi mở lại modal có một nhịp render hiển
  // thị giáo viên đã chọn ở lần trước rồi mới xoá. Modal vẫn nằm trong cây React kể cả lúc
  // đóng (antd cần vậy để chạy hiệu ứng), nên state không tự mất đi.
  //
  // Cách này là mẫu "adjust state during render" của React: đặt state ngay trong thân
  // component khi phát hiện prop đổi. React huỷ lượt render đang chạy và chạy lại ngay,
  // TRƯỚC khi ghi ra DOM — nên không có nhịp nào hiển thị dữ liệu cũ.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setSelectedTeacherId(null);
  }

  const course = useMemo(() => {
    if (!classRecord) return undefined;
    return courses.find((c) => c.id === classRecord.courseId);
  }, [classRecord, courses]);

  const courseName = course?.name || classRecord?.courseId || "—";
  const subjectName = getCourseSubjectName(course);

  const conflictResult = useMemo(() => {
    if (!classRecord || !selectedTeacherId) {
      return { hasConflict: false };
    }
    return checkScheduleConflict(classRecord, selectedTeacherId, allClasses);
  }, [classRecord, selectedTeacherId, allClasses]);

  const teacherOptions = useMemo(() => {
    const optionsData = buildTeacherOptionsData(teachers, teachingLoadMap, subjectName);
    return optionsData.map((data) => ({
      value: data.value,
      searchValue: data.searchValue,
      label: <TeacherOptionLabel data={data} />,
    }));
  }, [teachers, teachingLoadMap, subjectName]);

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
