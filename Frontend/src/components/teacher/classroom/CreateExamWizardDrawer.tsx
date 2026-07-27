import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Drawer,
  Steps,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Switch,
  Button,
  Card,
  Row,
  Col,
  Table,
  Tag,
  Space,
  Typography,
  Divider,
  Statistic,
  Badge,
  Alert,
  Spin,
  Empty,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileDoneOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SearchOutlined,
  FilterOutlined,
  QuestionCircleOutlined,
  RocketOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import examApi from "../../../api/examApi";
import type { IExam } from "../../../api/examApi";
import { toast } from "../../../utils/toast";

const { Title, Text, Paragraph } = Typography;

interface CreateExamWizardDrawerProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  className?: string;
  onSaved?: () => void;
}

export const CreateExamWizardDrawer: React.FC<CreateExamWizardDrawerProps> = React.memo(
  ({ open, onClose, classId, className = "Lớp học", onSaved }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formStep1] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    // Step 2 Question Selector States
    const [questionsBank, setQuestionsBank] = useState<any[]>([]);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [searchQ, setSearchQ] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [filterDifficulty, setFilterDifficulty] = useState("all");

    // Selected questions with points mapping: Array of { questionId, points, details }
    const [selectedQuestionsMap, setSelectedQuestionsMap] = useState<Record<string, { points: number; details: any }>>({});

    // Fetch Question Bank
    const fetchQuestionBank = useCallback(async () => {
      setLoadingQuestions(true);
      try {
        const res = await examApi.getQuestions();
        setQuestionsBank(res.data || []);
      } catch (err) {
        console.warn("Lỗi nạp ngân hàng câu hỏi:", err);
        setQuestionsBank([]);
      } finally {
        setLoadingQuestions(false);
      }
    }, []);

    useEffect(() => {
      if (open) {
        setCurrentStep(0);
        formStep1.resetFields();
        formStep1.setFieldsValue({
          title: "",
          topic: "",
          duration: 45,
          maxScore: 10,
          examType: "Quiz",
          startTime: dayjs().add(1, "hour"),
          showAnswers: true,
          shuffleQuestions: true,
          shuffleOptions: true,
          showScoreImmediately: true,
        });
        setSelectedQuestionsMap({});
        fetchQuestionBank();
      }
    }, [open, classId, fetchQuestionBank, formStep1]);

    // Calculate Step 2 total points & count
    const selectedQuestionsList = useMemo(() => {
      return Object.entries(selectedQuestionsMap).map(([qId, val]) => ({
        questionId: qId,
        points: val.points,
        details: val.details,
      }));
    }, [selectedQuestionsMap]);

    const totalSelectedPoints = useMemo(() => {
      return selectedQuestionsList.reduce((sum, item) => sum + (item.points || 0), 0);
    }, [selectedQuestionsList]);

    // Filter questions in step 2
    const filteredQuestions = useMemo(() => {
      let result = [...questionsBank];

      if (searchQ.trim()) {
        const q = searchQ.toLowerCase().trim();
        result = result.filter(
          (item) => (item.content || "").toLowerCase().includes(q) || (item.topic || "").toLowerCase().includes(q)
        );
      }

      if (filterType !== "all") {
        result = result.filter((item) => item.type === filterType);
      }

      if (filterDifficulty !== "all") {
        result = result.filter((item) => item.difficulty === filterDifficulty);
      }

      return result;
    }, [questionsBank, searchQ, filterType, filterDifficulty]);

    // Step Navigation
    const handleNextStep1 = async () => {
      try {
        await formStep1.validateFields();
        setCurrentStep(1);
      } catch (err) {
        // Validation failed
      }
    };

    const handleNextStep2 = () => {
      if (selectedQuestionsList.length === 0) {
        toast.warning("Vui lòng chọn ít nhất 1 câu hỏi cho bài kiểm tra!");
        return;
      }
      setCurrentStep(2);
    };

    // Auto distribute points to equal 10.0 total
    const handleAutoDistributePoints = () => {
      if (selectedQuestionsList.length === 0) return;
      const count = selectedQuestionsList.length;
      const pointPerQ = parseFloat((10 / count).toFixed(2));

      const newMap: Record<string, { points: number; details: any }> = {};
      selectedQuestionsList.forEach((item, idx) => {
        // adjust last item for exact 10.0 sum
        const pts = idx === count - 1 ? parseFloat((10 - pointPerQ * (count - 1)).toFixed(2)) : pointPerQ;
        newMap[item.questionId] = { points: pts, details: item.details };
      });

      setSelectedQuestionsMap(newMap);
      toast.success(`Đã tự động chia đều tổng điểm 10.0 cho ${count} câu hỏi!`);
    };

    // Final Submit (Publish or Save Draft)
    const handleFinalSubmit = async (status: "PUBLISHED" | "DRAFT") => {
      setSubmitting(true);

      try {
        const step1Values = await formStep1.validateFields();
        const payload = {
          title: step1Values.title.trim(),
          duration: Number(step1Values.duration),
          startTime: step1Values.startTime ? step1Values.startTime.toISOString() : new Date().toISOString(),
          classId,
          maxScore: Number(step1Values.maxScore || 10),
          status,
          isAIGenerated: false,
          questions: selectedQuestionsList.map((item) => ({
            questionId: item.questionId,
            points: item.points,
          })),
        };

        await examApi.createExam(payload);
        toast.success(status === "PUBLISHED" ? "Xuất bản bài kiểm tra thành công!" : "Lưu bản nháp bài kiểm tra thành công!");
        onClose();
        if (onSaved) onSaved();
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || "Lỗi khi tạo bài kiểm tra!");
      } finally {
        setSubmitting(false);
      }
    };

    // Table Columns for Step 2 Question Selector
    const questionColumns: ColumnsType<any> = [
      {
        title: "Câu hỏi",
        key: "content",
        render: (_, record) => (
          <div>
            <Text strong style={{ fontSize: 14 }}>{record.content}</Text>
            {record.topic && (
              <Paragraph type="secondary" style={{ margin: "2px 0 0", fontSize: 12 }}>
                Chủ đề: {record.topic}
              </Paragraph>
            )}
          </div>
        ),
      },
      {
        title: "Loại & Độ khó",
        key: "type",
        width: 180,
        render: (_, record) => (
          <Space size={6} wrap>
            <Tag color={record.type === "MCQ" ? "blue" : "purple"}>
              {record.type === "MCQ" ? "Trắc nghiệm" : "Tự luận"}
            </Tag>
            <Tag color={record.difficulty === "EASY" ? "green" : record.difficulty === "HARD" ? "red" : "orange"}>
              {record.difficulty === "EASY" ? "Dễ" : record.difficulty === "HARD" ? "Khó" : "Vừa"}
            </Tag>
          </Space>
        ),
      },
      {
        title: "Điểm số",
        key: "points",
        width: 140,
        render: (_, record) => {
          const isSelected = !!selectedQuestionsMap[record._id];
          return (
            <InputNumber
              min={0.1}
              max={10}
              step={0.25}
              disabled={!isSelected}
              value={selectedQuestionsMap[record._id]?.points || 1}
              onChange={(val) => {
                if (!isSelected) return;
                setSelectedQuestionsMap((prev) => ({
                  ...prev,
                  [record._id]: { points: Number(val || 1), details: record },
                }));
              }}
              style={{ width: 90 }}
            />
          );
        },
      },
    ];

    return (
      <Drawer
        title={
          <Space align="center">
            <FileDoneOutlined style={{ color: "#1890ff" }} />
            <span>Tạo bài kiểm tra mới - Lớp: {className}</span>
          </Space>
        }
        placement="right"
        width={920}
        onClose={onClose}
        open={open}
        destroyOnClose
        styles={{ body: { padding: "24px 32px" } }}
      >
        {/* Wizard Steps Navigation */}
        <Steps
          current={currentStep}
          items={[
            { title: "Thông tin chung", description: "Cấu hình bài thi" },
            { title: "Chọn câu hỏi", description: "Ngân hàng câu hỏi" },
            { title: "Xem trước & Xuất bản", description: "Xác nhận tạo bài thi" },
          ]}
          style={{ marginBottom: 28 }}
        />

        {/* STEP 1: BASIC INFO & SETTINGS */}
        {currentStep === 0 && (
          <Form form={formStep1} layout="vertical">
            <Card title="📝 Thông tin cơ bản bài kiểm tra" style={{ marginBottom: 20, borderRadius: 12 }}>
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="title"
                    label="Tên bài kiểm tra *"
                    rules={[{ required: true, message: "Vui lòng nhập tên bài kiểm tra!" }]}
                  >
                    <Input placeholder="Ví dụ: Bài kiểm tra Giữa kỳ môn Lập trình Web" maxLength={150} />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item label="Lớp học phụ trách">
                    <Input value={className} disabled style={{ color: "#1890ff", fontWeight: 700 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="examType" label="Loại bài kiểm tra">
                    <Select
                      options={[
                        { value: "Quiz", label: "Bài Quiz ngắn" },
                        { value: "15min", label: "Kiểm tra 15 phút" },
                        { value: "45min", label: "Kiểm tra 1 tiết" },
                        { value: "Midterm", label: "Thi Giữa kỳ" },
                        { value: "Final", label: "Thi Cuối kỳ" },
                        { value: "Practice", label: "Bài luyện tập" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="duration"
                    label="Thời lượng làm bài (Phút) *"
                    rules={[
                      { required: true, message: "Vui lòng nhập thời lượng!" },
                      { type: "number", min: 1, message: "Thời lượng phải lớn hơn 0 phút!" },
                    ]}
                  >
                    <InputNumber min={1} max={300} style={{ width: "100%" }} placeholder="Ví dụ: 45 phút" />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="maxScore" label="Điểm tối đa thang điểm">
                    <InputNumber min={1} max={100} style={{ width: "100%" }} disabled value={10} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="startTime"
                label="Thời gian bắt đầu mở đề *"
                rules={[{ required: true, message: "Vui lòng chọn thời gian bắt đầu!" }]}
              >
                <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: "100%" }} />
              </Form.Item>
            </Card>

            <Card title="⚙️ Cài đặt & Quy định phòng thi" style={{ marginBottom: 24, borderRadius: 12 }}>
              <Row gutter={[24, 16]}>
                <Col span={12}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong>Cho phép học sinh xem đáp án đúng</Text>
                    <Form.Item name="showAnswers" valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong>Tự động đảo thứ tự câu hỏi</Text>
                    <Form.Item name="shuffleQuestions" valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong>Tự động đảo thứ tự đáp án</Text>
                    <Form.Item name="shuffleOptions" valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>

                <Col span={12}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong>Hiển thị điểm số ngay sau khi nộp</Text>
                    <Form.Item name="showScoreImmediately" valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                </Col>
              </Row>
            </Card>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <Button onClick={onClose}>Hủy</Button>
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNextStep1}>
                Tiếp tục: Chọn câu hỏi
              </Button>
            </div>
          </Form>
        )}

        {/* STEP 2: QUESTION SELECTOR */}
        {currentStep === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <Space size={12}>
                    <Text strong style={{ fontSize: 15 }}>
                      📚 Ngân hàng câu hỏi hệ thống ({questionsBank.length} câu)
                    </Text>
                    <Badge count={`${selectedQuestionsList.length} câu chọn`} style={{ backgroundColor: "#52c41a" }} />
                  </Space>

                  <Space size={8}>
                    <Button type="default" size="small" onClick={handleAutoDistributePoints}>
                      ⚖️ Tự động chia đều 10.0 điểm
                    </Button>
                  </Space>
                </div>
              }
              style={{ borderRadius: 12 }}
            >
              {/* Toolbar Search & Filter */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <Input
                  placeholder="Tìm từ khóa câu hỏi..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  style={{ width: 260, borderRadius: 8 }}
                  allowClear
                />

                <Select
                  value={filterType}
                  onChange={(val) => setFilterType(val)}
                  style={{ width: 150 }}
                  options={[
                    { value: "all", label: "Tất cả loại" },
                    { value: "MCQ", label: "Trắc nghiệm" },
                    { value: "ESSAY", label: "Tự luận" },
                  ]}
                />

                <Select
                  value={filterDifficulty}
                  onChange={(val) => setFilterDifficulty(val)}
                  style={{ width: 140 }}
                  options={[
                    { value: "all", label: "Tất cả độ khó" },
                    { value: "EASY", label: "Dễ" },
                    { value: "MEDIUM", label: "Vừa" },
                    { value: "HARD", label: "Khó" },
                  ]}
                />
              </div>

              {/* Total points alert */}
              <Alert
                message={
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>
                      Số câu đã chọn: <b>{selectedQuestionsList.length}</b> câu | Tổng điểm hiện tại:{" "}
                      <b style={{ color: parseFloat(totalSelectedPoints.toFixed(2)) === 10 ? "#52c41a" : "#ff4d4f", fontSize: 16 }}>
                        {parseFloat(totalSelectedPoints.toFixed(2))} / 10.0 điểm
                      </b>
                    </span>
                    {parseFloat(totalSelectedPoints.toFixed(2)) !== 10 && (
                      <Text type="danger" style={{ fontSize: 12 }}>
                        ⚠️ Tổng điểm đề thi phải bằng đúng 10.0 điểm trước khi bấm xuất bản.
                      </Text>
                    )}
                  </div>
                }
                type={parseFloat(totalSelectedPoints.toFixed(2)) === 10 ? "success" : "warning"}
                showIcon
                style={{ marginBottom: 16 }}
              />

              {loadingQuestions ? (
                <div style={{ padding: 40, textAlign: "center" }}>
                  <Spin tip="Đang nạp bộ câu hỏi từ Ngân hàng đề thi..." />
                </div>
              ) : filteredQuestions.length > 0 ? (
                <Table
                  columns={questionColumns}
                  dataSource={filteredQuestions}
                  rowKey="_id"
                  rowSelection={{
                    selectedRowKeys: Object.keys(selectedQuestionsMap),
                    onChange: (selectedRowKeys, selectedRows) => {
                      const newMap: Record<string, { points: number; details: any }> = {};
                      selectedRows.forEach((row) => {
                        const existing = selectedQuestionsMap[row._id];
                        newMap[row._id] = existing || { points: 1, details: row };
                      });
                      setSelectedQuestionsMap(newMap);
                    },
                  }}
                  pagination={{ pageSize: 5 }}
                />
              ) : (
                <Empty description="Không có câu hỏi nào phù hợp với bộ lọc." />
              )}
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(0)}>
                Quay lại Bước 1
              </Button>
              <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleNextStep2}>
                Tiếp tục: Xem trước & Xuất bản
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & PUBLISH */}
        {currentStep === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="📋 Summary: Kiểm tra thông tin đề thi trước khi xuất bản" style={{ borderRadius: 12 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Tên bài kiểm tra</Text>
                  <Text strong style={{ fontSize: 16, color: "#1890ff" }}>
                    {formStep1.getFieldValue("title")}
                  </Text>
                </Col>

                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Lớp áp dụng</Text>
                  <Text strong style={{ fontSize: 14 }}>{className}</Text>
                </Col>

                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Thời lượng làm bài</Text>
                  <Text strong style={{ fontSize: 14 }}>{formStep1.getFieldValue("duration")} phút</Text>
                </Col>

                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Thời gian mở đề</Text>
                  <Text strong style={{ fontSize: 14 }}>
                    {formStep1.getFieldValue("startTime")
                      ? dayjs(formStep1.getFieldValue("startTime")).format("DD/MM/YYYY HH:mm")
                      : "Ngay lập tức"}
                  </Text>
                </Col>

                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Tổng số câu hỏi</Text>
                  <Text strong style={{ fontSize: 16, color: "#722ed1" }}>
                    {selectedQuestionsList.length} câu
                  </Text>
                </Col>

                <Col span={6}>
                  <Text type="secondary" style={{ fontSize: 12, display: "block" }}>Tổng điểm cộng dồn</Text>
                  <Text strong style={{ fontSize: 16, color: parseFloat(totalSelectedPoints.toFixed(2)) === 10 ? "#52c41a" : "#ff4d4f" }}>
                    {parseFloat(totalSelectedPoints.toFixed(2))} / 10.0 điểm
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* Selected Questions Preview List */}
            <Card title="📑 Danh sách câu hỏi trong đề thi" style={{ borderRadius: 12 }}>
              {selectedQuestionsList.map((item, idx) => (
                <div key={item.questionId} style={{ padding: "10px 0", borderBottom: idx < selectedQuestionsList.length - 1 ? "1px dashed #f0f0f0" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text strong style={{ fontSize: 14 }}>
                      Câu {idx + 1}: {item.details?.content || "Nội dung câu hỏi"}
                    </Text>
                    <Tag color="blue">{item.points} điểm</Tag>
                  </div>
                </div>
              ))}
            </Card>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => setCurrentStep(1)}>
                Quay lại Bước 2
              </Button>

              <Space size={12}>
                <Button
                  type="default"
                  icon={<SaveOutlined />}
                  loading={submitting}
                  onClick={() => handleFinalSubmit("DRAFT")}
                >
                  Lưu bản nháp
                </Button>

                <Button
                  type="primary"
                  icon={<RocketOutlined />}
                  loading={submitting}
                  onClick={() => handleFinalSubmit("PUBLISHED")}
                >
                  Xuất bản ngay
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    );
  }
);

CreateExamWizardDrawer.displayName = "CreateExamWizardDrawer";
