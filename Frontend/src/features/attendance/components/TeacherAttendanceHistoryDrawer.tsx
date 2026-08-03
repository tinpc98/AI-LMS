import React, { useState, useEffect } from "react";
import { Drawer, Table, Tag, Typography, Space, Spin, Empty, Avatar, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CalendarOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { attendanceApi } from "../../../api/attendanceApi";
import type { IAttendanceMatrix } from "../../../interface/attendanceInterface";

const { Text } = Typography;

interface TeacherAttendanceHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  classId?: string;
  className?: string;
}

export const TeacherAttendanceHistoryDrawer: React.FC<TeacherAttendanceHistoryDrawerProps> =
  React.memo(({ open, onClose, classId, className = "Lớp học" }) => {
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
      let icon = (
        <Tag
          color="default"
          style={{ margin: 0, width: 36, textAlign: "center", cursor: "default" }}
        >
          CGN
        </Tag>
      );
      switch (status) {
        case "Present":
          icon = (
            <Tag
              color="success"
              style={{ margin: 0, width: 36, textAlign: "center", cursor: "default" }}
            >
              CM
            </Tag>
          );
          break;
        case "Late":
          icon = (
            <Tag
              color="warning"
              style={{ margin: 0, width: 36, textAlign: "center", cursor: "default" }}
            >
              M
            </Tag>
          );
          break;
        case "Excused":
          icon = (
            <Tag
              color="processing"
              style={{ margin: 0, width: 36, textAlign: "center", cursor: "default" }}
            >
              CP
            </Tag>
          );
          break;
        case "Absent":
          icon = (
            <Tag
              color="error"
              style={{ margin: 0, width: 36, textAlign: "center", cursor: "default" }}
            >
              V
            </Tag>
          );
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
              <Text strong style={{ display: "block", fontSize: 13 }}>
                {record.fullName}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.email}
              </Text>
            </div>
          </Space>
        ),
      },
    ];

    if (matrix && matrix.sessions) {
      // Sort sessions ascending for history matrix timeline
      const sortedSessions = [...matrix.sessions].sort(
        (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
      );

      sortedSessions.forEach((session) => {
        columns.push({
          title: (
            <div style={{ textAlign: "center", minWidth: 48 }}>
              <div style={{ fontSize: 12 }}>{dayjs(session.date).format("DD/MM")}</div>
            </div>
          ),
          dataIndex: session.date,
          key: session.date,
          width: 60,
          align: "center",
          render: (_, studentRecord) => {
            const attendRecord = matrix.records[studentRecord._id]?.[session.date];
            if (attendRecord) {
              return getStatusIcon(attendRecord.status, attendRecord.note);
            }
            if (session.status === "Closed") {
              return (
                <Tooltip title="Không điểm danh">
                  <span style={{ color: "var(--color-text-disabled)" }}>X</span>
                </Tooltip>
              );
            }
            return <span style={{ color: "var(--color-border-default)" }}>-</span>;
          },
        });
      });

      // Add Summary Columns
      columns.push({
        title: "Tổng",
        key: "summary_total",
        fixed: "right",
        width: 60,
        align: "center",
        render: (_, studentRecord) => {
          let count = 0;
          sortedSessions.forEach((s) => {
            if (s.status === "Closed" || matrix.records[studentRecord._id]?.[s.date]) count++;
          });
          return <Text strong>{count}</Text>;
        },
      });
      columns.push({
        title: "CM",
        key: "summary_cm",
        fixed: "right",
        width: 50,
        align: "center",
        render: (_, studentRecord) => {
          let count = 0;
          sortedSessions.forEach((s) => {
            if (matrix.records[studentRecord._id]?.[s.date]?.status === "Present") count++;
          });
          return (
            <Text type="success" strong>
              {count}
            </Text>
          );
        },
      });
      columns.push({
        title: "V/M",
        key: "summary_vm",
        fixed: "right",
        width: 50,
        align: "center",
        render: (_, studentRecord) => {
          let count = 0;
          sortedSessions.forEach((s) => {
            const st = matrix.records[studentRecord._id]?.[s.date]?.status;
            if (st === "Absent" || st === "Late") count++;
          });
          return (
            <Text type="danger" strong>
              {count}
            </Text>
          );
        },
      });
      columns.push({
        title: "Tỷ lệ",
        key: "summary_rate",
        fixed: "right",
        width: 70,
        align: "center",
        render: (_, studentRecord) => {
          let total = 0;
          let cm = 0;
          sortedSessions.forEach((s) => {
            if (s.status === "Closed" || matrix.records[studentRecord._id]?.[s.date]) total++;
            if (matrix.records[studentRecord._id]?.[s.date]?.status === "Present") cm++;
          });
          const rate = total > 0 ? Math.round((cm / total) * 100) : 0;
          const color = rate >= 80 ? "success" : rate >= 50 ? "warning" : "danger";
          return (
            <Text type={color} strong>
              {rate}%
            </Text>
          );
        },
      });
    }

    return (
      <Drawer
        title={
          <Space>
            <CalendarOutlined style={{ color: "var(--color-action-primary-bg)" }} />
            <span>Ma trận điểm danh: {className}</span>
          </Space>
        }
        placement="right"
        width="95%"
        onClose={onClose}
        open={open}
      >
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            padding: "8px 12px",
            background: "var(--color-bg-page)",
            borderRadius: 8,
          }}
        >
          <Text strong style={{ marginRight: 8 }}>
            Chú thích:
          </Text>
          <Space size={16}>
            <span>
              <Tag color="success">CM</Tag> Có mặt
            </span>
            <span>
              <Tag color="warning">M</Tag> Đi muộn
            </span>
            <span>
              <Tag color="processing">CP</Tag> Có phép
            </span>
            <span>
              <Tag color="error">V</Tag> Vắng
            </span>
            <span>
              <Tag color="default">CGN</Tag> Chưa ghi nhận
            </span>
            <span>
              <Text type="secondary" style={{ marginLeft: 8 }}>
                X: Buổi học đã đóng nhưng không điểm danh
              </Text>
            </span>
          </Space>
        </div>

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
            scroll={{ x: "max-content", y: "calc(100vh - 250px)" }}
            size="small"
            bordered
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu điểm danh." />
        )}
      </Drawer>
    );
  });

TeacherAttendanceHistoryDrawer.displayName = "TeacherAttendanceHistoryDrawer";
