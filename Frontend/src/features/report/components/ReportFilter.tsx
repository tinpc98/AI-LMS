import React, { useEffect, useState } from "react";
import { Card, Form, Select, DatePicker, Button, Space } from "antd";
import { subjectService } from "../../../features/subject/subjectService";
import type { Subject } from "../../../features/subject/subject.types";
import { ReloadOutlined, ExportOutlined } from "@ant-design/icons";

const { RangePicker } = DatePicker;

export type FilterValues = {
  dateRange?: [any, any] | null;
  subject?: string;
  grade?: string;
  status?: string;
};

interface ReportFilterProps {
  onFilterChange?: (values: FilterValues) => void;
  onReset?: () => void;
  onExport?: () => void;
}

export const ReportFilter: React.FC<ReportFilterProps> = ({
  onFilterChange,
  onReset,
  onExport,
}) => {
  const [form] = Form.useForm();
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    subjectService.getSubjects({ status: "ACTIVE", limit: 100 })
      .then(res => setSubjects(res.data || []))
      .catch(() => {});
  }, []);

  const handleValuesChange = (_: any, allValues: FilterValues) => {
    if (onFilterChange) {
      onFilterChange(allValues);
    }
  };

  const handleReset = () => {
    form.resetFields();
    if (onReset) onReset();
  };

  return (
    <Card className="shadow-sm mb-6 rounded-xl border border-gray-100">
      <Form
        form={form}
        layout="inline"
        onValuesChange={handleValuesChange}
        className="flex flex-wrap gap-y-3 items-center justify-between"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Form.Item name="dateRange" label="Thời gian" className="mb-0">
            <RangePicker className="rounded-lg" placeholder={["Từ ngày", "Đến ngày"]} />
          </Form.Item>

          <Form.Item name="subject" label="Môn học" className="mb-0">
            <Select
              placeholder="Tất cả môn học"
              style={{ width: 160 }}
              allowClear
              className="rounded-lg"
            >
              {subjects.map(s => (
                <Select.Option key={s._id} value={s._id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="grade" label="Khối lớp" className="mb-0">
            <Select
              placeholder="Tất cả khối"
              style={{ width: 130 }}
              allowClear
              className="rounded-lg"
            >
              <Select.Option value="10">Khối 10</Select.Option>
              <Select.Option value="11">Khối 11</Select.Option>
              <Select.Option value="12">Khối 12</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Trạng thái" className="mb-0">
            <Select
              placeholder="Tất cả trạng thái"
              style={{ width: 150 }}
              allowClear
              className="rounded-lg"
            >
              <Select.Option value="Active">Đang hoạt động</Select.Option>
              <Select.Option value="Upcoming">Sắp mở</Select.Option>
              <Select.Option value="Completed">Hoàn thành</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Form.Item className="mb-0">
          <Space>
            <Button icon={<ReloadOutlined />} onClick={handleReset} className="rounded-lg">
              Làm mới
            </Button>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              onClick={onExport}
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
            >
              Xuất Báo Cáo
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ReportFilter;
