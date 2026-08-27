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
          <Descriptions.Item label="Course Name">{course.name}</Descriptions.Item>
          <Descriptions.Item label="Code">{course.code}</Descriptions.Item>
          <Descriptions.Item label="Subject">
            {typeof course.subjectId === "object"
              ? (course.subjectId as any).name
              : course.subjectId}
          </Descriptions.Item>
          <Descriptions.Item label="Grade">{course.grade}</Descriptions.Item>
          <Descriptions.Item label="Duration">
            {course.duration.value} {course.duration.unit.toLowerCase()}(s)
          </Descriptions.Item>
          {/* BUG ĐÃ SỬA: khóa học có 3 mức giá theo level (prices: Map), không phải 1 giá duy nhất. */}
          <Descriptions.Item label="Foundation Price">
            {(course.prices?.FOUNDATION ?? 0).toLocaleString()} VND
          </Descriptions.Item>
          <Descriptions.Item label="Intermediate Price">
            {(course.prices?.INTERMEDIATE ?? 0).toLocaleString()} VND
          </Descriptions.Item>
          <Descriptions.Item label="Advanced Price">
            {(course.prices?.ADVANCED ?? 0).toLocaleString()} VND
          </Descriptions.Item>
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
