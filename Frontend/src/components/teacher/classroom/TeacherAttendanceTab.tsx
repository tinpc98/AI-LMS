import React, { useState, useEffect, useCallback } from "react";
import { Card, Table, Button, Typography, Space, Alert, Skeleton, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  ReloadOutlined,
  EditOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { attendanceApi } from "../../../api/attendanceApi";
import type { IVirtualSession } from "../../../interface/attendanceInterface";
import { TeacherAttendanceHistoryDrawer } from "../attendance/TeacherAttendanceHistoryDrawer";
import { AttendancePopup } from "./AttendancePopup";

const { Title, Text } = Typography;

interface TeacherAttendanceTabProps {
  classId: string;
  className?: string;
  students?: any[];
}

export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = React.memo(
  ({ classId, className = "Lớp học", students = [] }) => {
    const [sessions, setSessions] = useState<IVirtualSession[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [historyOpen, setHistoryOpen] = useState<boolean>(false);
    
    // Popup state
    const [popupOpen, setPopupOpen] = useState<boolean>(false);
    const [selectedSession, setSelectedSession] = useState<IVirtualSession | null>(null);

    const fetchSessions = useCallback(async () => {
      if (!classId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await attendanceApi.getClassSessions(classId);
        // Sort descending by date
        const data = (res.data.data || []).sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
        setSessions(data);
      } catch (err: any) {
        console.error("[TeacherAttendanceTab] Fetch error:", err);
        setError("Không thể tải danh sách buổi học.");
      } finally {
        setLoading(false);
      }
    }, [classId]);

    useEffect(() => {
      fetchSessions();
    }, [fetchSessions]);

    const handleOpenPopup = (session: IVirtualSession) => {
      setSelectedSession(session);
      setPopupOpen(true);
    };

    const getStatusTag = (status: string) => {
      switch (status) {
        case "Upcoming":
          return <Tag color="default">Chưa đến giờ</Tag>;
        case "Open":
          return <Tag color="processing">Đang mở</Tag>;
        case "Saved":
          return <Tag color="success">Đã điểm danh</Tag>;
        case "Closed":
          return <Tag color="error">Đã đóng</Tag>;
        default:
          return <Tag>{status}</Tag>;
      }
    };

    const columns: ColumnsType<IVirtualSession> = [
      {
        title: "Ngày học",
        dataIndex: "date",
        key: "date",
        render: (text) => (
          <Space>
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <Text strong>{dayjs(text).format("DD/MM/YYYY")}</Text>
          </Space>
        ),
      },
      {
        title: "Thời gian",
        key: "time",
        render: (_, record) => (
          <Space>
            <ClockCircleOutlined style={{ color: "#faad14" }} />
            <Text>{record.startTime} - {record.endTime}</Text>
          </Space>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        render: (status) => getStatusTag(status),
      },
      {
        title: "Thống kê",
        key: "stats",
        render: (_, record) => {
          if (!record.hasRecords) return <Text type="secondary">Chưa có dữ liệu</Text>;
          const { present, absent, late, excused } = record.stats;
          return (
            <Space size={16} style={{ fontSize: 13 }}>
              <Tooltip title="Có mặt"><span style={{ color: "#52c41a" }}><CheckCircleOutlined /> {present}</span></Tooltip>
              <Tooltip title="Vắng mặt"><span style={{ color: "#ff4d4f" }}><CloseCircleOutlined /> {absent}</span></Tooltip>
              <Tooltip title="Đi muộn"><span style={{ color: "#faad14" }}><ClockCircleOutlined /> {late}</span></Tooltip>
            </Space>
          );
        },
      },
      {
        title: "Hành động",
        key: "action",
        align: "right",
        render: (_, record) => {
          if (record.status === "Upcoming") {
            return (
              <Button type="default" disabled size="small">
                Chưa đến giờ
              </Button>
            );
          }
          if (record.status === "Closed") {
            return (
              <Button type="default" size="small" icon={<EyeOutlined />} onClick={() => handleOpenPopup(record)}>
                Xem điểm danh
              </Button>
            );
          }
          if (record.status === "Saved") {
            return (
              <Button type="primary" ghost size="small" icon={<EditOutlined />} onClick={() => handleOpenPopup(record)}>
                Sửa điểm danh
              </Button>
            );
          }
          // Open
          return (
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleOpenPopup(record)}>
              Điểm danh
            </Button>
          );
        },
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header Banner */}
        <Card
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
          }}
          styles={{ body: { padding: "24px 32px" } }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
            <div>
              <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                📌 Quản lý Điểm danh: {className}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                Danh sách các buổi học được sinh ra từ lịch học của lớp. Chỉ được điểm danh trong thời gian buổi học diễn ra.
              </Text>
            </div>

            <Button
              type="default"
              icon={<HistoryOutlined />}
              onClick={() => setHistoryOpen(true)}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.4)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Xem Ma trận điểm danh
            </Button>
          </div>
        </Card>

        {error && (
          <Alert
            message="Lỗi tải dữ liệu"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" danger icon={<ReloadOutlined />} onClick={fetchSessions}>
                Thử lại
              </Button>
            }
          />
        )}

        <Card title="Danh sách buổi học" style={{ borderRadius: 12 }}>
          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <Table
              columns={columns}
              dataSource={sessions}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          )}
        </Card>

        <AttendancePopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          session={selectedSession}
          students={students}
          onSaved={fetchSessions}
        />

        <TeacherAttendanceHistoryDrawer
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          classId={classId}
          className={className}
        />
      </div>
    );
  }
);

TeacherAttendanceTab.displayName = "TeacherAttendanceTab";
