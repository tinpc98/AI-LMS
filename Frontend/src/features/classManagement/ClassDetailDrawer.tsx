import { Descriptions, Drawer, Tag } from "antd";
import type { ClassRecord } from "./class.types";

interface ClassDetailDrawerProps {
  open: boolean;
  classRecord?: ClassRecord;
  onClose: () => void;
  courseOptions: Array<{ id: string; label: string }>;
  teacherOptions: Array<{ id: string; label: string }>;
}

const ClassDetailDrawer = ({ open, classRecord, onClose, courseOptions, teacherOptions }: ClassDetailDrawerProps) => {
  return (
    <Drawer title="Class Details" placement="right" onClose={onClose} open={open} width={480}>
      {classRecord ? (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Class Name">{classRecord.className}</Descriptions.Item>
          <Descriptions.Item label="Class Code">{classRecord.classCode || "—"}</Descriptions.Item>
          <Descriptions.Item label="Course">{courseOptions.find((item) => item.id === classRecord.courseId)?.label || classRecord.courseId}</Descriptions.Item>
          <Descriptions.Item label="Teacher">{classRecord.teacher ? classRecord.teacher.fullName : "—"}</Descriptions.Item>
          <Descriptions.Item label="Learning Mode">{classRecord.learningMode}</Descriptions.Item>
          <Descriptions.Item label="Room">{classRecord.classRoom || "—"}</Descriptions.Item>
          <Descriptions.Item label="Meeting Room ID">{classRecord.meetingRoomId || "—"}</Descriptions.Item>
          <Descriptions.Item label="Join Code">{classRecord.joinCode || "—"}</Descriptions.Item>
          <Descriptions.Item label="Google Meet Link">
            {classRecord.googleMeetLink ? (
              <a href={classRecord.googleMeetLink} target="_blank" rel="noopener noreferrer">
                Link
              </a>
            ) : (
              "—"
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Schedule">{`${classRecord.schedule?.days?.join(", ") || ""} • ${classRecord.schedule?.startTime || ""}-${classRecord.schedule?.endTime || ""}`}</Descriptions.Item>
          <Descriptions.Item label="Students">{`${classRecord.currentStudents}/${classRecord.maxStudents}`}</Descriptions.Item>
          <Descriptions.Item label="Enrollment">{classRecord.isEnrollmentOpen ? "Open" : "Closed"}</Descriptions.Item>
          <Descriptions.Item label="Description">{classRecord.description || "—"}</Descriptions.Item>
          <Descriptions.Item label="Notes">{classRecord.note || "—"}</Descriptions.Item>
          <Descriptions.Item label="Status"><Tag>{classRecord.status}</Tag></Descriptions.Item>
          <Descriptions.Item label="Start Date">{new Date(classRecord.startDate).toLocaleDateString("vi-VN")}</Descriptions.Item>
          <Descriptions.Item label="End Date">{new Date(classRecord.endDate).toLocaleDateString("vi-VN")}</Descriptions.Item>
          <Descriptions.Item label="Created At">{new Date(classRecord.createdAt).toLocaleString("vi-VN")}</Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
};

export default ClassDetailDrawer;
