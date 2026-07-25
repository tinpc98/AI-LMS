import { Button, Col, Input, Row, Select } from "antd";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import type { ClassFilters, ClassLearningMode, ClassStatus } from "./class.types";

interface ClassToolbarProps {
  filters: ClassFilters;
  onFiltersChange: (filters: ClassFilters) => void;
  onRefresh: () => void;
  onCreate: () => void;
  courseOptions: Array<{ id: string; label: string }>;
  learningModeOptions: Array<{ label: string; value: ClassLearningMode | "All" }>;
}

const ClassToolbar = ({ filters, onFiltersChange, onRefresh, onCreate, courseOptions, learningModeOptions }: ClassToolbarProps) => {
  return (
    <Row gutter={[12, 12]} align="middle">
      <Col xs={24} md={8}>
        <Input
          allowClear
          placeholder="Search by class name or code"
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Course"
          value={filters.courseId || undefined}
          allowClear
          onChange={(value) => onFiltersChange({ ...filters, courseId: value || "" })}
          options={[{ label: "All Courses", value: "" }, ...courseOptions.map((item) => ({ label: item.label, value: item.id }))]}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Learning Mode"
          value={filters.learningMode}
          onChange={(value: ClassLearningMode | "All") => onFiltersChange({ ...filters, learningMode: value })}
          options={learningModeOptions}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Status"
          value={filters.status}
          onChange={(value: ClassStatus | "All") => onFiltersChange({ ...filters, status: value })}
          options={[
            { label: "All Status", value: "All" },
            { label: "Upcoming", value: "Upcoming" },
            { label: "Active", value: "Active" },
            { label: "Completed", value: "Completed" },
            { label: "Cancelled", value: "Cancelled" },
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={2}>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} block>
          Refresh
        </Button>
      </Col>
      <Col xs={24} sm={12} md={2}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
          Create
        </Button>
      </Col>
    </Row>
  );
};

export default ClassToolbar;
