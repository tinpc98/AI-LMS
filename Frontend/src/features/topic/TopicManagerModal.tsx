import React, { useEffect, useState } from "react";
import {
  Modal,
  List,
  Button,
  Input,
  Space,
  Tag,
  Popconfirm,
  Typography,
  Empty,
  message,
} from "antd";
import {
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  InboxOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import { topicService } from "./topicService";
import type { TopicRecord } from "./topic.types";
import SkillManagerModal from "../skill/SkillManagerModal";

interface TopicManagerModalProps {
  open: boolean;
  courseId: string | null;
  courseName?: string;
  onClose: () => void;
}

const statusColor: Record<TopicRecord["status"], string> = {
  DRAFT: "default",
  PUBLISHED: "success",
  ARCHIVED: "warning",
};

// TÍNH NĂNG MỚI: Quản lý Topic thật (đặc tả nghiệp vụ mục 2) — trước đây mỗi khóa học chỉ có
// đúng 1 Topic tự sinh, không có UI nào để giáo viên/admin tự tạo/sắp xếp/xóa Topic.
// Sắp xếp dùng nút lên/xuống thay vì kéo-thả để không phải thêm thư viện DnD mới — cùng đạt
// mục tiêu nghiệp vụ (BR-2.9) với ít code hơn.
const TopicManagerModal: React.FC<TopicManagerModalProps> = ({
  open,
  courseId,
  courseName,
  onClose,
}) => {
  const [topics, setTopics] = useState<TopicRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [skillTopic, setSkillTopic] = useState<TopicRecord | null>(null);

  const loadTopics = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await topicService.getTopicsByCourse(courseId, true);
      setTopics(res.data);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không tải được danh sách Topic");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && courseId) {
      loadTopics();
    } else {
      setTopics([]);
      setNewTopicName("");
      setEditingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, courseId]);

  const handleCreate = async () => {
    if (!courseId || !newTopicName.trim()) return;
    setCreating(true);
    try {
      await topicService.createTopic({ courseId, name: newTopicName.trim() });
      setNewTopicName("");
      message.success("Đã tạo Topic");
      await loadTopics();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không tạo được Topic");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (topic: TopicRecord) => {
    setEditingId(topic.id);
    setEditingName(topic.name);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await topicService.updateTopic(editingId, { name: editingName.trim() });
      setEditingId(null);
      message.success("Đã cập nhật Topic");
      await loadTopics();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không cập nhật được Topic");
    }
  };

  const handlePublish = async (topic: TopicRecord) => {
    try {
      await topicService.publishTopic(topic.id);
      message.success("Đã publish Topic");
      await loadTopics();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không publish được Topic");
    }
  };

  const handleArchive = async (topic: TopicRecord) => {
    try {
      await topicService.archiveTopic(topic.id);
      message.success("Đã archive Topic");
      await loadTopics();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không archive được Topic");
    }
  };

  const handleDelete = async (topic: TopicRecord) => {
    try {
      await topicService.deleteTopic(topic.id);
      message.success("Đã xóa Topic");
      await loadTopics();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message ||
          "Không xóa được Topic — có thể còn nội dung hoặc dữ liệu học sinh bên trong."
      );
    }
  };

  const moveTopic = async (index: number, direction: -1 | 1) => {
    if (!courseId) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= topics.length) return;

    const reordered = [...topics];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);
    setTopics(reordered); // Cập nhật lạc quan cho mượt, load lại từ server ngay sau đó.

    try {
      await topicService.reorderTopics(
        courseId,
        reordered.map((t) => t.id)
      );
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không cập nhật được thứ tự");
      await loadTopics(); // Hoàn tác về đúng thứ tự thật từ server nếu lỗi.
    }
  };

  return (
    <Modal
      title={`Quản lý Topic${courseName ? ` — ${courseName}` : ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
        <Input
          placeholder="Tên Topic mới, VD: Đạo hàm"
          value={newTopicName}
          onChange={(e) => setNewTopicName(e.target.value)}
          onPressEnter={handleCreate}
        />
        <Button type="primary" icon={<PlusOutlined />} loading={creating} onClick={handleCreate}>
          Thêm
        </Button>
      </Space.Compact>

      <List
        loading={loading}
        dataSource={topics}
        locale={{ emptyText: <Empty description="Chưa có Topic nào" /> }}
        renderItem={(topic, index) => (
          <List.Item
            actions={[
              <Button
                key="up"
                size="small"
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={() => moveTopic(index, -1)}
              />,
              <Button
                key="down"
                size="small"
                icon={<ArrowDownOutlined />}
                disabled={index === topics.length - 1}
                onClick={() => moveTopic(index, 1)}
              />,
              <Button
                key="edit"
                size="small"
                icon={<EditOutlined />}
                onClick={() => startEdit(topic)}
              />,
              <Button
                key="skills"
                size="small"
                icon={<TagsOutlined />}
                onClick={() => setSkillTopic(topic)}
              >
                Skill
              </Button>,
              topic.status === "DRAFT" && (
                <Button key="publish" size="small" onClick={() => handlePublish(topic)}>
                  Publish
                </Button>
              ),
              topic.status !== "ARCHIVED" && (
                <Button
                  key="archive"
                  size="small"
                  icon={<InboxOutlined />}
                  onClick={() => handleArchive(topic)}
                >
                  Archive
                </Button>
              ),
              <Popconfirm
                key="delete"
                title="Xóa Topic này?"
                description="Chỉ xóa được nếu Topic không còn nội dung và chưa phát sinh dữ liệu học sinh."
                onConfirm={() => handleDelete(topic)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>,
            ].filter(Boolean)}
          >
            {editingId === topic.id ? (
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onPressEnter={saveEdit}
                  autoFocus
                />
                <Button icon={<CheckOutlined />} onClick={saveEdit} />
                <Button icon={<CloseOutlined />} onClick={() => setEditingId(null)} />
              </Space.Compact>
            ) : (
              <List.Item.Meta
                title={
                  <Space>
                    <Typography.Text strong>{topic.name}</Typography.Text>
                    <Tag color={statusColor[topic.status]}>{topic.status}</Tag>
                  </Space>
                }
                description={topic.description || undefined}
              />
            )}
          </List.Item>
        )}
      />

      <SkillManagerModal
        open={!!skillTopic}
        topicId={skillTopic?.id || null}
        topicName={skillTopic?.name}
        onClose={() => setSkillTopic(null)}
      />
    </Modal>
  );
};

export default TopicManagerModal;
