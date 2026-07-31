import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../../shared/api/queryKeys";
import {
  Modal,
  Table,
  Avatar,
  Radio,
  Input,
  Button,
  Space,
  Typography,
  Progress,
  Alert,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  UserOutlined,
  SaveOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { attendanceApi } from "../../../../api/attendanceApi";
import { buildAttendanceRoster } from "../../../attendance/attendanceRoster";
import { toast } from "../../../../utils/toast";
import type {
  AttendanceStatus,
  IStudentAttendanceRecord,
  IVirtualSession,
} from "../../../../interface/attendanceInterface";

const { Text } = Typography;

interface AttendancePopupProps {
  open: boolean;
  onClose: () => void;
  session: IVirtualSession | null;
  students: any[];
  onSaved: () => void;
}

export const AttendancePopup: React.FC<AttendancePopupProps> = ({
  open,
  onClose,
  session,
  students,
  onSaved,
}) => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<dayjs.Dayjs>(() => dayjs());

  // Đồng hồ cho phần đếm ngược. Effect ở đây ĐÚNG mục đích — nó đăng ký với một hệ thống bên
  // ngoài — nhưng bản cũ còn gọi thêm setCurrentTime(dayjs()) ngay trong thân effect để làm
  // mới giờ lúc mở lại. Việc đó tách ra dưới đây theo mẫu "adjust state during render", nên
  // effect chỉ còn làm mỗi việc bật/tắt bộ đếm.
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
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
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [session, currentTime, isClosed, isUpcoming]);

  // Dữ liệu điểm danh đã lưu của buổi này. React Query thay cho useState + useEffect.
  const { data: existingRecords = [], isLoading: loading } = useQuery({
    queryKey: queryKeys.class.attendanceByDate(session?.classId, session?.date),
    queryFn: async () => {
      const res = await attendanceApi.getAttendanceByClass(session!.classId, session!.date);
      return res.data.data || [];
    },
    enabled: open && !!session,
  });

  // TÁCH "DỮ LIỆU MÁY CHỦ" KHỎI "SỬA ĐỔI CHƯA LƯU CỦA GIÁO VIÊN".
  //
  // Bản cũ nhét cả hai vào một ô state records: nạp xong thì ghi đè, giáo viên sửa thì ghi
  // tiếp lên đó. Hệ quả là mọi lần nạp lại đều XOÁ SẠCH những gì giáo viên vừa nhập mà không
  // báo gì. Giờ danh sách gốc suy từ cache, còn sửa đổi nằm riêng và phủ lên trên.
  const roster = useMemo(
    () => buildAttendanceRoster(students, existingRecords),
    [students, existingRecords]
  );
  const [edits, setEdits] = useState<Record<string, Partial<IStudentAttendanceRecord>>>({});

  // Mở lại popup thì bỏ các sửa đổi dở dang của lần trước.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) setEdits({});
  }

  const records = useMemo(
    () => roster.map((r) => ({ ...r, ...edits[r.studentId] })),
    [roster, edits]
  );

  const applyEdit = (studentId: string, patch: Partial<IStudentAttendanceRecord>) =>
    setEdits((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...patch } }));

  const handleChangeStatus = (studentId: string, status: AttendanceStatus) => {
    if (isClosed || isUpcoming) return;
    applyEdit(studentId, { status });
  };

  const handleChangeNote = (studentId: string, note: string) => {
    if (isClosed || isUpcoming) return;
    applyEdit(studentId, { note });
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    if (isClosed || isUpcoming) return;
    setEdits((prev) => {
      const next = { ...prev };
      for (const r of roster) next[r.studentId] = { ...next[r.studentId], status };
      return next;
    });
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
      // Bỏ hiệu lực cache: lần mở popup sau phải đọc lại từ máy chủ, không dùng bản đã cũ.
      await queryClient.invalidateQueries({
        queryKey: queryKeys.class.attendanceByDate(session.classId, session.date),
      });
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
            <Text strong style={{ display: "block" }}>
              {record.fullName}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
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
          <Radio.Button
            value="Present"
            style={{
              backgroundColor: record.status === "Present" ? "#52c41a" : undefined,
              color: record.status === "Present" ? "#fff" : undefined,
            }}
          >
            Có mặt
          </Radio.Button>
          <Radio.Button
            value="Late"
            style={{
              backgroundColor: record.status === "Late" ? "#faad14" : undefined,
              color: record.status === "Late" ? "#fff" : undefined,
            }}
          >
            Đi muộn
          </Radio.Button>
          <Radio.Button
            value="Excused"
            style={{
              backgroundColor: record.status === "Excused" ? "#1890ff" : undefined,
              color: record.status === "Excused" ? "#fff" : undefined,
            }}
          >
            Có phép
          </Radio.Button>
          <Radio.Button
            value="Absent"
            style={{
              backgroundColor: record.status === "Absent" ? "#ff4d4f" : undefined,
              color: record.status === "Absent" ? "#fff" : undefined,
            }}
          >
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

  const presentCount = records.filter((r) => r.status === "Present").length;
  const totalCount = records.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <Modal
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingRight: 24,
          }}
        >
          <div>
            <Text strong style={{ fontSize: 18 }}>
              Điểm danh buổi học: {session ? dayjs(session.date).format("DD/MM/YYYY") : ""}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 13, fontWeight: "normal" }}>
              Thời gian: {session?.startTime} - {session?.endTime}
            </Text>
          </div>
          {activeCountdown && (
            <div
              style={{
                textAlign: "right",
                background: "#fff1f0",
                padding: "4px 12px",
                borderRadius: 6,
                border: "1px solid #ffccc7",
              }}
            >
              <Text type="danger" strong style={{ fontSize: 12, display: "block" }}>
                THỜI GIAN CÒN LẠI
              </Text>
              <Space size={6}>
                <ClockCircleOutlined style={{ color: "#ff4d4f" }} />
                <Text type="danger" strong style={{ fontSize: 16, fontFamily: "monospace" }}>
                  {activeCountdown}
                </Text>
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
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={isClosed || isUpcoming}
          >
            Lưu điểm danh
          </Button>
        </Space>
      }
    >
      {isClosed && (
        <Alert
          message="Thời gian điểm danh đã kết thúc. Bạn không thể lưu điểm danh cho buổi học này nữa."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {isUpcoming && (
        <Alert
          message="Buổi học chưa bắt đầu."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Space>
          <Button
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleMarkAll("Present")}
            disabled={isClosed || isUpcoming}
          >
            Có mặt tất cả
          </Button>
          <Button
            size="small"
            icon={<CloseCircleOutlined />}
            onClick={() => handleMarkAll("Absent")}
            disabled={isClosed || isUpcoming}
          >
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
