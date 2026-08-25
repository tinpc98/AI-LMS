import React, { useState, useMemo } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  FileDoneOutlined,
} from "@ant-design/icons";
import type { IAssignment } from "../../../../interface/assignmentInterface";
import { TeacherSubmissionsModal } from "./TeacherSubmissionsModal";
import { CreateAssignmentModal } from "../../../assignment/components/CreateAssignmentModal";
import assignmentApi from "../../../../api/assignmentApi";
import { toast } from "../../../../utils/toast";

const { Title, Text, Paragraph } = Typography;

interface TeacherAssignmentsTabProps {
  classId: string;
  className?: string;
  assignments?: IAssignment[];
  onRefresh?: () => void;
  loading?: boolean;
}

export const TeacherAssignmentsTab: React.FC<TeacherAssignmentsTabProps> = React.memo(
  ({ classId, className = "Lớp học", assignments = [], onRefresh, loading = false }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<IAssignment | null>(null);

    const stats = useMemo(() => {
      const total = assignments.length;
      const draftCount = assignments.filter((a) => a.status === "DRAFT").length;
      const publishedCount = assignments.filter((a) => a.status === "PUBLISHED").length;
      return { total, draftCount, publishedCount };
    }, [assignments]);

    const filteredAssignments = useMemo(() => {
      let result = [...assignments];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(
          (a) => a.title.toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q)
        );
      }
      if (statusFilter !== "all") {
        result = result.filter((a) => a.status === statusFilter);
      }
      result.sort((a, b) => {
        if (sortBy === "newest") return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      });
      return result;
    }, [assignments, searchQuery, statusFilter, sortBy]);

    const handlePublish = async (id: string) => {
      try {
        await assignmentApi.publishAssignment(id);
        toast.success("Đã xuất bản bài tập");
        if (onRefresh) onRefresh();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Lỗi xuất bản bài tập");
      }
    };

    const columns: ColumnsType<IAssignment> = [
      {
        title: "Tên bài tập",
        key: "title",
        render: (_, record) => (
          <div>
            <Text strong style={{ fontSize: 15 }}>{record.title}</Text>
            {record.description && (
              <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: "4px 0 0", fontSize: 13 }}>
                {record.description}
              </Paragraph>
            )}
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (status) => (
          <Tag color={status === "PUBLISHED" ? "success" : "default"}>
            {status}
          </Tag>
        ),
      },
      {
        title: "Số câu hỏi",
        key: "questions",
        width: 120,
        render: (_, record) => <Text>{record.questions?.length || 0} câu</Text>,
      },
      {
        title: "Thao tác",
        key: "action",
        width: 250,
        align: "right",
        render: (_, record) => (
          <Space size={8}>
            {record.status === "DRAFT" && (
              <Button size="small" type="dashed" onClick={() => handlePublish(record._id)}>
                Publish
              </Button>
            )}
            <Button
              type="primary"
              size="small"
              icon={<FileDoneOutlined />}
              onClick={() => setSelectedAssignment(record)}
            >
              Xem bài làm
            </Button>
          </Space>
        ),
      },
    ];

    return (
      <div style={{ padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <Title level={4} style={{ margin: 0 }}>Bài tập của {className}</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateModalOpen(true)}>
            Tạo bài tập mới
          </Button>
        </div>

        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card size="small" style={{ borderLeft: "4px solid #1677ff" }}>
              <Statistic title="Tổng số bài tập" value={stats.total} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ borderLeft: "4px solid #52c41a" }}>
              <Statistic title="Đã xuất bản (PUBLISHED)" value={stats.publishedCount} valueStyle={{ color: "#52c41a" }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ borderLeft: "4px solid #d9d9d9" }}>
              <Statistic title="Bản nháp (DRAFT)" value={stats.draftCount} valueStyle={{ color: "#8c8c8c" }} />
            </Card>
          </Col>
        </Row>

        <Card size="small" style={{ marginBottom: 16 }}>
          <Space wrap size={16}>
            <Input
              placeholder="Tìm kiếm bài tập..."
              prefix={<SearchOutlined />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 250 }}
            />
            <Space>
              <FilterOutlined style={{ color: "var(--color-text-description)" }} />
              <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }}>
                <Select.Option value="all">Tất cả trạng thái</Select.Option>
                <Select.Option value="PUBLISHED">Đã xuất bản</Select.Option>
                <Select.Option value="DRAFT">Bản nháp</Select.Option>
              </Select>
            </Space>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredAssignments}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
          loading={loading}
        />

        {isCreateModalOpen && (
          <CreateAssignmentModal
            isOpen={isCreateModalOpen}
            classId={classId}
            onClose={() => setIsCreateModalOpen(false)}
            onCreated={() => {
              setIsCreateModalOpen(false);
              if (onRefresh) onRefresh();
            }}
          />
        )}

        {selectedAssignment && (
          <TeacherSubmissionsModal
            open={!!selectedAssignment}
            onClose={() => setSelectedAssignment(null)}
            assignment={selectedAssignment}
          />
        )}
      </div>
    );
  }
);
