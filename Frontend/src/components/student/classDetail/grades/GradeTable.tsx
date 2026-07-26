import React from "react";
import { Table, Tag, Button, Typography, Space, Tooltip, Card } from "antd";
import { InfoCircleOutlined, TrophyOutlined } from "@ant-design/icons";
import GradeStatusTag from "./GradeStatusTag";
import type { IGradeItem } from "../../../types/studentGrade";

const { Text } = Typography;

interface GradeTableProps {
  items: IGradeItem[];
  onDetail: (item: IGradeItem) => void;
}

export const GradeTable: React.FC<GradeTableProps> = React.memo(({ items, onDetail }) => {
  const columns = [
    {
      title: "Tên bài / Đầu điểm",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: IGradeItem) => (
        <Space direction="vertical" size={2}>
          <Text strong style={{ color: "#1f2937", fontSize: 14 }}>
            {text}
          </Text>
          {record.feedback && (
            <Text type="secondary" ellipsis style={{ fontSize: 11, maxWidth: 260 }}>
              💬 "{record.feedback}"
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Phân loại",
      dataIndex: "category",
      key: "category",
      width: 130,
      render: (cat: string) => {
        let color = "blue";
        if (cat === "Exam") color = "purple";
        else if (cat === "Quiz") color = "orange";
        else if (cat === "Attendance") color = "cyan";
        return (
          <Tag color={color} style={{ borderRadius: 6, fontWeight: 600 }}>
            {cat}
          </Tag>
        );
      },
    },
    {
      title: "Trọng số",
      dataIndex: "weight",
      key: "weight",
      width: 100,
      align: "center" as const,
      render: (weight: number) => <Text style={{ fontSize: 13 }}>{weight}%</Text>,
    },
    {
      title: "Điểm đạt / Tối đa",
      dataIndex: "score",
      key: "score",
      width: 150,
      align: "center" as const,
      render: (score: number | null, record: IGradeItem) => {
        if (score === null || score === undefined) {
          return <Text type="secondary">-- / {record.maxScore}</Text>;
        }

        const color = score >= 8 ? "#389e0d" : score >= 5 ? "#d48806" : "#cf1322";

        return (
          <Tag color={score >= 8 ? "green" : score >= 5 ? "gold" : "red"} style={{ borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
            {score} / {record.maxScore}
          </Tag>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      align: "center" as const,
      render: (status: any) => <GradeStatusTag status={status} />,
    },
    {
      title: "Ngày chấm",
      dataIndex: "gradedAt",
      key: "gradedAt",
      width: 140,
      render: (date?: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {date ? new Date(date).toLocaleDateString("vi-VN") : "--"}
        </Text>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      width: 100,
      align: "center" as const,
      render: (_: any, record: IGradeItem) => (
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
    <Card styles={{ body: { padding: 0 } }} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #f0f0f0" }}>
      <Table
        dataSource={items}
        columns={columns}
        rowKey="_id"
        pagination={{ pageSize: 8, showSizeChanger: false }}
        size="middle"
      />
    </Card>
  );
});

GradeTable.displayName = "GradeTable";

export default GradeTable;
