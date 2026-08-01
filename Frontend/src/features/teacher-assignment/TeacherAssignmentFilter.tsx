import { Button, Col, Input, Row, Select } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import type {
  AccountRecord,
  CourseRecord,
  TeacherAssignmentFilters,
} from "./teacherAssignment.types";

interface TeacherAssignmentFilterProps {
  filters: TeacherAssignmentFilters;
  onFiltersChange: (filters: TeacherAssignmentFilters) => void;
  onRefresh: () => void;
  courses: CourseRecord[];
  teachers: AccountRecord[];
}

const TeacherAssignmentFilter = ({
  filters,
  onFiltersChange,
  onRefresh,
  courses,
  teachers,
}: TeacherAssignmentFilterProps) => {
  return (
    <Row gutter={[12, 12]} align="middle">
      <Col xs={24} md={8}>
        <Input
          allowClear
          placeholder="Search by class name or code..."
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        />
      </Col>
      <Col xs={24} sm={12} md={5}>
        <Select
          style={{ width: "100%" }}
          placeholder="Select Course"
          value={filters.courseId || undefined}
          allowClear
          onChange={(value) => onFiltersChange({ ...filters, courseId: value || "" })}
          options={[
            { label: "All Courses", value: "" },
            ...courses.map((item) => ({ label: item.courseName, value: item.id })),
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={5}>
        <Select
          style={{ width: "100%" }}
          placeholder="Select Teacher"
          value={filters.teacherId || undefined}
          allowClear
          onChange={(value) => onFiltersChange({ ...filters, teacherId: value || "" })}
          options={[
            { label: "All Teachers", value: "" },
            ...teachers.map((item) => ({ label: item.fullName, value: item.id })),
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Status"
          value={filters.status}
          onChange={(value) => onFiltersChange({ ...filters, status: value })}
          options={[
            { label: "All Status", value: "All" },
            { label: "Assigned", value: "Assigned" },
            { label: "Unassigned", value: "Unassigned" },
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={2}>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} block>
          Refresh
        </Button>
      </Col>
    </Row>
  );
};

export default TeacherAssignmentFilter;
