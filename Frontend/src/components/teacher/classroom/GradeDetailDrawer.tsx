import React, { useState, useEffect } from "react";
import { Drawer, Form, InputNumber, Input, Button, Typography, Space, Card, Tag, Avatar, Divider, Alert, Row, Col } from "antd";
import { UserOutlined, EditOutlined, CheckCircleOutlined, TrophyOutlined } from "@ant-design/icons";
import gradeApi from "../../../api/gradeApi";
import type { IGrade } from "../../../api/gradeApi";
import { toast } from "../../../utils/toast";

const { Text, Title } = Typography;

interface GradeDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  student: any | null;
  classId: string;
  existingGrades: IGrade[];
  onSaved?: () => void;
}

export const GradeDetailDrawer: React.FC<GradeDetailDrawerProps> = React.memo(
  ({ open, onClose, student, classId, existingGrades, onSaved }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const sObj = typeof student?.studentId === "object" && student?.studentId !== null ? student.studentId : student;
    const studentName = sObj?.fullName || student?.fullName || "Học sinh";
    const studentEmail = sObj?.email || student?.email || "";
    const studentAvatar = sObj?.avatar || student?.avatar;
    const studentIdStr = (sObj?._id || student?._id || "").toString();
    const studentCode = studentIdStr ? `STU-${studentIdStr.slice(-6).toUpperCase()}` : "STU-N/A";

    const categories = [
      { key: "Attendance", label: "Chuyên cần / Điểm danh", weightPercent: 10 },
      { key: "Assignment", label: "Bài tập", weightPercent: 20 },
      { key: "Midterm", label: "Thi giữa kỳ", weightPercent: 30 },
      { key: "Final", label: "Thi cuối kỳ", weightPercent: 40 },
    ];

    useEffect(() => {
      if (open && student) {
        const studentGrades = existingGrades.filter(
          (g) => (typeof g.studentId === "object" ? g.studentId?._id : g.studentId)?.toString() === studentIdStr
        );

        const initialValues: Record<string, any> = {};
        categories.forEach((cat) => {
          const match = studentGrades.find((g) => g.category === cat.key);
          if (match) {
            initialValues[`score_${cat.key}`] = match.score;
            initialValues[`feedback_${cat.key}`] = match.feedback || "";
          } else {
            initialValues[`score_${cat.key}`] = undefined;
            initialValues[`feedback_${cat.key}`] = "";
          }
        });

        form.setFieldsValue(initialValues);
      }
    }, [open, student, existingGrades, studentIdStr, form]);

    const handleSubmit = async (values: any) => {
      if (!studentIdStr || !classId) return;
      setSubmitting(true);

      try {
        const promises = categories.map(async (cat) => {
          const scoreVal = values[`score_${cat.key}`];
          if (scoreVal !== undefined && scoreVal !== null && scoreVal !== "") {
            await gradeApi.upsertGrade({
              studentId: studentIdStr,
              classId,
              category: cat.key,
              score: Number(scoreVal),
              weight: cat.weightPercent / 100,
              feedback: values[`feedback_${cat.key}`]?.trim() || "",
            });
          }
        });

        await Promise.all(promises);
        toast.success(`Cập nhật bảng điểm cho ${studentName} thành công!`);
        onClose();
        if (onSaved) onSaved();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi lưu bảng điểm!");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Drawer
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "#1890ff" }} />
            <span>Chi tiết & Chấm điểm: {studentName}</span>
          </Space>
        }
        placement="right"
        width={600}
        onClose={onClose}
        open={open}
        styles={{ body: { padding: 24 } }}
      >
        {student && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Student Info Card */}
            <Card size="small" style={{ backgroundColor: "#f8f9fa", borderRadius: 8 }} styles={{ body: { padding: 12 } }}>
              <Space size={12}>
                <Avatar
                  src={student?.avatar || undefined}
                  icon={!student?.avatar ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <div>
                  <Text strong style={{ fontSize: 15, display: "block" }}>
                    {studentName}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, fontFamily: "monospace" }}>
                    {studentCode} {studentEmail ? `| ${studentEmail}` : ""}
                  </Text>
                </div>
              </Space>
            </Card>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Title level={5} style={{ fontSize: 14, marginBottom: 12 }}>
                📝 Nhập & Chỉnh sửa điểm số môn học
              </Title>

              {categories.map((cat) => (
                <Card
                  key={cat.key}
                  size="small"
                  style={{ marginBottom: 14, borderRadius: 8, border: "1px solid #e8e8e8" }}
                  title={
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong style={{ fontSize: 13 }}>{cat.label}</Text>
                      <Tag color="blue">Tỷ trọng: {cat.weightPercent}%</Tag>
                    </div>
                  }
                >
                  <Row gutter={12}>
                    <Col span={10}>
                      <Form.Item
                        name={`score_${cat.key}`}
                        label="Điểm số (0-10)"
                        rules={[
                          { type: "number", min: 0, max: 10, message: "Điểm số từ 0 đến 10" },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber
                          min={0}
                          max={10}
                          step={0.25}
                          placeholder="Nhập điểm (VD: 8.5)"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={14}>
                      <Form.Item
                        name={`feedback_${cat.key}`}
                        label="Nhận xét / Feedback"
                        style={{ marginBottom: 0 }}
                      >
                        <Input placeholder="Ghi chú / Nhận xét..." />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>
              ))}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <Button onClick={onClose}>Hủy</Button>
                <Button type="primary" htmlType="submit" loading={submitting} icon={<CheckCircleOutlined />}>
                  Lưu bảng điểm
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Drawer>
    );
  }
);

GradeDetailDrawer.displayName = "GradeDetailDrawer";
