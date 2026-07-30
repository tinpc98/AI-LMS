import React, { useState, useEffect } from "react";
import { Drawer, Table, Tag, Typography, Space, Spin, Empty, Avatar, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CalendarOutlined, UserOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, InfoCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { attendanceApi } from "../../../api/attendanceApi";
import type { IAttendanceMatrix, IVirtualSession } from "../../../interface/attendanceInterface";

const { Text, Title } = Typography;

interface TeacherAttendanceHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  classId?: string;
  className?: string;
}

export const TeacherAttendanceHistoryDrawer: React.FC<TeacherAttendanceHistoryDrawerProps> = React.memo(
  ({ open, onClose, classId, className = "Lớp học" }) => {
    const [matrix, setMatrix] = useState<IAttendanceMatrix | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
      if (open && classId) {
        setLoading(true);
        attendanceApi
          .getAttendanceMatrix(classId)
          .then((res) => {
            setMatrix(res.data.data);
          })
          .catch((err) => {
            console.warn("[AttendanceHistory] Fetch warning:", err);
            setMatrix(null);
          })
          .finally(() => setLoading(false));
      }
    }, [open, classId]);

    const getStatusIcon = (status?: string, note?: string) => {
      let icon = <span style={{ color: "#d9d9d9" }}>-</span>; // Chưa điểm danh
      switch (status) {
        case "Present":
          icon = <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />;
          break;
        case "Late":
          icon = <ClockCircleOutlined style={{ color: "#faad14", fontSize: 16 }} />;
          break;
        case "Excused":
          icon = <InfoCircleOutlined style={{ color: "#1890ff", fontSize: 16 }} />;
          break;
        case "Absent":
          icon = <CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />;
          break;
      }
      return note ? <Tooltip title={note}>{icon}</Tooltip> : icon;
    };

    const columns: ColumnsType<any> = [
      {
        title: "Học sinh",
        key: "student",
        width: 250,
        fixed: "left",
        render: (_, record) => (
          <Space>
            <Avatar src={record.avatar} icon={!record.avatar ? <UserOutlined /> : undefined} />
            <div>
              <Text strong style={{ display: "block", fontSize: 13 }}>{record.fullName}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text>
            </div>
          </Space>
        ),
      },
    ];

    if (matrix && matrix.sessions) {
      // Sort sessions ascending for history matrix timeline
      const sortedSessions = [...matrix.sessions].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
      
      sortedSessions.forEach((session) => {
        columns.push({
          title: (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12 }}>{dayjs(session.date).format("DD/MM")}</div>
            </div>
          ),
          dataIndex: session.date,
          key: session.date,
          width: 70,
          align: "center",
          render: (_, studentRecord) => {
            const attendRecord = matrix.records[studentRecord._id]?.[session.date];
            if (attendRecord) {
              return getStatusIcon(attendRecord.status, attendRecord.note);
            }
            if (session.status === "Closed") {
               return <Tooltip title="Không điểm danh"><span style={{ color: "#bfbfbf" }}>X</span></Tooltip>;
            }
            return <span style={{ color: "#f0f0f0" }}>-</span>;
          },
        });
      });
    }

    return (
      <Drawer
        title={
          <Space>
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <span>Ma trận điểm danh: {className}</span>
          </Space>
        }
        placement="right"
        width="90%"
        onClose={onClose}
        open={open}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip="Đang tải dữ liệu..." />
          </div>
        ) : matrix && matrix.students && matrix.students.length > 0 ? (
          <Table
            columns={columns}
            dataSource={matrix.students}
            rowKey="_id"
            pagination={false}
            scroll={{ x: "max-content", y: "calc(100vh - 200px)" }}
            size="small"
            bordered
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu điểm danh." />
        )}
      </Drawer>
    );
  }
);

TeacherAttendanceHistoryDrawer.displayName = "TeacherAttendanceHistoryDrawer";
