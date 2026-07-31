import React, { useState, useEffect } from "react";
import {
  Drawer,
  Form,
  InputNumber,
  Input,
  Button,
  Typography,
  Space,
  Card,
  Tag,
  Avatar,
  Row,
  Col,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import gradeApi from "../../../../api/gradeApi";
import type { IGradeItemDef, IStudentGradeData } from "../../../../api/gradeApi";
import { toast } from "../../../../utils/toast";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";

const { Text, Title } = Typography;

interface GradeDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  student: any | null;
  classId: string;
  gradeItems: IGradeItemDef[];
  studentGradesData?: IStudentGradeData;
  onSaved?: () => void;
}

export const GradeDetailDrawer: React.FC<GradeDetailDrawerProps> = React.memo(
  ({ open, onClose, student, classId, gradeItems, studentGradesData, onSaved }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const sObj =
      typeof student?.studentId === "object" && student?.studentId !== null
        ? student.studentId
        : student;
    const studentName = sObj?.fullName || student?.fullName || "Học sinh";
    const studentEmail = sObj?.email || student?.email || "";
    const studentAvatar = sObj?.avatar || student?.avatar;
    const studentIdStr = (sObj?._id || student?._id || "").toString();
    const studentCode = studentIdStr ? `STU-${studentIdStr.slice(-6).toUpperCase()}` : "STU-N/A";

    useEffect(() => {
      if (open && student) {
        const initialValues: Record<string, any> = {};
        const sg = studentGradesData?.grades || {};

        gradeItems.forEach((item) => {
          const match = sg[item._id];
          if (match) {
            initialValues[`score_${item._id}`] = match.score;
            initialValues[`feedback_${item._id}`] = match.feedback || "";
          } else {
            initialValues[`score_${item._id}`] = undefined;
            initialValues[`feedback_${item._id}`] = "";
          }
        });

        form.setFieldsValue(initialValues);
      }
    }, [open, student, studentGradesData, gradeItems, form]);

    const handleSubmit = async (values: any) => {
      if (!studentIdStr || !classId) return;
      setSubmitting(true);

      try {
        const promises = gradeItems
          .filter((item) => item.type === "Manual") // Only save manual items
          .map(async (item) => {
            const scoreVal = values[`score_${item._id}`];
            if (scoreVal !== undefined && scoreVal !== null && scoreVal !== "") {
              await gradeApi.upsertGrade({
                studentId: studentIdStr,
                classId,
                category: item.category,
                score: Number(scoreVal),
                weight: item.weight,
                feedback: values[`feedback_${item._id}`]?.trim() || "",
              });
            }
          });

        await Promise.all(promises);
        toast.success(`Cập nhật bảng điểm cho ${studentName} thành công!`);
        onClose();
        if (onSaved) onSaved();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi lưu bảng điểm!"));
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
            <Card
              size="small"
              style={{ backgroundColor: "#f8f9fa", borderRadius: 8 }}
              styles={{ body: { padding: 12 } }}
            >
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

              {gradeItems.map((item) => {
                const isManual = item.type === "Manual";
                return (
                  <Card
                    key={item._id}
                    size="small"
                    style={{
                      marginBottom: 14,
                      borderRadius: 8,
                      border: "1px solid #e8e8e8",
                      opacity: isManual ? 1 : 0.7,
                    }}
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Space>
                          <Text strong style={{ fontSize: 13 }}>
                            {item.title}
                          </Text>
                          {!isManual && (
                            <Tooltip title="Điểm này được lấy tự động từ hệ thống (Bài tập / Bài thi). Không thể sửa trực tiếp tại đây.">
                              <Tag icon={<InfoCircleOutlined />} color="default">
                                Tự động
                              </Tag>
                            </Tooltip>
                          )}
                        </Space>
                        <Tag color="blue">Tỷ trọng: {item.weight}%</Tag>
                      </div>
                    }
                  >
                    <Row gutter={12}>
                      <Col span={10}>
                        <Form.Item
                          name={`score_${item._id}`}
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
                            disabled={!isManual}
                            placeholder="Nhập điểm (VD: 8.5)"
                            style={{ width: "100%" }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={14}>
                        <Form.Item
                          name={`feedback_${item._id}`}
                          label="Nhận xét / Feedback"
                          style={{ marginBottom: 0 }}
                        >
                          <Input disabled={!isManual} placeholder="Ghi chú / Nhận xét..." />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                );
              })}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
                <Button onClick={onClose}>Hủy</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  icon={<CheckCircleOutlined />}
                >
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
