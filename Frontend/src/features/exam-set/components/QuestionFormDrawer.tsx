import React, { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Drawer,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Radio,
  Checkbox,
  InputNumber,
} from "antd";
import {
  DatabaseOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import axiosClient from "../../../api/axiosClient";
import { toast } from "../../../utils/toast";
import { courseService } from "../../course/courseService";
import { topicService } from "../../topic/topicService";
import { skillService } from "../../skill/skillService";
import type { CourseRecord } from "../../course/course.types";
import type { TopicRecord } from "../../topic/topic.types";
import type { SkillRecord } from "../../skill/skill.types";
import type {
  Question,
  QuestionType,
  SelectionMode,
  Difficulty,
} from "../../question/question.types";
import { extractPlainText, wrapPlainText } from "../../question/contentText";

const { Text, Paragraph } = Typography;

interface QuestionFormDrawerProps {
  open: boolean;
  onClose: () => void;
  initialData?: (Partial<Question> & { _id?: string }) | null;
  onSaved?: () => void;
}

interface OptionRow {
  key: string;
  text: string;
  isCorrect: boolean;
}

const emptyOption = (): OptionRow => ({ key: uuidv4(), text: "", isCorrect: false });

// Câu hỏi Đúng/Sai có đúng 2 lựa chọn cố định, đúng nghĩa business (không cho thêm/bớt).
const trueFalseOptions = (correctIndex: 0 | 1): OptionRow[] => [
  { key: "true", text: "Đúng", isCorrect: correctIndex === 0 },
  { key: "false", text: "Sai", isCorrect: correctIndex === 1 },
];

const getQuestionTopicId = (q: Partial<Question> | null | undefined): string => {
  if (!q?.topicId) return "";
  return typeof q.topicId === "string" ? q.topicId : (q.topicId as any)._id;
};

const getQuestionCourseId = (q: Partial<Question> | null | undefined): string | undefined => {
  if (!q?.topicId || typeof q.topicId === "string") return undefined;
  return (q.topicId as any).courseId;
};

// TÍNH NĂNG MỚI: bản dựng lại hoàn toàn — bản cũ gửi {topic: string tự do, content: string
// phẳng, options: string[], correctAnswer: string} lên POST/PUT /questions, trong khi backend
// (createQuestionValidation/updateQuestionValidation) yêu cầu {topicId: ObjectId,
// content: ContentBlock[], options: {id,content,isCorrect,order}[]} — sai cấu trúc hoàn toàn nên
// MỌI lần lưu qua form này trước đây đều bị backend từ chối 400. Form rút gọn: chỉ nhập văn bản
// thuần (không có trình soạn công thức/ảnh như Practice Quiz ở mục 1) nhưng gói đúng thành
// ContentBlock[] hợp lệ — xem contentText.ts.
export const QuestionFormDrawer: React.FC<QuestionFormDrawerProps> = React.memo(
  ({ open, onClose, initialData, onSaved }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const [courses, setCourses] = useState<CourseRecord[]>([]);
    const [topics, setTopics] = useState<TopicRecord[]>([]);
    const [skills, setSkills] = useState<SkillRecord[]>([]);
    const [loadingTopics, setLoadingTopics] = useState(false);
    const [loadingSkills, setLoadingSkills] = useState(false);

    const [courseId, setCourseId] = useState<string | undefined>(undefined);
    const [topicId, setTopicId] = useState<string | undefined>(undefined);
    const [type, setType] = useState<QuestionType>("MCQ");
    const [selectionMode, setSelectionMode] = useState<SelectionMode>("SINGLE");
    const [options, setOptions] = useState<OptionRow[]>([emptyOption(), emptyOption()]);

    const isEditing = !!initialData?._id;
    const isChoiceType = type === "MCQ" || type === "TRUE_FALSE";

    // Danh sách khóa học — nạp 1 lần khi Drawer mở.
    useEffect(() => {
      if (!open) return;
      courseService
        .getCourses({ search: "", subjectId: "All", status: "All", limit: 200 })
        .then((res) => setCourses(res.data))
        .catch(() => toast.error("Không tải được danh sách khóa học"));
    }, [open]);

    // Khởi tạo toàn bộ form khi Drawer mở — tách khỏi effect nạp Course để tránh phụ thuộc vòng.
    useEffect(() => {
      if (!open) return;

      if (initialData) {
        const initTopicId = getQuestionTopicId(initialData);
        const initCourseId = getQuestionCourseId(initialData);
        const initType = (initialData.type as QuestionType) || "MCQ";

        setCourseId(initCourseId);
        setTopicId(initTopicId);
        setType(initType);
        setSelectionMode((initialData.selectionMode as SelectionMode) || "SINGLE");

        if (initType === "TRUE_FALSE") {
          const correctIdx = (initialData.options || []).findIndex((o) => o.isCorrect);
          setOptions(trueFalseOptions(correctIdx === 1 ? 1 : 0));
        } else if (initType === "MCQ") {
          const rows = (initialData.options || []).map((o) => ({
            key: o.id || uuidv4(),
            text: extractPlainText(o.content),
            isCorrect: o.isCorrect,
          }));
          setOptions(rows.length >= 2 ? rows : [emptyOption(), emptyOption()]);
        } else {
          setOptions([emptyOption(), emptyOption()]);
        }

        form.setFieldsValue({
          topicId: initTopicId,
          primarySkillId:
            typeof initialData.primarySkillId === "string"
              ? initialData.primarySkillId
              : (initialData.primarySkillId as any)?._id,
          difficulty: initialData.difficulty || "MEDIUM",
          points: initialData.points ?? 1,
          content: extractPlainText(initialData.content),
          explanation: extractPlainText(initialData.explanation),
        });
      } else {
        setCourseId(undefined);
        setTopicId(undefined);
        setType("MCQ");
        setSelectionMode("SINGLE");
        setOptions([emptyOption(), emptyOption()]);
        form.resetFields();
        form.setFieldsValue({ difficulty: "MEDIUM", points: 1 });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, initialData]);

    // Danh sách Topic phụ thuộc Course đã chọn.
    useEffect(() => {
      if (!courseId) {
        setTopics([]);
        return;
      }
      setLoadingTopics(true);
      topicService
        .getTopicsByCourse(courseId)
        .then((res) => setTopics(res.data))
        .catch(() => toast.error("Không tải được danh sách Topic"))
        .finally(() => setLoadingTopics(false));
    }, [courseId]);

    // Danh sách Skill phụ thuộc Topic đã chọn — tùy chọn, chưa hiển thị cho học sinh (mục 6).
    useEffect(() => {
      if (!topicId) {
        setSkills([]);
        return;
      }
      setLoadingSkills(true);
      skillService
        .getSkillsByTopic(topicId)
        .then(setSkills)
        .catch(() => toast.error("Không tải được danh sách Skill"))
        .finally(() => setLoadingSkills(false));
    }, [topicId]);

    const handleTypeChange = (val: QuestionType) => {
      setType(val);
      if (val === "TRUE_FALSE") {
        setOptions(trueFalseOptions(0));
      } else if (val === "MCQ" && !isChoiceType) {
        setOptions([emptyOption(), emptyOption()]);
      }
    };

    const toggleCorrect = (key: string) => {
      if (selectionMode === "SINGLE") {
        setOptions(options.map((o) => ({ ...o, isCorrect: o.key === key })));
      } else {
        setOptions(options.map((o) => (o.key === key ? { ...o, isCorrect: !o.isCorrect } : o)));
      }
    };

    const addOption = () => setOptions([...options, emptyOption()]);
    const removeOption = (key: string) => {
      if (options.length <= 2) return;
      setOptions(options.filter((o) => o.key !== key));
    };

    const handleSubmit = async (values: any) => {
      if (isChoiceType) {
        const filled = options.filter((o) => o.text.trim());
        if (filled.length < 2) {
          toast.warning("Vui lòng nhập ít nhất 2 phương án lựa chọn!");
          return;
        }
        if (!options.some((o) => o.isCorrect)) {
          toast.warning("Vui lòng chọn ít nhất 1 đáp án đúng!");
          return;
        }
      }

      setSubmitting(true);
      try {
        const payload: Record<string, unknown> = {
          topicId: values.topicId,
          primarySkillId: values.primarySkillId || undefined,
          type,
          selectionMode: type === "MCQ" ? selectionMode : undefined,
          difficulty: values.difficulty,
          points: values.points,
          content: wrapPlainText(values.content),
          explanation: wrapPlainText(values.explanation || ""),
        };

        if (isChoiceType) {
          payload.options = options.map((o, idx) => ({
            id: o.key,
            content: wrapPlainText(o.text),
            isCorrect: o.isCorrect,
            order: idx,
          }));
        } else {
          payload.options = [];
        }

        if (isEditing && initialData?._id) {
          await axiosClient.put(`/questions/${initialData._id}`, payload);
          toast.success("Cập nhật câu hỏi thành công!");
        } else {
          await axiosClient.post("/questions", payload);
          toast.success("Thêm câu hỏi mới vào Ngân hàng thành công!");
        }

        onClose();
        if (onSaved) onSaved();
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || "Lỗi khi lưu câu hỏi!");
      } finally {
        setSubmitting(false);
      }
    };

    const courseOptions = useMemo(
      () => courses.map((c) => ({ value: c.id, label: c.name })),
      [courses]
    );
    const topicOptions = useMemo(
      () => topics.map((t) => ({ value: t.id, label: t.name })),
      [topics]
    );
    const skillOptions = useMemo(
      () => skills.map((s) => ({ value: s.id, label: s.name })),
      [skills]
    );

    return (
      <Drawer
        title={
          <Space align="center">
            <DatabaseOutlined style={{ color: "var(--color-action-primary-bg)" }} />
            <span>{isEditing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới vào Ngân hàng đề"}</span>
          </Space>
        }
        placement="right"
        width={680}
        onClose={onClose}
        open={open}
        destroyOnClose
        styles={{ body: { padding: 24 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Khóa học *" required>
                  <Select
                    placeholder="Chọn khóa học"
                    value={courseId}
                    options={courseOptions}
                    onChange={(val) => {
                      setCourseId(val);
                      setTopicId(undefined);
                      form.setFieldsValue({ topicId: undefined, primarySkillId: undefined });
                    }}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item
                  name="topicId"
                  label="Chủ đề (Topic) *"
                  rules={[{ required: true, message: "Vui lòng chọn Topic!" }]}
                >
                  <Select
                    placeholder={courseId ? "Chọn Topic" : "Chọn khóa học trước"}
                    disabled={!courseId}
                    loading={loadingTopics}
                    options={topicOptions}
                    onChange={(val) => setTopicId(val)}
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item name="primarySkillId" label="Skill (tùy chọn)">
                  <Select
                    placeholder={topicId ? "Chọn Skill" : "Chọn Topic trước"}
                    disabled={!topicId}
                    loading={loadingSkills}
                    options={skillOptions}
                    allowClear
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item name="difficulty" label="Độ khó">
                  <Select
                    options={
                      [
                        { value: "EASY", label: "🟢 Dễ" },
                        { value: "MEDIUM", label: "🟡 Vừa" },
                        { value: "HARD", label: "🔴 Khó" },
                      ] as { value: Difficulty; label: string }[]
                    }
                  />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item name="points" label="Điểm" rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.5} style={{ width: "100%" }} />
                </Form.Item>
              </Col>

              <Col span={12}>
                <Form.Item label="Loại câu hỏi">
                  <Select
                    value={type}
                    onChange={handleTypeChange}
                    options={[
                      { value: "MCQ", label: "🔵 Trắc nghiệm" },
                      { value: "TRUE_FALSE", label: "⚪ Đúng / Sai" },
                      { value: "SHORT_ANSWER", label: "🟠 Điền khuyết" },
                      { value: "ESSAY", label: "🟣 Tự luận" },
                    ]}
                  />
                </Form.Item>
              </Col>

              {type === "MCQ" && (
                <Col span={12}>
                  <Form.Item label="Chế độ chọn">
                    <Select
                      value={selectionMode}
                      onChange={(val) => {
                        setSelectionMode(val);
                        // Chuyển sang SINGLE mà đang đánh dấu >1 đáp án đúng -> chỉ giữ đáp án
                        // đúng đầu tiên, tránh trạng thái không hợp lệ (validateOptions backend
                        // yêu cầu đúng 1 đáp án đúng khi SINGLE).
                        if (val === "SINGLE") {
                          const firstCorrect = options.findIndex((o) => o.isCorrect);
                          setOptions(
                            options.map((o, i) => ({ ...o, isCorrect: i === firstCorrect }))
                          );
                        }
                      }}
                      options={[
                        { value: "SINGLE", label: "Một đáp án đúng" },
                        { value: "MULTIPLE", label: "Nhiều đáp án đúng" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              )}
            </Row>
          </Card>

          <Form.Item
            name="content"
            label="Nội dung câu hỏi *"
            rules={[{ required: true, message: "Vui lòng nhập nội dung câu hỏi!" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập câu hỏi chi tiết..." />
          </Form.Item>

          {isChoiceType && (
            <Card
              title="📌 Các phương án & Đáp án đúng"
              size="small"
              style={{ marginBottom: 20, borderRadius: 8 }}
              extra={
                type === "MCQ" && (
                  <Button size="small" icon={<PlusOutlined />} onClick={addOption}>
                    Thêm phương án
                  </Button>
                )
              }
            >
              <Space direction="vertical" style={{ width: "100%" }}>
                {options.map((opt, idx) => (
                  <Space.Compact key={opt.key} style={{ width: "100%" }}>
                    {selectionMode === "SINGLE" ? (
                      <Radio
                        checked={opt.isCorrect}
                        onChange={() => toggleCorrect(opt.key)}
                        style={{ marginRight: 8 }}
                      />
                    ) : (
                      <Checkbox
                        checked={opt.isCorrect}
                        onChange={() => toggleCorrect(opt.key)}
                        style={{ marginRight: 8 }}
                      />
                    )}
                    <Input
                      value={opt.text}
                      disabled={type === "TRUE_FALSE"}
                      placeholder={`Phương án ${String.fromCharCode(65 + idx)}`}
                      onChange={(e) =>
                        setOptions(
                          options.map((o) =>
                            o.key === opt.key ? { ...o, text: e.target.value } : o
                          )
                        )
                      }
                      style={{ flex: 1 }}
                    />
                    {type === "MCQ" && options.length > 2 && (
                      <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => removeOption(opt.key)}
                      />
                    )}
                  </Space.Compact>
                ))}
              </Space>
              <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                Tick vào ô tròn/vuông đầu dòng để đánh dấu đáp án đúng.
              </Paragraph>
            </Card>
          )}

          <Form.Item name="explanation" label="Lời giải chi tiết (Tùy chọn)">
            <Input.TextArea rows={3} placeholder="Giải thích đáp án đúng..." />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<CheckCircleOutlined />}
            >
              {isEditing ? "Lưu thay đổi" : "Thêm câu hỏi"}
            </Button>
          </div>
        </Form>
      </Drawer>
    );
  }
);

QuestionFormDrawer.displayName = "QuestionFormDrawer";
