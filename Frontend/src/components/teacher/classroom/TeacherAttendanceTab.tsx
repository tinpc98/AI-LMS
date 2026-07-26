import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, Row, Col, DatePicker, Statistic, Progress, Table, Avatar, Radio, Input, Button, Typography, Space, Alert, Skeleton, Empty } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  SaveOutlined,
  HistoryOutlined,
  SearchOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import { attendanceApi } from "../../../api/attendanceApi";
import { toast } from "../../../utils/toast";
import type { AttendanceStatus, IStudentAttendanceRecord, IAttendanceStats } from "../../../interface/attendanceInterface";
import { TeacherAttendanceHistoryDrawer } from "../attendance/TeacherAttendanceHistoryDrawer";

const { Title, Text } = Typography;

interface TeacherAttendanceTabProps {
  classId: string;
  className?: string;
  students?: any[];
}

export const TeacherAttendanceTab: React.FC<TeacherAttendanceTabProps> = React.memo(
  ({ classId, className = "Lớp học", students = [] }) => {
    const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
    const [records, setRecords] = useState<IStudentAttendanceRecord[]>([]);
    const [stats, setStats] = useState<IAttendanceStats>({
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      presentRate: 0,
    });

    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const [historyOpen, setHistoryOpen] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Fetch attendance data for this class & date
    const fetchAttendance = useCallback(async () => {
      if (!classId) return;
      setLoading(true);
      setError(null);

      try {
        const [attendRes, statsRes] = await Promise.all([
          attendanceApi.getAttendanceByClass(classId, selectedDate).catch(() => null),
          attendanceApi.getAttendanceStats(classId).catch(() => null),
        ]);

        const existingRecords = attendRes?.data?.data || [];

        // Merge class students with existing records
        const merged: IStudentAttendanceRecord[] = students.map((st: any, idx: number) => {
          const studentObj = typeof st.studentId === "object" ? st.studentId : null;
          const sId = (studentObj?._id || st._id || st.studentId || `student-${idx}`).toString();

          const foundRecord = existingRecords.find((rec: any) => {
            const recStudentId = (typeof rec.studentId === "object" ? rec.studentId?._id : rec.studentId || "").toString();
            return recStudentId === sId;
          });

          return {
            studentId: sId,
            fullName: studentObj?.fullName || st.fullName || "Học sinh",
            email: studentObj?.email || st.email || "",
            avatar: studentObj?.avatar || st.avatar,
            status: (foundRecord?.status as AttendanceStatus) || "Present",
            note: foundRecord?.note || "",
          };
        });

        setRecords(merged);

        if (statsRes?.data?.data) {
          setStats(statsRes.data.data);
        } else {
          const total = merged.length;
          const present = merged.filter((r) => r.status === "Present").length;
          const late = merged.filter((r) => r.status === "Late").length;
          const excused = merged.filter((r) => r.status === "Excused").length;
          const absent = merged.filter((r) => r.status === "Absent").length;
          const presentRate = total > 0 ? parseFloat(((present / total) * 100).toFixed(1)) : 0;

          setStats({ total, present, late, excused, absent, presentRate });
        }
      } catch (err: any) {
        console.error("[TeacherAttendanceTab] Fetch error:", err);
        setError(err.message || "Không thể nạp dữ liệu điểm danh!");
      } finally {
        setLoading(false);
      }
    }, [classId, selectedDate, students]);

    useEffect(() => {
      fetchAttendance();
    }, [fetchAttendance]);

    // Action Handlers
    const handleChangeStatus = useCallback((studentId: string, status: AttendanceStatus) => {
      setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
    }, []);

    const handleChangeNote = useCallback((studentId: string, note: string) => {
      setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, note } : r)));
    }, []);

    const handleMarkAll = useCallback((status: AttendanceStatus) => {
      setRecords((prev) => prev.map((r) => ({ ...r, status })));
    }, []);

    const handleSaveAttendance = useCallback(async () => {
      if (!classId || records.length === 0) {
        toast.error("Không có dữ liệu học sinh để lưu!");
        return;
      }

      setSaving(true);
      try {
        const payload = {
          classId,
          date: selectedDate,
          records: records.map((r) => ({
            studentId: r.studentId,
            status: r.status,
            note: r.note,
          })),
        };

        await attendanceApi.markAttendance(payload);
        toast.success(`Đã lưu điểm danh lớp ngày ${dayjs(selectedDate).format("DD/MM/YYYY")} thành công!`);
        fetchAttendance();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi lưu điểm danh!");
      } finally {
        setSaving(false);
      }
    }, [classId, selectedDate, records, fetchAttendance]);

    // Filter Records
    const filteredRecords = useMemo(() => {
      if (!searchQuery.trim()) return records;
      const q = searchQuery.toLowerCase().trim();
      return records.filter(
        (r) =>
          (r.fullName || "").toLowerCase().includes(q) ||
          (r.email || "").toLowerCase().includes(q) ||
          (r.studentId || "").toLowerCase().includes(q)
      );
    }, [records, searchQuery]);

    const presentRate = typeof stats.presentRate === "number" ? stats.presentRate : parseFloat(String(stats.presentRate || 0));

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
        render: (id) => {
          const strId = (id ?? "").toString();
          const code = strId ? strId.slice(-6).toUpperCase() : "N/A";
          return <Text style={{ fontFamily: "monospace" }}>STU-{code}</Text>;
        },
      },
      {
        title: "Trạng thái điểm danh",
        key: "status",
        width: 380,
        render: (_, record) => (
          <Radio.Group
            value={record.status}
            onChange={(e) => handleChangeStatus(record.studentId, e.target.value as AttendanceStatus)}
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
            placeholder="Nhập ghi chú..."
            value={record.note || ""}
            onChange={(e) => handleChangeNote(record.studentId, e.target.value)}
            style={{ borderRadius: 6 }}
            maxLength={100}
          />
        ),
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1. Header Banner & Stats Overview */}
        <Card
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
          }}
          styles={{ body: { padding: "24px 32px" } }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                📌 Điểm danh: {className}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                Chọn ngày điểm danh và đánh dấu chuyên cần cho danh sách học sinh trong lớp.
              </Text>
            </div>

            <Space size={12} wrap align="center">
              <DatePicker
                value={selectedDate ? dayjs(selectedDate) : dayjs()}
                onChange={(date) => {
                  if (date) setSelectedDate(date.format("YYYY-MM-DD"));
                }}
                format="DD/MM/YYYY"
                style={{ width: 160 }}
                allowClear={false}
              />

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
                Xem lịch sử
              </Button>
            </Space>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Tổng số</Text>}
                  value={stats.total || 0}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🟢 Có mặt</Text>}
                  value={stats.present || 0}
                  prefix={<CheckCircleOutlined style={{ color: "#b7eb8f", marginRight: 6 }} />}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🟡 Đi muộn</Text>}
                  value={stats.late || 0}
                  prefix={<ClockCircleOutlined style={{ color: "#ffe58f", marginRight: 6 }} />}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🔵 Có phép</Text>}
                  value={stats.excused || 0}
                  prefix={<InfoCircleOutlined style={{ color: "#91caff", marginRight: 6 }} />}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={5}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🔴 Vắng mặt</Text>}
                  value={stats.absent || 0}
                  prefix={<CloseCircleOutlined style={{ color: "#ff7875", marginRight: 6 }} />}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>
          </Row>

          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
              <span>Tỷ lệ đi học thành công</span>
              <span><strong>{presentRate}%</strong></span>
            </div>
            <Progress percent={presentRate} showInfo={false} strokeColor="#52c41a" railColor="rgba(255,255,255,0.3)" />
          </div>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Lỗi kết nối điểm danh"
            description={error}
            type="error"
            showIcon
            action={
              <Button size="small" type="primary" danger icon={<ReloadOutlined />} onClick={fetchAttendance}>
                Thử lại
              </Button>
            }
            style={{ borderRadius: 8 }}
          />
        )}

        {/* 2. Main Attendance Table */}
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <Space size={12} wrap>
                <Input
                  placeholder="Tìm học sinh..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 220, borderRadius: 8 }}
                  allowClear
                />

                <Button size="middle" icon={<CheckCircleOutlined />} onClick={() => handleMarkAll("Present")}>
                  Có mặt tất cả
                </Button>

                <Button size="middle" icon={<CloseCircleOutlined />} onClick={() => handleMarkAll("Absent")}>
                  Vắng tất cả
                </Button>
              </Space>

              <Button
                type="primary"
                size="large"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveAttendance}
                style={{ fontWeight: 600, borderRadius: 8, padding: "0 24px" }}
              >
                Lưu bản ghi điểm danh
              </Button>
            </div>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
        >
          {loading ? (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : filteredRecords.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredRecords}
              rowKey={(record, index) => record.studentId || `rec-${index}`}
              pagination={false}
            />
          ) : (
            <div style={{ padding: 40 }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={searchQuery ? "Không tìm thấy học sinh phù hợp từ khóa!" : "Lớp học chưa có học sinh nào để điểm danh."}
              />
            </div>
          )}
        </Card>

        {/* History Drawer */}
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
