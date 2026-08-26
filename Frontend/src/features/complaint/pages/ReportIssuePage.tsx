import React, { useState } from "react";
import { Card, Form, Select, Input, Button, Typography, Alert, Result } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import { complaintApi } from "../../../api/complaintApi";
import { COMPLAINT_CATEGORY_LABELS, type ComplaintCategory } from "../complaint.types";

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

interface ReportIssueFormValues {
  category: ComplaintCategory;
  description: string;
}

// Nơi bất kỳ ai (học sinh/giáo viên) báo cáo vấn đề — EduSpace mechanism design Phần C.6.
// Cố ý KHÔNG có field "báo cáo về ai" bắt buộc — một khiếu nại về an toàn/chất lượng chung
// chung vẫn cần được tiếp nhận dù người báo cáo không chắc quy trách nhiệm cho ai.
export const ReportIssuePage: React.FC = () => {
  const [form] = Form.useForm<ReportIssueFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const category = Form.useWatch("category", form);

  const handleSubmit = async (values: ReportIssueFormValues) => {
    try {
      setSubmitting(true);
      await complaintApi.create(values);
      setSubmitted(true);
      form.resetFields();
    } catch (error) {
      console.error("Gửi báo cáo thất bại:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-6 bg-slate-50/50 min-h-screen flex items-center justify-center">
        <Result
          status="success"
          title="Đã gửi báo cáo thành công"
          subTitle="Đội ngũ quản trị sẽ xem xét và phản hồi trong thời gian sớm nhất. Cảm ơn bạn đã lên tiếng."
          extra={
            <Button type="primary" onClick={() => setSubmitted(false)}>
              Gửi báo cáo khác
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          <WarningOutlined className="mr-2 text-amber-500" />
          Báo cáo vấn đề
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Gặp vấn đề về chất lượng giảng dạy, giáo viên vắng mặt không báo trước, hành vi không phù
          hợp, hoặc lo ngại về an toàn? Hãy cho chúng tôi biết.
        </Paragraph>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-sm max-w-2xl" variant="borderless">
        {category === "CHILD_SAFETY" && (
          <Alert
            className="mb-4 rounded-lg"
            type="error"
            showIcon
            message="Báo cáo này sẽ được xử lý ưu tiên khẩn cấp"
            description="Các báo cáo liên quan tới an toàn trẻ em được đội ngũ quản trị xem xét trong vòng vài giờ, không phải hàng ngày như báo cáo thông thường."
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
          <Form.Item
            name="category"
            label="Loại vấn đề"
            rules={[{ required: true, message: "Vui lòng chọn loại vấn đề" }]}
          >
            <Select
              size="large"
              className="rounded-lg"
              placeholder="Chọn loại vấn đề"
              options={Object.entries(COMPLAINT_CATEGORY_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả chi tiết"
            rules={[{ required: true, message: "Vui lòng mô tả vấn đề" }]}
          >
            <TextArea
              rows={5}
              maxLength={5000}
              showCount
              placeholder="Mô tả càng chi tiết càng giúp chúng tôi xử lý nhanh hơn: buổi học nào, ai liên quan, chuyện gì đã xảy ra..."
            />
          </Form.Item>

          <div className="flex justify-end">
            <Button
              type="primary"
              danger={category === "CHILD_SAFETY"}
              htmlType="submit"
              loading={submitting}
              size="large"
              className="rounded-xl px-6"
            >
              Gửi báo cáo
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ReportIssuePage;
