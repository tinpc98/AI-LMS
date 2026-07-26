import React, { useState, useMemo } from "react";
import { Table, Avatar, Segmented, Radio, Input, Button, Card, Typography, Space, Tag, Empty, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  InfoCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import type { AttendanceStatus, IStudentAttendanceRecord } from "../../../interface/attendanceInterface";

const { Title, Text } = Typography;

interface TeacherAttendanceTableProps {
  records: IStudentAttendanceRecord[];
  onChangeRecordStatus: (studentId: string, status: AttendanceStatus) => void;
  onChangeRecordNote: (studentId: string, note: string) => void;
  onMarkAll: (status: AttendanceStatus) => void;
  onSave: () => void;
  saving?: boolean;
  loading?: boolean;
}

export const TeacherAttendanceTable: React.FC<TeacherAttendanceTableProps> = React.memo(
  ({
    records = [],
    onChangeRecordStatus,
    onChangeRecordNote,
    onMarkAll,
    onSave,
    saving = false,
    loading = false,
  }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    // Filter students
    const filteredRecords = useMemo(() => {
      let result = [...records];

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(
          (r) =>
            (r.fullName || "").toLowerCase().includes(q) ||
            (r.email || "").toLowerCase().includes(q) ||
            r.studentId.toLowerCase().includes(q)
        );
      }

      if (statusFilter !== "all") {
        result = result.filter((r) => r.status === statusFilter);
      }

      return result;
    }, [records, searchQuery, statusFilter]);

    const columns: ColumnsType<IStudentAttendanceRecord> = [
      {
        title: "#",
        key: "index",
        width: 50,
        render: (_, __, index) => index + 1,
      },
      {
        title: "Học sinh",
        key: "student",
        render: (_, record) => (
          <Space size={12}>
            <Avatar
              src={record.avatar || undefined}
              icon={!record.avatar ? <UserOutlined /> : undefined}
              style={{ backgroundColor: "#1890ff" }}
            />
            <div>
              <Text strong style={{ fontSize: 14, display: "block" }}>
                {record.fullName || "Học sinh"}
              </Text>
              {record.email && <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>}
            </div>
          </Space>
        ),
      },
      {
        title: "Mã sinh viên",
        dataIndex: "studentId",
        key: "studentId",
        render: (id) => <Text style={{ fontFamily: "monospace" }}>STU-{id.slice(-6).toUpperCase()}</Text>,
      },
      {
        title: "Trạng thái điểm danh",
        key: "status",
        width: 380,
        render: (_, record) => (
          <Radio.Group
            value={record.status}
            onChange={(e) => onChangeRecordStatus(record.studentId, e.target.value as AttendanceStatus)}
            buttonStyle="solid"
            size="middle"
          >
            <Radio.Button value="Present" style={{ backgroundColor: record.status === "Present" ? "#52c41a" : undefined, color: record.status === "Present" ? "#fff" : undefined }}>
              🟢 Có mặt
            </Radio.Button>
            <Radio.Button value="Late" style={{ backgroundColor: record.status === "Late" ? "#faad14" : undefined, color: record.status === "Late" ? "#fff" : undefined }}>
              🟡 Đi muộn
            </Radio.Button>
            <Radio.Button value="Excused" style={{ backgroundColor: record.status === "Excused" ? "#1890ff" : undefined, color: record.status === "Excused" ? "#fff" : undefined }}>
              🔵 Có phép
            </Radio.Button>
            <Radio.Button value="Absent" style={{ backgroundColor: record.status === "Absent" ? "#ff4d4f" : undefined, color: record.status === "Absent" ? "#fff" : undefined }}>
              🔴 Vắng
            </Radio.Button>
          </Radio.Group>
        ),
      },
      {
        title: "Ghi chú chuyên cần",
        key: "note",
        render: (_, record) => (
          <Input
            placeholder="Nhập ghi chú (nếu có)..."
            value={record.note || ""}
            onChange={(e) => onChangeRecordNote(record.studentId, e.target.value)}
            style={{ borderRadius: 6 }}
            maxLength={100}
          />
        ),
      },
    ];

    return (
      <Card
        title={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <Space size={12} wrap>
              <Input
                placeholder="Tìm học sinh theo tên hoặc email..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 260, borderRadius: 8 }}
                allowClear
              />

              <Button size="middle" icon={<CheckCircleOutlined />} onClick={() => onMarkAll("Present")}>
                Có mặt tất cả
              </Button>

              <Button size="middle" icon={<CloseCircleOutlined />} onClick={() => onMarkAll("Absent")}>
                Vắng tất cả
              </Button>
            </Space>

            <Button
              type="primary"
              size="large"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={onSave}
              style={{ fontWeight: 600, borderRadius: 8, padding: "0 24px" }}
            >
              Lưu bản ghi điểm danh
            </Button>
          </div>
        }
        style={{ borderRadius: 12 }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          columns={columns}
          dataSource={filteredRecords}
          rowKey="studentId"
          loading={loading}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchQuery ? "Không tìm thấy học sinh phù hợp từ khóa!" : "Lớp học chưa có học sinh nào để điểm danh."}
              />
            ),
          }}
        />
      </Card>
    );
  }
);

TeacherAttendanceTable.displayName = "TeacherAttendanceTable";
