import React from "react";
import { Table, Button, Typography, Space, Card } from "antd";
import { InfoCircleOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import AttendanceStatusTag from "./AttendanceStatusTag";
import type { IExtendedAttendanceRecord } from "../../../types/studentAttendance";

const { Text } = Typography;

interface AttendanceTableProps {
  records: IExtendedAttendanceRecord[];
  onDetail: (item: IExtendedAttendanceRecord) => void;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = React.memo(({ records, onDetail }) => {
  const columns = [
    {
      title: "Ngày học",
      dataIndex: "date",
      key: "date",
      width: 130,
      render: (dateStr: string) => {
        const d = dateStr ? new Date(dateStr) : new Date();
        return (
          <Text strong style={{ color: "#1f2937", fontSize: 13 }}>
            {d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
          </Text>
        );
      },
    },
    {
      title: "Buổi học / Tiết học",
      dataIndex: "sessionTitle",
      key: "sessionTitle",
      render: (text: string, record: IExtendedAttendanceRecord) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: "#1f2937", fontSize: 14 }}>
            {text || "Buổi học môn chuyên ngành"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} /> {record.sessionTime || "08:00 - 10:30"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Giảng viên điểm danh",
      dataIndex: "teacherName",
      key: "teacherName",
      width: 170,
      render: (teacherName: string) => (
        <Space size={6}>
          <UserOutlined style={{ color: "#1890ff" }} />
          <Text style={{ fontSize: 13 }}>{teacherName || "Giảng viên"}</Text>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center" as const,
      render: (status: any) => <AttendanceStatusTag status={status} />,
    },
    {
      title: "Ghi chú của GV",
      dataIndex: "note",
      key: "note",
      render: (note?: string) => (
        <Text type="secondary" ellipsis style={{ fontSize: 12, maxWidth: 220 }}>
          {note || "--"}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      align: "center" as const,
      render: (_: any, record: IExtendedAttendanceRecord) => (
        <Button
          type="default"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => onDetail(record)}
          style={{ borderRadius: 6, fontSize: 12 }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #f0f0f0" }}>
      <Table
        dataSource={records}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 8, showSizeChanger: false }}
        size="middle"
      />
    </Card>
  );
});

AttendanceTable.displayName = "AttendanceTable";

export default AttendanceTable;
