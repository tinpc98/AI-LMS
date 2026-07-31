import React from "react";
import { Drawer, Button, Typography, Space, Descriptions } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import AttendanceStatusTag from "./AttendanceStatusTag";
import type { IExtendedAttendanceRecord } from "../../../../../types/studentAttendance";

const { Text, Paragraph, Title } = Typography;

interface AttendanceDetailDrawerProps {
  open: boolean;
  item: IExtendedAttendanceRecord | null;
  onClose: () => void;
}

export const AttendanceDetailDrawer: React.FC<AttendanceDetailDrawerProps> = React.memo(
  ({ open, item, onClose }) => {
    if (!item) return null;

    const formattedDate = item.date
      ? new Date(item.date).toLocaleDateString("vi-VN", {
          weekday: "long",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Ngày học";

    const formattedCreatedAt = item.createdAt
      ? new Date(item.createdAt).toLocaleString("vi-VN")
      : "Vừa điểm danh";

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <CalendarOutlined style={{ color: "#1890ff", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                Chi tiết điểm danh buổi học
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {formattedDate}
              </Text>
            </div>
          </Space>
        }
        extra={
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Đóng
          </Button>
        }
        width={560}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          {/* Status Banner */}
          <div
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                Trạng thái điểm danh cá nhân
              </Text>
              <div style={{ marginTop: 4 }}>
                <AttendanceStatusTag status={item.status} />
              </div>
            </div>

            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />{" "}
              {item.sessionTime || "08:00 - 10:30"}
            </Text>
          </div>

          {/* Descriptions Meta */}
          <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { width: "35%", fontWeight: 600, backgroundColor: "#fafafa" } }}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Tên buổi học">{item.sessionTitle}</Descriptions.Item>

            <Descriptions.Item label="Ngày học">{formattedDate}</Descriptions.Item>

            <Descriptions.Item label="Khung giờ">
              {item.sessionTime || "08:00 - 10:30"}
            </Descriptions.Item>

            <Descriptions.Item label="Giảng viên điểm danh">
              <Space size={6}>
                <UserOutlined style={{ color: "#1890ff" }} />
                <span>{item.teacherName || "Giảng viên phụ trách"}</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian ghi nhận">{formattedCreatedAt}</Descriptions.Item>
          </Descriptions>

          {/* Teacher Notes */}
          {item.note ? (
            <div>
              <Text
                strong
                style={{ fontSize: 14, color: "#262626", display: "block", marginBottom: 6 }}
              >
                <CommentOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Ghi chú của giảng
                viên:
              </Text>
              <Paragraph
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  margin: 0,
                  backgroundColor: "#fffbe6",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #ffe58f",
                }}
              >
                {item.note}
              </Paragraph>
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: 12, fontStyle: "italic" }}>
              Giảng viên không để lại ghi chú thêm cho buổi học này.
            </Text>
          )}
        </div>
      </Drawer>
    );
  }
);

AttendanceDetailDrawer.displayName = "AttendanceDetailDrawer";

export default AttendanceDetailDrawer;
