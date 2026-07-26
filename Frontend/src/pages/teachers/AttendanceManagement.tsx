import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Alert, Button, Card, Skeleton, Empty, Typography, Space } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

import { classApi } from "../../api/classApi";
import { attendanceApi } from "../../api/attendanceApi";
import { toast } from "../../utils/toast";

import type {
  AttendanceStatus,
  IStudentAttendanceRecord,
  IAttendanceStats,
} from "../../interface/attendanceInterface";

import { TeacherAttendanceHeader } from "../../components/teacher/attendance/TeacherAttendanceHeader";
import { TeacherAttendanceTable } from "../../components/teacher/attendance/TeacherAttendanceTable";
import { TeacherAttendanceHistoryDrawer } from "../../components/teacher/attendance/TeacherAttendanceHistoryDrawer";

const { Text } = Typography;

export default function AttendanceManagement() {
  // State: Classes & Selection
  const [classList, setClassList] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format("YYYY-MM-DD"));

  // State: Student Attendance Records & Stats
  const [records, setRecords] = useState<IStudentAttendanceRecord[]>([]);
  const [stats, setStats] = useState<IAttendanceStats>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    presentRate: 0,
  });

  // State: UI & Drawer Controls
  const [loadingClasses, setLoadingClasses] = useState<boolean>(true);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Teacher's Assigned Classes
  const fetchClasses = useCallback(async () => {
    setLoadingClasses(true);
    setError(null);
    try {
      const res = await classApi.getMyClasses();
      const raw = res.data?.data || res.data?.classList || res.data || [];
      const list = Array.isArray(raw) ? raw : [];
      setClassList(list);

      if (list.length > 0 && !selectedClassId) {
        setSelectedClassId(list[0]._id);
      }
    } catch (err: any) {
      console.error("[Attendance] Fetch classes error:", err);
      setError(err.message || "Không thể nạp danh sách lớp học. Vui lòng thử lại!");
    } finally {
      setLoadingClasses(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // 2. Fetch Attendance Records & Stats for selected class and date
  const fetchAttendanceData = useCallback(async () => {
    if (!selectedClassId) return;

    setLoadingAttendance(true);
    setError(null);

    try {
      // Fetch selected class details for student list
      const selectedClassObj = classList.find((c) => c._id === selectedClassId);
      const studentList = Array.isArray(selectedClassObj?.students) ? selectedClassObj.students : [];

      // Fetch existing attendance records from Backend for this class & date
      const [attendRes, statsRes] = await Promise.all([
        attendanceApi.getAttendanceByClass(selectedClassId, selectedDate).catch(() => null),
        attendanceApi.getAttendanceStats(selectedClassId).catch(() => null),
      ]);

      const existingRecords = attendRes?.data?.data || [];

      // Merge class students with existing records
      const merged: IStudentAttendanceRecord[] = studentList.map((st: any) => {
        const studentObj = typeof st.studentId === "object" ? st.studentId : null;
        const sId = studentObj?._id || st._id || st.studentId;

        const foundRecord = existingRecords.find((rec: any) => {
          const recStudentId = typeof rec.studentId === "object" ? rec.studentId?._id : rec.studentId;
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
        // Calculate local stats if backend stats endpoint returns empty
        const total = merged.length;
        const present = merged.filter((r) => r.status === "Present").length;
        const late = merged.filter((r) => r.status === "Late").length;
        const excused = merged.filter((r) => r.status === "Excused").length;
        const absent = merged.filter((r) => r.status === "Absent").length;
        const presentRate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

        setStats({ total, present, late, excused, absent, presentRate });
      }

    } catch (err: any) {
      console.error("[Attendance] Fetch attendance error:", err);
      setError(err.message || "Không thể tải bản ghi điểm danh!");
    } finally {
      setLoadingAttendance(false);
    }
  }, [selectedClassId, selectedDate, classList]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  // Handlers for status & note updates
  const handleChangeStatus = useCallback((studentId: string, status: AttendanceStatus) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, status } : r))
    );
  }, []);

  const handleChangeNote = useCallback((studentId: string, note: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.studentId === studentId ? { ...r, note } : r))
    );
  }, []);

  const handleMarkAll = useCallback((status: AttendanceStatus) => {
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  }, []);

  // Save Attendance to Backend
  const handleSaveAttendance = useCallback(async () => {
    if (!selectedClassId || records.length === 0) {
      toast.error("Không có dữ liệu học sinh để lưu điểm danh!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        classId: selectedClassId,
        date: selectedDate,
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note,
        })),
      };

      await attendanceApi.markAttendance(payload);
      toast.success(`Đã lưu điểm danh lớp ngày ${dayjs(selectedDate).format("DD/MM/YYYY")} thành công!`);

      // Refresh stats
      fetchAttendanceData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu bản ghi điểm danh!");
    } finally {
      setSaving(false);
    }
  }, [selectedClassId, selectedDate, records, fetchAttendanceData]);

  const selectedClassObj = useMemo(
    () => classList.find((c) => c._id === selectedClassId),
    [classList, selectedClassId]
  );

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* 1. Header Banner & Class Selector */}
      <TeacherAttendanceHeader
        classList={classList}
        selectedClassId={selectedClassId}
        onSelectClass={setSelectedClassId}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        stats={stats}
        loading={loadingClasses}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi kết nối dữ liệu điểm danh"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" danger icon={<ReloadOutlined />} onClick={fetchAttendanceData}>
              Thử lại
            </Button>
          }
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      {/* 2. Main Attendance Table */}
      {loadingClasses || loadingAttendance ? (
        <Card style={{ borderRadius: 12 }}>
          <Skeleton active paragraph={{ rows: 8 }} />
        </Card>
      ) : classList.length === 0 ? (
        <Card style={{ borderRadius: 12, padding: 40, textAlign: "center" }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">Bạn chưa được phân công quản lý lớp học nào để điểm danh.</Text>}
          />
        </Card>
      ) : (
        <TeacherAttendanceTable
          records={records}
          onChangeRecordStatus={handleChangeStatus}
          onChangeRecordNote={handleChangeNote}
          onMarkAll={handleMarkAll}
          onSave={handleSaveAttendance}
          saving={saving}
          loading={loadingAttendance}
        />
      )}

      {/* 3. Attendance History Drawer */}
      <TeacherAttendanceHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        classId={selectedClassId}
        className={selectedClassObj?.className}
      />
    </div>
  );
}
