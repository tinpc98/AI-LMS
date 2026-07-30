import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Table, Avatar, Radio, Input, Button, Space, Typography, Progress, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";
import { UserOutlined, SaveOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { attendanceApi } from "../../../api/attendanceApi";
import { toast } from "../../../utils/toast";
import type { AttendanceStatus, IStudentAttendanceRecord, IVirtualSession } from "../../../interface/attendanceInterface";

const { Text } = Typography;

interface AttendancePopupProps {
  open: boolean;
  onClose: () => void;
  session: IVirtualSession | null;
  students: any[];
  onSaved: () => void;
}

export const AttendancePopup: React.FC<AttendancePopupProps> = ({ open, onClose, session, students, onSaved }) => {
  const [records, setRecords] = useState<IStudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<dayjs.Dayjs>(dayjs());

  // Auto update current time every second for popup countdown
  useEffect(() => {
    let timer: any;
    if (open) {
      setCurrentTime(dayjs());
      timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    }
    return () => clearInterval(timer);
  }, [open]);

  const isClosed = useMemo(() => {
    if (!session) return true;
    const endTime = dayjs(`${session.date}T${session.endTime}:00`);
    return currentTime.isAfter(endTime);
  }, [session, currentTime]);

  const isUpcoming = useMemo(() => {
    if (!session) return true;
    const startTime = dayjs(`${session.date}T${session.startTime}:00`);
    return currentTime.isBefore(startTime);
  }, [session, currentTime]);

  const activeCountdown = useMemo(() => {
    if (!session || isClosed || isUpcoming) return null;
    const end = dayjs(`${session.date}T${session.endTime}:00`);
    const diffMs = end.diff(currentTime);
    if (diffMs <= 0) return "00:00:00";
    
    const h = Math.floor(diffMs / (1000 * 60 * 60));
    const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diffMs % (1000 * 60)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [session, currentTime, isClosed, isUpcoming]);

  const fetchAttendance = useCallback(async () => {
    if (!session || !open) return;
    setLoading(true);
    try {
      const attendRes = await attendanceApi.getAttendanceByClass(session.classId, session.date);
      const existingRecords = attendRes.data.data || [];

      const merged: IStudentAttendanceRecord[] = students.map((st: any) => {
        const studentObj = typeof st.studentId === "object" ? st.studentId : null;
        const sId = (studentObj?._id || st._id || st.studentId).toString();

        const foundRecord = existingRecords.find((rec: any) => {
          const recStudentId = (typeof rec.studentId === "object" ? rec.studentId?._id : rec.studentId || "").toString();
          return recStudentId === sId;
        });

        return {
          studentId: sId,
          fullName: studentObj?.fullName || st.fullName || "Học sinh",
          email: studentObj?.email || st.email || "",
          avatar: studentObj?.avatar || st.avatar,
          status: (foundRecord?.status as AttendanceStatus) || "Present", // Default "Present" for new
          note: foundRecord?.note || "",
        };
      });
      setRecords(merged);
    } catch (error) {
      toast.error("Không thể lấy dữ liệu điểm danh!");
    } finally {
      setLoading(false);
    }
  }, [session, students, open]);

  useEffect(() => {
    if (open) fetchAttendance();
  }, [open, fetchAttendance]);

  const handleChangeStatus = (studentId: string, status: AttendanceStatus) => {
    if (isClosed || isUpcoming) return;
    setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  };

  const handleChangeNote = (studentId: string, note: string) => {
    if (isClosed || isUpcoming) return;
    setRecords((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, note } : r)));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (isClosed || isUpcoming) return;
    setRecords((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleSave = async () => {
    if (!session || records.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        classId: session.classId,
        date: session.date,
        records: records.map((r) => ({
          studentId: r.studentId,
          status: r.status,
          note: r.note,
        })),
      };

      await attendanceApi.markAttendance(payload);
      toast.success("Lưu điểm danh thành công!");
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi lưu điểm danh!");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<IStudentAttendanceRecord> = [
    {
      title: "Học sinh",
      key: "student",
      render: (_, record) => (
        <Space size={12}>
          <Avatar src={record.avatar} icon={!record.avatar ? <UserOutlined /> : undefined} />
          <div>
            <Text strong style={{ display: "block" }}>{record.fullName}</Text>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Trạng thái điểm danh",
      key: "status",
      width: 380,
      render: (_, record) => (
        <Radio.Group
          value={record.status}
          onChange={(e) => handleChangeStatus(record.studentId, e.target.value)}
          buttonStyle="solid"
          size="middle"
          disabled={isClosed || isUpcoming}
        >
          <Radio.Button value="Present" style={{ backgroundColor: record.status === "Present" ? "#52c41a" : undefined, color: record.status === "Present" ? "#fff" : undefined }}>
            Có mặt
          </Radio.Button>
          <Radio.Button value="Late" style={{ backgroundColor: record.status === "Late" ? "#faad14" : undefined, color: record.status === "Late" ? "#fff" : undefined }}>
            Đi muộn
          </Radio.Button>
          <Radio.Button value="Excused" style={{ backgroundColor: record.status === "Excused" ? "#1890ff" : undefined, color: record.status === "Excused" ? "#fff" : undefined }}>
            Có phép
          </Radio.Button>
          <Radio.Button value="Absent" style={{ backgroundColor: record.status === "Absent" ? "#ff4d4f" : undefined, color: record.status === "Absent" ? "#fff" : undefined }}>
            Vắng
          </Radio.Button>
        </Radio.Group>
      ),
    },
    {
      title: "Ghi chú",
      key: "note",
      render: (_, record) => (
        <Input
          placeholder="Nhập ghi chú..."
          value={record.note}
          onChange={(e) => handleChangeNote(record.studentId, e.target.value)}
          disabled={isClosed || isUpcoming}
        />
      ),
    },
  ];

  const presentCount = records.filter(r => r.status === "Present").length;
  const totalCount = records.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <Modal
      title={
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingRight: 24 }}>
          <div>
            <Text strong style={{ fontSize: 18 }}>Điểm danh buổi học: {session ? dayjs(session.date).format("DD/MM/YYYY") : ""}</Text>
            <br/>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: "normal" }}>Thời gian: {session?.startTime} - {session?.endTime}</Text>
          </div>
          {activeCountdown && (
            <div style={{ textAlign: "right", background: "#fff1f0", padding: "4px 12px", borderRadius: 6, border: "1px solid #ffccc7" }}>
              <Text type="danger" strong style={{ fontSize: 12, display: "block" }}>THỜI GIAN CÒN LẠI</Text>
              <Space size={6}>
                <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
                <Text type="danger" strong style={{ fontSize: 16, fontFamily: "monospace" }}>{activeCountdown}</Text>
              </Space>
            </div>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving} disabled={isClosed || isUpcoming}>
            Lưu điểm danh
          </Button>
        </Space>
      }
    >
      {isClosed && (
        <Alert message="Thời gian điểm danh đã kết thúc. Bạn không thể lưu điểm danh cho buổi học này nữa." type="error" showIcon style={{ marginBottom: 16 }} />
      )}
      {isUpcoming && (
        <Alert message="Buổi học chưa bắt đầu." type="warning" showIcon style={{ marginBottom: 16 }} />
      )}
      
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Space>
          <Button size="small" icon={<CheckCircleOutlined />} onClick={() => handleMarkAll("Present")} disabled={isClosed || isUpcoming}>
            Có mặt tất cả
          </Button>
          <Button size="small" icon={<CloseCircleOutlined />} onClick={() => handleMarkAll("Absent")} disabled={isClosed || isUpcoming}>
            Vắng tất cả
          </Button>
        </Space>
        
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Text>Tỷ lệ đi học: {rate}%</Text>
          <Progress type="circle" percent={rate} size={32} />
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={records}
        rowKey="studentId"
        pagination={false}
        loading={loading}
        size="small"
        scroll={{ y: 400 }}
      />
    </Modal>
  );
};
