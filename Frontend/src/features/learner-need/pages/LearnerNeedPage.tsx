import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  List,
  Tag,
  Typography,
  Row,
  Col,
  Space,
  Empty,
  message,
  Popconfirm,
} from "antd";
import { AimOutlined, ClockCircleOutlined, DeleteOutlined, BookOutlined } from "@ant-design/icons";
import { learnerNeedApi } from "../../../api/learnerNeedApi";
import { unwrap, unwrapOrNull } from "../../../api/unwrap";
import { AvailabilityScheduleEditor } from "../../profile/components/AvailabilityScheduleEditor";
import type { AvailabilitySchedule } from "../../../interface/userInterface";
import type { CreateLearnerNeedPayload, LearnerNeedRecord } from "../learnerNeed.types";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

const STATUS_LABEL: Record<LearnerNeedRecord["status"], { text: string; color: string }> = {
  OPEN: { text: "Đang chờ ghép lớp", color: "processing" },
  MATCHED: { text: "Đã được xếp lớp", color: "success" },
  CLOSED: { text: "Đã đóng", color: "default" },
};

const FORMAT_LABEL: Record<CreateLearnerNeedPayload["preferredFormat"], string> = {
  ONLINE: "Trực tuyến",
  OFFLINE: "Trực tiếp",
  ANY: "Không yêu cầu",
};

interface LearnerNeedFormValues {
  subject: string;
  currentLevel?: string;
  goal: string;
  preferredFormat: CreateLearnerNeedPayload["preferredFormat"];
}

// Nơi học viên khai báo "tôi cần học môn gì, đang yếu ở đâu, rảnh khi nào" — mảnh dữ liệu
// MVP còn thiếu để có thể xếp lớp dựa trên nhu cầu thật thay vì chỉ dựa trên khoá học đã
// mua (xem gap analysis EduSpace, mục R03). Admin/giáo viên đọc danh sách này thủ công khi
// xếp lớp ở giai đoạn MVP — chưa có matching tự động.
export const LearnerNeedPage: React.FC = () => {
  const [form] = Form.useForm<LearnerNeedFormValues>();
  const [preferredTimes, setPreferredTimes] = useState<AvailabilitySchedule>({});
  const [needs, setNeeds] = useState<LearnerNeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadNeeds = async () => {
    try {
      setLoading(true);
      const res = await learnerNeedApi.getMy();
      setNeeds(unwrap(res.data, []));
    } catch (error) {
      console.error("Không tải được danh sách nhu cầu học tập:", error);
      message.error("Không tải được danh sách nhu cầu học tập của bạn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNeeds();
  }, []);

  const handleSubmit = async (values: LearnerNeedFormValues) => {
    try {
      setSubmitting(true);
      const res = await learnerNeedApi.createMy({ ...values, preferredTimes });
      const created = unwrapOrNull(res.data);
      if (created) setNeeds((prev) => [created, ...prev]);
      message.success("Đã gửi nhu cầu học tập của bạn!");
      form.resetFields();
      setPreferredTimes({});
    } catch (error) {
      console.error("Gửi nhu cầu học tập thất bại:", error);
      message.error("Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      setCancellingId(id);
      const res = await learnerNeedApi.cancelMy(id);
      const updated = unwrapOrNull(res.data);
      if (updated) {
        setNeeds((prev) => prev.map((n) => (n._id === id ? updated : n)));
      }
      message.success("Đã huỷ nhu cầu học tập.");
    } catch (error) {
      console.error("Huỷ nhu cầu học tập thất bại:", error);
      message.error("Không huỷ được, vui lòng thử lại.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          <AimOutlined className="mr-2 text-indigo-600" />
          Nhu cầu học tập
        </Title>
        <Paragraph type="secondary" className="!mb-0">
          Cho chúng tôi biết bạn cần học gì, đang yếu ở đâu và rảnh khi nào — đội ngũ EduSpace sẽ
          dựa vào đây để xếp bạn vào lớp phù hợp.
        </Paragraph>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <Card
            title={
              <span className="flex items-center gap-2 font-semibold">
                <BookOutlined className="text-indigo-600" /> Khai báo nhu cầu mới
              </span>
            }
            className="rounded-2xl border border-gray-100 shadow-sm"
            variant="borderless"
          >
            <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
              <Form.Item
                name="subject"
                label="Môn cần học"
                rules={[{ required: true, message: "Vui lòng nhập môn cần học" }]}
              >
                <Input placeholder="VD: Toán lớp 9" size="large" className="rounded-lg" />
              </Form.Item>

              <Form.Item name="currentLevel" label="Trình độ hiện tại (tuỳ chọn)">
                <Input
                  placeholder="VD: Lớp 9, mất gốc hình học"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item
                name="goal"
                label="Mục tiêu / đang yếu ở đâu"
                rules={[{ required: true, message: "Vui lòng mô tả mục tiêu học tập" }]}
              >
                <TextArea
                  placeholder="VD: Em yếu phần hình học, muốn ôn thi học kỳ"
                  rows={3}
                  maxLength={500}
                  showCount
                  className="rounded-lg"
                />
              </Form.Item>

              <Form.Item name="preferredFormat" label="Hình thức học ưa thích" initialValue="ANY">
                <Select
                  size="large"
                  className="rounded-lg"
                  options={[
                    { value: "ANY", label: "Không yêu cầu" },
                    { value: "ONLINE", label: "Trực tuyến" },
                    { value: "OFFLINE", label: "Trực tiếp" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    <ClockCircleOutlined className="mr-1" /> Thời gian rảnh trong tuần
                  </span>
                }
              >
                <AvailabilityScheduleEditor value={preferredTimes} onChange={setPreferredTimes} />
              </Form.Item>

              <div className="flex justify-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={submitting}
                  size="large"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6"
                >
                  Gửi nhu cầu học tập
                </Button>
              </div>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={14}>
          <Card
            title="Nhu cầu đã gửi"
            className="rounded-2xl border border-gray-100 shadow-sm"
            variant="borderless"
            loading={loading}
          >
            {needs.length === 0 ? (
              <Empty description="Bạn chưa gửi nhu cầu học tập nào." />
            ) : (
              <List
                itemLayout="vertical"
                dataSource={needs}
                renderItem={(need) => (
                  <List.Item
                    key={need._id}
                    actions={
                      need.status === "OPEN"
                        ? [
                            <Popconfirm
                              key="cancel"
                              title="Huỷ nhu cầu học tập này?"
                              onConfirm={() => handleCancel(need._id)}
                              okText="Huỷ nhu cầu"
                              cancelText="Đóng"
                            >
                              <Button
                                type="text"
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                loading={cancellingId === need._id}
                              >
                                Huỷ
                              </Button>
                            </Popconfirm>,
                          ]
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Text strong>{need.subject}</Text>
                      <Tag color={STATUS_LABEL[need.status].color}>
                        {STATUS_LABEL[need.status].text}
                      </Tag>
                    </div>
                    {need.currentLevel && (
                      <Text type="secondary" className="block text-xs">
                        Trình độ: {need.currentLevel}
                      </Text>
                    )}
                    <Paragraph className="!mb-1 !mt-1 text-sm">{need.goal}</Paragraph>
                    <Space size={8}>
                      <Tag>{FORMAT_LABEL[need.preferredFormat]}</Tag>
                      <Text type="secondary" className="text-xs">
                        Gửi lúc {new Date(need.createdAt).toLocaleString("vi-VN")}
                      </Text>
                    </Space>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default LearnerNeedPage;
