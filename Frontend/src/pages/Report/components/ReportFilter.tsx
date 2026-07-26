import React from "react";
import { DatePicker, Select, Button, Space, Typography, notification } from "antd";
import { DownloadOutlined, FilterOutlined, CalendarOutlined } from "@ant-design/icons";
import type { DateFilterType, DateRangeState } from "../../../utils/reportTransformer";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ReportFilterProps {
  filter: DateRangeState;
  onFilterChange: (newFilter: DateRangeState) => void;
  activeTabTitle: string;
}

export const ReportFilter: React.FC<ReportFilterProps> = ({
  filter,
  onFilterChange,
  activeTabTitle,
}) => {
  const handleSelectChange = (value: DateFilterType) => {
    onFilterChange({ ...filter, filterType: value });
  };

  const handleExport = () => {
    notification.success({
      message: "Xuất báo cáo thành công",
      description: `Báo cáo phân tích "${activeTabTitle}" đã được tải xuống file CSV thành công.`,
      placement: "topRight",
    });
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f6f8fc 100%)",
        padding: "24px",
        borderRadius: "16px",
        marginBottom: "24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        border: "1px solid #f0f0f0",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}
    >
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1f1f1f" }}>
          Reports & Analytics 📊
        </Title>
        <Text type="secondary" style={{ fontSize: "14px", marginTop: 4, display: "inline-block" }}>
          Báo cáo thống kê & phân tích dữ liệu chuyên sâu hệ thống AI LMS
        </Text>
      </div>

      <Space wrap size="middle">
        <Space align="center" style={{ background: "#ffffff", padding: "6px 12px", borderRadius: "10px", border: "1px solid #d9d9d9" }}>
          <FilterOutlined style={{ color: "#1677ff" }} />
          <Text style={{ fontWeight: 500, fontSize: "13px" }}>Thời gian:</Text>
          <Select<DateFilterType>
            value={filter.filterType}
            onChange={handleSelectChange}
            variant="borderless"
            style={{ width: 140 }}
            options={[
              { value: "today", label: "Hôm nay" },
              { value: "7days", label: "7 ngày qua" },
              { value: "30days", label: "30 ngày qua" },
              { value: "thisMonth", label: "Tháng này" },
              { value: "thisYear", label: "Năm nay" },
              { value: "custom", label: "Tùy chọn..." },
            ]}
          />
        </Space>

        {filter.filterType === "custom" && (
          <RangePicker
            format="DD/MM/YYYY"
            style={{ borderRadius: "8px" }}
          />
        )}

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExport}
          style={{
            borderRadius: "8px",
            background: "linear-gradient(135deg, #52c41a 0%, #389e0d 100%)",
            border: "none",
            boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
            fontWeight: 600,
          }}
        >
          Export Report
        </Button>
      </Space>
    </div>
  );
};
