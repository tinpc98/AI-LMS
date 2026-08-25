import { Button, Col, Input, Row, Select } from "antd";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import { subjectService } from "../subject/subjectService";
import type { Subject } from "../subject/subject.types";
import type { CourseFilters, CourseStatus } from "./course.types";

interface CourseToolbarProps {
  filters: CourseFilters;
  onFiltersChange: (filters: CourseFilters) => void;
  onRefresh: () => void;
  onCreate?: () => void;
}

const CourseToolbar = ({ filters, onFiltersChange, onRefresh, onCreate }: CourseToolbarProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    subjectService.getSubjects({ status: "ACTIVE", limit: 100 })
      .then((res) => setSubjects(res.data || []))
      .catch(() => {});
  }, []);

  return (
    <Row gutter={[12, 12]} align="middle">
      <Col xs={24} md={8}>
        <Input
          allowClear
          placeholder="Search by course name or target"
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Subject"
          value={filters.subjectId}
          onChange={(value: string) =>
            onFiltersChange({ ...filters, subjectId: value })
          }
          options={[
            { label: "All Subjects", value: "All" },
            ...subjects.map(s => ({ label: s.name, value: s._id }))
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Status"
          value={filters.status}
          onChange={(value: CourseStatus | "All") => onFiltersChange({ ...filters, status: value })}
          options={[
            { label: "All Status", value: "All" },
            { label: "Draft", value: "Draft" },
            { label: "Published", value: "Published" },
            { label: "Closed", value: "Closed" },
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} block>
          Refresh
        </Button>
      </Col>
      {onCreate && (
        <Col xs={24} sm={12} md={4}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
            Create Course
          </Button>
        </Col>
      )}
    </Row>
  );
};

export default CourseToolbar;
