import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Table,
  Button,
  Typography,
  Space,
  Alert,
  Skeleton,
  Tag,
  Tooltip,
  Divider,
  Badge,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  EditOutlined,
  EyeOutlined,
  RightOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";

dayjs.extend(isBetween);
dayjs.extend(relativeTime);
dayjs.locale("vi");

import { attendanceApi } from "../../../../api/attendanceApi";
import type { IVirtualSession } from "../../../../interface/attendanceInterface";
import { TeacherAttendanceHistoryDrawer } from "../../../attendance/components/TeacherAttendanceHistoryDrawer";
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

    // Current time ticker for active countdowns
    const [currentTime, setCurrentTime] = useState<dayjs.Dayjs>(dayjs());

    useEffect(() => {
      const timer = setInterval(() => setCurrentTime(dayjs()), 60000); // update every minute
      return () => clearInterval(timer);
    }, []);

    const fetchSessions = useCallback(async () => {
      if (!classId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await attendanceApi.getClassSessions(classId);
        setSessions(res.data.data || []);
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

    // Derived states
    const categorized = useMemo((): {
      current: IVirtualSession | null;
      next: IVirtualSession | null;
      upcomingList: IVirtualSession[];
      recentList: IVirtualSession[];
    } => {
      const past: IVirtualSession[] = [];
      const upcoming: IVirtualSession[] = [];
      let current: IVirtualSession | null = null;
      let next: IVirtualSession | null = null;

      sessions.forEach((s) => {
        const start = dayjs(`${s.date}T${s.startTime}:00`);
        const end = dayjs(`${s.date}T${s.endTime}:00`);

        if (currentTime.isAfter(end)) {
          past.push(s);
        } else if (currentTime.isBetween(start, end, null, "[]")) {
          if (!current) current = s; // Select first matching as current (there should only be 1)
        } else if (currentTime.isBefore(start)) {
          upcoming.push(s);
        }
      });

      // Sort past descending (newest first)
      past.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

      // Sort upcoming ascending (nearest first)
      upcoming.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());

      if (upcoming.length > 0) {
        next = upcoming[0];
      }

      return {
        current,
        next,
        upcomingList: upcoming.slice(1, 6), // limit 5
        recentList: past.slice(0, 5), // limit 5
      };
    }, [sessions, currentTime]);

    const renderCountdown = (endStr: string, dateStr: string) => {
      const end = dayjs(`${dateStr}T${endStr}:00`);
      const diffMs = end.diff(currentTime);
      if (diffMs <= 0) return "Đã kết thúc";

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `Còn ${hours} giờ ${mins} phút`;
    };

    const renderUpcomingCountdown = (startStr: string, dateStr: string) => {
      const start = dayjs(`${dateStr}T${startStr}:00`);
      return `Bắt đầu ${start.from(currentTime)}`;
    };

    const pastColumns: ColumnsType<IVirtualSession> = [
      {
        title: "Ngày học",
        dataIndex: "date",
        key: "date",
        render: (text) => <Text strong>{dayjs(text).format("DD/MM/YYYY")}</Text>,
      },
      {
        title: "Thống kê",
        key: "stats",
        render: (_, record) => {
          if (!record.hasRecords) return <Text type="secondary">Chưa điểm danh</Text>;
          const { present, absent, late, excused } = record.stats;
          return (
            <Space size={16} style={{ fontSize: 13 }}>
              <span style={{ color: "#52c41a" }}>
                <CheckCircleOutlined /> {present}
              </span>
              <span style={{ color: "#faad14" }}>
                <ClockCircleOutlined /> {late}
              </span>
              <span style={{ color: "#1890ff" }}>
                <InfoCircleOutlined /> {excused}
              </span>
              <span style={{ color: "#ff4d4f" }}>
                <CloseCircleOutlined /> {absent}
              </span>
            </Space>
          );
        },
      },
      {
        title: "Hành động",
        key: "action",
        align: "right",
        render: (_, record) => (
          <Button
            type="default"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleOpenPopup(record)}
          >
            Xem
          </Button>
        ),
      },
    ];

    const upcomingColumns: ColumnsType<IVirtualSession> = [
      {
        title: "Ngày học",
        dataIndex: "date",
        key: "date",
        render: (text) => <Text strong>{dayjs(text).format("DD/MM/YYYY")}</Text>,
      },
      {
        title: "Thời gian",
        key: "time",
        render: (_, record) => (
          <Space>
            <ClockCircleOutlined style={{ color: "#faad14" }} />
            <Text>
              {record.startTime} - {record.endTime}
            </Text>
          </Space>
        ),
      },
      {
        title: "Trạng thái",
        key: "status",
        render: () => <Tag color="default">Chưa đến giờ</Tag>,
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Header Banner */}
        <Card
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
            border: "none",
          }}
          styles={{ body: { padding: "20px 24px" } }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                📌 Tổng quan Điểm danh: {className}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                Quản lý các buổi học hiện hành và theo dõi chuyên cần.
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
              <Button
                size="small"
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={fetchSessions}
              >
                Thử lại
              </Button>
            }
          />
        )}

        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            {/* CURRENT SESSION */}
            {categorized.current && (
              <Card
                style={{
                  borderRadius: 12,
                  border: "2px solid #52c41a",
                  boxShadow: "0 4px 12px rgba(82, 196, 26, 0.15)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div>
                    <Badge
                      color="green"
                      text={
                        <Text strong style={{ color: "#52c41a" }}>
                          BUỔI HỌC ĐANG DIỄN RA
                        </Text>
                      }
                    />
                    <Title level={4} style={{ margin: "8px 0 4px 0" }}>
                      {dayjs(categorized.current.date).format("dddd, DD/MM/YYYY")}
                    </Title>
                    <Space size="large" style={{ color: "#595959" }}>
                      <span>
                        <ClockCircleOutlined /> {categorized.current.startTime} -{" "}
                        {categorized.current.endTime}
                      </span>
                      <Text type="danger" strong>
                        ({renderCountdown(categorized.current.endTime, categorized.current.date)})
                      </Text>
                    </Space>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary">Trạng thái: </Text>
                      {categorized.current.hasRecords ? (
                        <Tag color="success">Đã lưu điểm danh</Tag>
                      ) : (
                        <Tag color="processing">Chưa điểm danh</Tag>
                      )}
                    </div>
                    <Button
                      type="primary"
                      size="large"
                      style={{
                        fontWeight: 600,
                        background: categorized.current.hasRecords ? "#fff" : "#1890ff",
                        color: categorized.current.hasRecords ? "#1890ff" : "#fff",
                        borderColor: "#1890ff",
                      }}
                      icon={<EditOutlined />}
                      onClick={() => handleOpenPopup(categorized.current!)}
                    >
                      {categorized.current.hasRecords ? "Sửa điểm danh" : "Điểm danh ngay"}
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* NEXT SESSION */}
            {categorized.next && (
              <Card
                style={{ borderRadius: 12, borderLeft: "4px solid #1890ff", background: "#f0f5ff" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  <div>
                    <Text type="secondary" strong>
                      BUỔI HỌC TIẾP THEO
                    </Text>
                    <div style={{ fontSize: 16, fontWeight: 500, marginTop: 4 }}>
                      {dayjs(categorized.next.date).format("dddd, DD/MM/YYYY")} |{" "}
                      {categorized.next.startTime} - {categorized.next.endTime}
                    </div>
                  </div>
                  <div>
                    <Tag color="blue">
                      {renderUpcomingCountdown(categorized.next.startTime, categorized.next.date)}
                    </Tag>
                  </div>
                </div>
              </Card>
            )}

            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {/* UPCOMING SESSIONS */}
              <div style={{ flex: 1, minWidth: 300 }}>
                <Title level={5}>Sắp tới</Title>
                <Table
                  columns={upcomingColumns}
                  dataSource={categorized.upcomingList}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered={false}
                  locale={{ emptyText: "Không có buổi học sắp tới" }}
                />
              </div>

              {/* RECENT SESSIONS */}
              <div style={{ flex: 1, minWidth: 300 }}>
                <Title level={5}>Điểm danh gần đây</Title>
                <Table
                  columns={pastColumns}
                  dataSource={categorized.recentList}
                  rowKey="id"
                  pagination={false}
                  size="small"
                  bordered={false}
                  locale={{ emptyText: "Chưa có dữ liệu" }}
                />
              </div>
            </div>
          </Space>
        )}

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
