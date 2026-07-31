import { Descriptions, Drawer } from "antd";
import type { CourseRecord } from "./course.types";

interface CourseDetailDrawerProps {
  open: boolean;
  course?: CourseRecord;
  onClose: () => void;
}

const CourseDetailDrawer = ({ open, course, onClose }: CourseDetailDrawerProps) => {
  return (
    <Drawer title="Course Details" placement="right" onClose={onClose} open={open} width={460}>
      {course ? (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Course Name">{course.courseName}</Descriptions.Item>
          <Descriptions.Item label="Subject">{course.subject}</Descriptions.Item>
          <Descriptions.Item label="Grade">{course.grade}</Descriptions.Item>
          <Descriptions.Item label="Duration">{course.durationWeeks} weeks</Descriptions.Item>
          <Descriptions.Item label="Tuition Fee">
            {course.tuitionFee.toLocaleString()} VND
          </Descriptions.Item>
          <Descriptions.Item label="Total Lessons">{course.totalLessons}</Descriptions.Item>
          <Descriptions.Item label="Target">{course.target || "—"}</Descriptions.Item>
          <Descriptions.Item label="Status">{course.status}</Descriptions.Item>
          <Descriptions.Item label="Description">{course.description || "—"}</Descriptions.Item>
          <Descriptions.Item label="Thumbnail">{course.thumbnail || "—"}</Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(course.createdAt).toLocaleString("en-GB")}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {new Date(course.updatedAt).toLocaleString("en-GB")}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
};

export default CourseDetailDrawer;
