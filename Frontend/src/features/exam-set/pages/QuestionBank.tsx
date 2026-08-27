import { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Popconfirm,
  Empty,
  Skeleton,
  Tooltip,
  Alert,
  Upload,
  Dropdown,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  DatabaseOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  UploadOutlined,
  FileExcelOutlined,
  ReloadOutlined,
  MoreOutlined,
} from "@ant-design/icons";

import { QuestionStatistic } from "../components/QuestionStatistic";
import { QuestionFormDrawer } from "../components/QuestionFormDrawer";
import { QuestionPreviewDrawer } from "../components/QuestionPreviewDrawer";
import { extractPlainText } from "../../question/contentText";
import { isChoiceQuestion, getQuestionTypeLabel } from "../../../shared/utils/questionTypeUtils";

import { useQuestionBank, getTopicName } from "../hooks/useQuestionBank";
import type { Question } from "../../question/question.types";

const { Title, Text, Paragraph } = Typography;

export default function QuestionBank() {
  // Custom Hook
  const {
    loading,
    error,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    difficultyFilter,
    setDifficultyFilter,
    sortBy,
    setSortBy,
    filteredQuestions,
    fetchQuestions,
    handleDeleteQuestion,
    handleCustomImport,
    questions,
  } = useQuestionBank();

  // Drawer states
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [isPreviewDrawerOpen, setIsPreviewDrawerOpen] = useState(false);
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);

  const columns: ColumnsType<Question> = [
    {
      title: "#",
      key: "index",
      width: 50,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Nội dung câu hỏi",
      key: "content",
      render: (_, record) => {
        const topicName = getTopicName(record);
        return (
          <div>
            <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
              {extractPlainText(record.content) || <Text type="secondary">(Chưa có nội dung)</Text>}
            </Paragraph>
            {topicName && (
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginTop: 2 }}>
                Chủ đề: {topicName}
              </Text>
            )}
          </div>
        );
      },
    },
    {
      title: "Loại câu",
      dataIndex: "type",
      key: "type",
      width: 140,
      render: (type) => (
        <Tag color={isChoiceQuestion(type) ? "blue" : "purple"}>
          {isChoiceQuestion(type) ? "🔵 " : "🟣 "}
          {getQuestionTypeLabel(type)}
        </Tag>
      ),
    },
    {
      title: "Độ khó",
      dataIndex: "difficulty",
      key: "difficulty",
      width: 120,
      render: (diff) => {
        switch (diff) {
          case "EASY":
            return <Tag color="green">🟢 Dễ</Tag>;
          case "HARD":
            return <Tag color="red">🔴 Khó</Tag>;
          default:
            return <Tag color="orange">🟡 Vừa</Tag>;
        }
      },
    },
    {
      title: "Đáp án đúng",
      key: "correctAnswer",
      width: 180,
      render: (_, record) => {
        if (!isChoiceQuestion(record.type))
          return (
            <Text type="secondary" style={{ fontStyle: "italic", fontSize: 12 }}>
              Chấm tay
            </Text>
          );
        const correctText = (record.options || [])
          .filter((o) => o.isCorrect)
          .map((o) => extractPlainText(o.content))
          .join(", ");
        return correctText ? (
          <Text strong style={{ color: "var(--color-success-base)", fontSize: 13 }} ellipsis>
            {correctText}
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : "N/A"),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      align: "right",
      render: (_, record) => {
        const menuItems: MenuProps["items"] = [
          {
            key: "view",
            icon: <EyeOutlined />,
            label: "Xem chi tiết",
            onClick: () => {
              setViewingQuestion(record);
              setIsPreviewDrawerOpen(true);
            },
          },
          {
            key: "edit",
            icon: <EditOutlined />,
            label: "Chỉnh sửa",
            onClick: () => {
              setEditingQuestion(record);
              setIsFormDrawerOpen(true);
            },
          },
        ];

        return (
          <Space size={8}>
            <Button
              type="primary"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setViewingQuestion(record);
                setIsPreviewDrawerOpen(true);
              }}
              style={{ borderRadius: 6 }}
            >
              Xem
            </Button>

            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>

            <Popconfirm
              title="Xóa câu hỏi này?"
              description="Câu hỏi sẽ bị xóa khỏi Ngân hàng đề thi."
              onConfirm={() => handleDeleteQuestion(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa câu hỏi">
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 1400,
        margin: "0 auto",
        backgroundColor: "var(--color-bg-page)",
        minHeight: "100vh",
      }}
    >
      {/* 1. Header Banner */}
      <Card
        style={{
          borderRadius: 16,
          background:
            "linear-gradient(135deg, var(--color-sidebar-bg) 0%, var(--color-sidebar-hover) 100%)",
          color: "var(--color-surface)",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(0, 33, 64, 0.25)",
        }}
        styles={{ body: { padding: "24px 32px" } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <Space size={12} align="center">
              <DatabaseOutlined style={{ fontSize: 28, color: "var(--color-surface)" }} />
              <Title
                level={3}
                style={{ color: "var(--color-surface)", margin: 0, fontWeight: 700 }}
              >
                Ngân hàng câu hỏi Hệ thống (Question Bank)
              </Title>
            </Space>
            <Text
              style={{
                color: "rgba(255,255,255,0.85)",
                display: "block",
                marginTop: 8,
                fontSize: 14,
              }}
            >
              Tạo và quản lý kho câu hỏi dùng chung để tái sử dụng cho các bài kiểm tra, kỳ thi Giữa
              kỳ và Cuối kỳ.
            </Text>
          </div>

          <Button
            type="default"
            icon={<ReloadOutlined spin={loading} />}
            onClick={fetchQuestions}
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              borderColor: "rgba(255,255,255,0.4)",
              color: "var(--color-surface)",
              fontWeight: 600,
            }}
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* 2. Quick Statistics Cards */}
      <QuestionStatistic questions={questions} />

      {/* Error Alert */}
      {error && (
        <Alert
          message="Lỗi nạp ngân hàng câu hỏi"
          description={error}
          type="error"
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              danger
              icon={<ReloadOutlined />}
              onClick={fetchQuestions}
            >
              Thử lại
            </Button>
          }
          style={{ borderRadius: 8, marginBottom: 20 }}
        />
      )}

      {/* 3. Main Content: Toolbar & Table */}
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Space size={12} wrap>
              <Input
                placeholder="Tìm nội dung hoặc chủ đề..."
                prefix={<SearchOutlined style={{ color: "var(--color-text-disabled)" }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 250, borderRadius: 8 }}
                allowClear
              />

              <Select
                value={typeFilter}
                onChange={(val) => setTypeFilter(val)}
                style={{ width: 160 }}
                suffixIcon={<FilterOutlined />}
                options={[
                  { value: "all", label: "Tất cả loại câu" },
                  { value: "MCQ", label: "🔵 Trắc nghiệm" },
                  { value: "TRUE_FALSE", label: "⚪ Đúng / Sai" },
                  { value: "SHORT_ANSWER", label: "🟠 Điền khuyết" },
                  { value: "ESSAY", label: "🟣 Tự luận" },
                ]}
              />

              <Select
                value={difficultyFilter}
                onChange={(val) => setDifficultyFilter(val)}
                style={{ width: 140 }}
                options={[
                  { value: "all", label: "Tất cả độ khó" },
                  { value: "EASY", label: "🟢 Dễ" },
                  { value: "MEDIUM", label: "🟡 Vừa" },
                  { value: "HARD", label: "🔴 Khó" },
                ]}
              />

              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                style={{ width: 140 }}
                options={[
                  { value: "newest", label: "Mới nhất" },
                  { value: "topic", label: "Chủ đề A -> Z" },
                  { value: "content", label: "Nội dung A -> Z" },
                ]}
              />
            </Space>

            <Space size={10} wrap>
              <Upload customRequest={handleCustomImport} showUploadList={false} accept=".xlsx,.xls">
                <Button
                  type="default"
                  icon={<UploadOutlined style={{ color: "var(--color-success-base)" }} />}
                >
                  Import Excel
                </Button>
              </Upload>

              <Tooltip title="Chức năng Xuất file chưa được Backend hỗ trợ API">
                <Button type="default" disabled icon={<FileExcelOutlined />}>
                  Export
                </Button>
              </Tooltip>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingQuestion(null);
                  setIsFormDrawerOpen(true);
                }}
                style={{ fontWeight: 600, borderRadius: 8 }}
              >
                Tạo câu hỏi mới
              </Button>
            </Space>
          </div>
        }
        style={{ borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        {loading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 6 }} />
          </div>
        ) : filteredQuestions.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredQuestions}
            rowKey={(record, index) => record._id || `q-${index}`}
            rowSelection={{ type: "checkbox" }}
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <div style={{ padding: 40, textAlign: "center" }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <Text type="secondary">
                  {searchQuery || typeFilter !== "all" || difficultyFilter !== "all"
                    ? "Không tìm thấy câu hỏi nào phù hợp bộ lọc."
                    : "Ngân hàng câu hỏi hệ thống đang trống."}
                </Text>
              }
            >
              {!searchQuery && typeFilter === "all" && difficultyFilter === "all" && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsFormDrawerOpen(true);
                  }}
                  style={{ borderRadius: 6 }}
                >
                  Thêm câu hỏi đầu tiên
                </Button>
              )}
            </Empty>
          </div>
        )}
      </Card>

      {/* Form Drawer (Add / Edit) */}
      <QuestionFormDrawer
        open={isFormDrawerOpen}
        onClose={() => {
          setIsFormDrawerOpen(false);
          setEditingQuestion(null);
        }}
        initialData={editingQuestion}
        onSaved={fetchQuestions}
      />

      {/* Preview Drawer */}
      <QuestionPreviewDrawer
        open={isPreviewDrawerOpen}
        onClose={() => {
          setIsPreviewDrawerOpen(false);
          setViewingQuestion(null);
        }}
        question={viewingQuestion}
      />
    </div>
  );
}
