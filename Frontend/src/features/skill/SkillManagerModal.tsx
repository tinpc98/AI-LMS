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
  DeleteOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  InboxOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import { skillService } from "./skillService";
import type { SkillRecord } from "./skill.types";

interface SkillManagerModalProps {
  open: boolean;
  topicId: string | null;
  topicName?: string;
  onClose: () => void;
}

// TÍNH NĂNG MỚI (mục 6): quản lý nhãn Skill trong 1 Topic — chỉ là nhãn phân loại câu hỏi, KHÔNG
// có mastery-level (hoãn giai đoạn 2). Mirror đúng cấu trúc TopicManagerModal.tsx (list + tạo +
// sửa tên inline + archive/restore + xóa) để giáo viên dùng quen tay, không cần học lại UI mới.
const SkillManagerModal: React.FC<SkillManagerModalProps> = ({
  open,
  topicId,
  topicName,
  onClose,
}) => {
  const [skills, setSkills] = useState<SkillRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const loadSkills = async () => {
    if (!topicId) return;
    setLoading(true);
    try {
      const data = await skillService.getSkillsByTopic(topicId, true);
      setSkills(data);
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không tải được danh sách Skill");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && topicId) {
      loadSkills();
    } else {
      setSkills([]);
      setNewSkillName("");
      setEditingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, topicId]);

  const handleCreate = async () => {
    if (!topicId || !newSkillName.trim()) return;
    setCreating(true);
    try {
      await skillService.createSkill({ topicId, name: newSkillName.trim() });
      setNewSkillName("");
      message.success("Đã tạo Skill");
      await loadSkills();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không tạo được Skill");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (skill: SkillRecord) => {
    setEditingId(skill.id);
    setEditingName(skill.name);
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await skillService.updateSkill(editingId, { name: editingName.trim() });
      setEditingId(null);
      message.success("Đã cập nhật Skill");
      await loadSkills();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không cập nhật được Skill");
    }
  };

  const handleArchive = async (skill: SkillRecord) => {
    try {
      await skillService.archiveSkill(skill.id);
      message.success("Đã archive Skill");
      await loadSkills();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không archive được Skill");
    }
  };

  const handleRestore = async (skill: SkillRecord) => {
    try {
      await skillService.restoreSkill(skill.id);
      message.success("Đã khôi phục Skill");
      await loadSkills();
    } catch (err: any) {
      message.error(err?.response?.data?.message || "Không khôi phục được Skill");
    }
  };

  const handleDelete = async (skill: SkillRecord) => {
    try {
      await skillService.deleteSkill(skill.id);
      message.success("Đã xóa Skill");
      await loadSkills();
    } catch (err: any) {
      message.error(
        err?.response?.data?.message || "Không xóa được Skill — có thể đang được gắn cho câu hỏi."
      );
    }
  };

  return (
    <Modal
      title={`Quản lý Skill${topicName ? ` — ${topicName}` : ""}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      <Typography.Paragraph type="secondary" style={{ fontSize: 13 }}>
        Skill là nhãn phân loại câu hỏi theo kỹ năng (VD: "Đạo hàm", "Thì hiện tại hoàn thành") —
        dùng khi tạo/sửa câu hỏi trong Ngân hàng đề, chưa hiển thị cho học sinh.
      </Typography.Paragraph>

      <Space.Compact style={{ width: "100%", marginBottom: 16 }}>
        <Input
          placeholder="Tên Skill mới, VD: Đạo hàm"
          value={newSkillName}
          onChange={(e) => setNewSkillName(e.target.value)}
          onPressEnter={handleCreate}
        />
        <Button type="primary" icon={<PlusOutlined />} loading={creating} onClick={handleCreate}>
          Thêm
        </Button>
      </Space.Compact>

      <List
        loading={loading}
        dataSource={skills}
        locale={{ emptyText: <Empty description="Chưa có Skill nào" /> }}
        renderItem={(skill) => (
          <List.Item
            actions={[
              <Button
                key="edit"
                size="small"
                icon={<EditOutlined />}
                onClick={() => startEdit(skill)}
              />,
              skill.status === "ACTIVE" ? (
                <Button
                  key="archive"
                  size="small"
                  icon={<InboxOutlined />}
                  onClick={() => handleArchive(skill)}
                >
                  Archive
                </Button>
              ) : (
                <Button
                  key="restore"
                  size="small"
                  icon={<UndoOutlined />}
                  onClick={() => handleRestore(skill)}
                >
                  Khôi phục
                </Button>
              ),
              <Popconfirm
                key="delete"
                title="Xóa Skill này?"
                description="Chỉ xóa được nếu chưa có câu hỏi nào gắn Skill này."
                onConfirm={() => handleDelete(skill)}
                okText="Xóa"
                cancelText="Hủy"
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>,
            ]}
          >
            {editingId === skill.id ? (
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
                    <Typography.Text strong>{skill.name}</Typography.Text>
                    <Tag color={skill.status === "ACTIVE" ? "success" : "default"}>
                      {skill.status}
                    </Tag>
                  </Space>
                }
              />
            )}
          </List.Item>
        )}
      />
    </Modal>
  );
};

export default SkillManagerModal;
