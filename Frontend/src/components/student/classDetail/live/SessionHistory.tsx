import React from "react";
import { Card, Typography, Space, Button, Table } from "antd";
import { InfoCircleOutlined, HistoryOutlined, VideoCameraOutlined } from "@ant-design/icons";
import SessionStatusTag from "./SessionStatusTag";
import type { IExtendedLiveSession } from "../../../types/studentLive";

const { Text } = Typography;

interface SessionHistoryProps {
  sessions: IExtendedLiveSession[];
  onDetail: (session: IExtendedLiveSession) => void;
}

export const SessionHistory: React.FC<SessionHistoryProps> = React.memo(({ sessions, onDetail }) => {
  const columns = [
    {
      title: "Buổi học",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: IExtendedLiveSession) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ fontSize: 13, color: "#1f2937" }}>
            {title}
          </Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Nền tảng: {record.platform || "Jitsi Meet"}
          </Text>
        </Space>
      ),
    },
    {
      title: "Ngày học",
      dataIndex: "scheduledStart",
      key: "scheduledStart",
      width: 140,
      render: (dateStr?: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dateStr ? new Date(dateStr).toLocaleDateString("vi-VN") : "--"}
        </Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center" as const,
      render: (status: any) => <SessionStatusTag status={status} />,
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      align: "center" as const,
      render: (_: any, record: IExtendedLiveSession) => (
        <Button
          type="default"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => onDetail(record)}
          style={{ borderRadius: 6, fontSize: 12 }}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <Card
      title={
        <span style={{ fontSize: 15, fontWeight: 700 }}>
          <HistoryOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Lịch sử các buổi học trực tuyến
        </span>
      }
      style={{ borderRadius: 16, border: "1px solid #f0f0f0" }}
      styles={{ body: { padding: 0 } }}
    >
      <Table
        dataSource={sessions}
        columns={columns}
        rowKey="_id"
        pagination={false}
        size="middle"
      />
    </Card>
  );
});

SessionHistory.displayName = "SessionHistory";

export default SessionHistory;
