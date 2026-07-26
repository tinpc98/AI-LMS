import React, { useState, useEffect } from "react";
import { Drawer, List, Tag, Typography, Space, Spin, Empty, Button } from "antd";
import { CalendarOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { attendanceApi } from "../../../api/attendanceApi";
import type { IAttendanceItem } from "../../../interface/attendanceInterface";

const { Text, Title } = Typography;

interface TeacherAttendanceHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  classId?: string;
  className?: string;
}

export const TeacherAttendanceHistoryDrawer: React.FC<TeacherAttendanceHistoryDrawerProps> = React.memo(
  ({ open, onClose, classId, className = "Lớp học" }) => {
    const [historyList, setHistoryList] = useState<IAttendanceItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
      if (open && classId) {
        setLoading(true);
        attendanceApi
          .getAttendanceByClass(classId)
          .then((res) => {
            const raw = res.data?.data || res.data || [];
            setHistoryList(Array.isArray(raw) ? raw : []);
          })
          .catch((err) => {
            console.warn("[AttendanceHistory] Fetch warning:", err);
            setHistoryList([]);
          })
          .finally(() => setLoading(false));
      }
    }, [open, classId]);

    const getStatusTag = (status?: string) => {
      switch (status) {
        case "Present":
          return <Tag color="success">🟢 Có mặt</Tag>;
        case "Late":
          return <Tag color="warning">🟡 Đi muộn</Tag>;
        case "Excused":
          return <Tag color="processing">🔵 Có phép</Tag>;
        case "Absent":
          return <Tag color="error">🔴 Vắng</Tag>;
        default:
          return <Tag color="blue">{status || "Có mặt"}</Tag>;
      }
    };

    return (
      <Drawer
        title={
          <Space>
            <CalendarOutlined style={{ color: "#1890ff" }} />
            <span>Lịch sử điểm danh: {className}</span>
          </Space>
        }
        placement="right"
        width={480}
        onClose={onClose}
        open={open}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip="Đang nạp lịch sử điểm danh..." />
          </div>
        ) : historyList.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={historyList}
            renderItem={(item) => {
              const studentObj = typeof item.studentId === "object" ? item.studentId : null;
              const name = studentObj?.fullName || "Học sinh";
              const email = studentObj?.email || "";
              const dateStr = item.date ? new Date(item.date).toLocaleDateString("vi-VN") : "";

              return (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Text strong style={{ fontSize: 14 }}>
                          {name}
                        </Text>
                        {getStatusTag(item.status)}
                      </div>
                    }
                    description={
                      <div>
                        {email && <Text type="secondary" style={{ fontSize: 12, display: "block" }}>{email}</Text>}
                        <Space size={12} style={{ fontSize: 12, color: "#8c8c8c", marginTop: 4 }}>
                          <Space size={4}>
                            <ClockCircleOutlined />
                            <span>Ngày: {dateStr}</span>
                          </Space>
                          {item.note && <Text type="secondary">Ghi chú: {item.note}</Text>}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử điểm danh nào cho lớp này." />
        )}
      </Drawer>
    );
  }
);

TeacherAttendanceHistoryDrawer.displayName = "TeacherAttendanceHistoryDrawer";
