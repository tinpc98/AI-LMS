import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Typography, Button, Modal, Input, message, Empty, Tooltip } from "antd";
import { WarningOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { complaintApi } from "../../../api/complaintApi";
import { unwrap } from "../../../api/unwrap";
import {
  COMPLAINT_CATEGORY_LABELS,
  type ComplaintRecord,
  type ComplaintUserInfo,
} from "../complaint.types";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const isPopulatedUser = (v: unknown): v is ComplaintUserInfo =>
  typeof v === "object" && v !== null && "fullName" in v;

const STATUS_LABEL: Record<ComplaintRecord["status"], { text: string; color: string }> = {
  SUBMITTED: { text: "Chưa phản hồi", color: "error" },
  UNDER_REVIEW: { text: "Đang xem xét", color: "processing" },
  RESOLVED: { text: "Đã xử lý", color: "success" },
};

// Trang Admin xử lý khiếu nại — EduSpace mechanism design Phần C.6 (BR-30/31). Chỉ hiển thị
// khiếu nại CHƯA phản hồi và ĐÃ quá SLA (CHILD_SAFETY ưu tiên lên đầu) — đúng thiết kế: đây là
// hàng đợi "cần chú ý ngay", không phải toàn bộ lịch sử khiếu nại.
export const ComplaintManagementPage: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [resolveTarget, setResolveTarget] = useState<ComplaintRecord | null>(null);
  const [resolution, setResolution] = useState("");
  const [resolving, setResolving] = useState(false);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await complaintApi.listOverdue();
      setComplaints(unwrap(res.data, []));
    } catch (error) {
      console.error("Không tải được danh sách khiếu nại:", error);
      message.error("Không tải được danh sách khiếu nại quá hạn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const handleRespond = async (id: string) => {
    try {
      setRespondingId(id);
      await complaintApi.respond(id);
      message.success("Đã ghi nhận phản hồi đầu tiên.");
      loadComplaints();
    } catch (error) {
      console.error("Phản hồi khiếu nại thất bại:", error);
      message.error("Không phản hồi được, vui lòng thử lại.");
    } finally {
      setRespondingId(null);
    }
  };

  const handleResolve = async () => {
    if (!resolveTarget || !resolution.trim()) {
      message.warning("Vui lòng nhập kết luận xử lý.");
      return;
    }
    try {
      setResolving(true);
      await complaintApi.resolve(resolveTarget._id, resolution.trim());
      message.success("Đã đóng khiếu nại.");
      setResolveTarget(null);
      setResolution("");
      loadComplaints();
    } catch (error) {
      console.error("Đóng khiếu nại thất bại:", error);
      message.error("Không đóng được khiếu nại, vui lòng thử lại.");
    } finally {
      setResolving(false);
    }
  };

  const columns = [
    {
      title: "Mức độ",
      dataIndex: "category",
      key: "category",
      width: 190,
      render: (category: ComplaintRecord["category"]) =>
        category === "CHILD_SAFETY" ? (
          <Tag color="error" icon={<ExclamationCircleOutlined />}>
            {COMPLAINT_CATEGORY_LABELS[category]}
          </Tag>
        ) : (
          <Tag>{COMPLAINT_CATEGORY_LABELS[category]}</Tag>
        ),
    },
    {
      title: "Người báo cáo",
      dataIndex: "reportedBy",
      key: "reportedBy",
      render: (reportedBy: ComplaintRecord["reportedBy"]) =>
        isPopulatedUser(reportedBy) ? reportedBy.fullName : "—",
    },
    {
      title: "Về giáo viên",
      dataIndex: "aboutTeacherId",
      key: "aboutTeacherId",
      render: (aboutTeacherId: ComplaintRecord["aboutTeacherId"]) =>
        isPopulatedUser(aboutTeacherId) ? aboutTeacherId.fullName : "—",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      render: (text: string) => (
        <Paragraph className="!mb-0 max-w-md" ellipsis={{ rows: 2, tooltip: text }}>
          {text}
        </Paragraph>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: ComplaintRecord["status"]) => (
        <Tag color={STATUS_LABEL[status].color}>{STATUS_LABEL[status].text}</Tag>
      ),
    },
    {
      title: "Nộp lúc",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => new Date(value).toLocaleString("vi-VN"),
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: ComplaintRecord) => (
        <div className="flex gap-2">
          <Tooltip title="Ghi nhận đã bắt đầu xử lý">
            <Button
              size="small"
              onClick={() => handleRespond(record._id)}
              loading={respondingId === record._id}
            >
              Phản hồi
            </Button>
          </Tooltip>
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => setResolveTarget(record)}
          >
            Đóng
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          <WarningOutlined className="mr-2 text-red-500" />
          Khiếu nại cần xử lý
        </Title>
        <Text type="secondary">
          Chỉ hiển thị khiếu nại chưa phản hồi và đã quá thời hạn SLA — an toàn trẻ em được ưu tiên
          lên đầu danh sách.
        </Text>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-sm" variant="borderless">
        {complaints.length === 0 && !loading ? (
          <Empty description="Không có khiếu nại nào quá hạn — làm tốt lắm!" />
        ) : (
          <Table
            columns={columns}
            dataSource={complaints}
            rowKey="_id"
            loading={loading}
            scroll={{ x: "max-content" }}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="Đóng khiếu nại"
        open={!!resolveTarget}
        onCancel={() => {
          setResolveTarget(null);
          setResolution("");
        }}
        onOk={handleResolve}
        confirmLoading={resolving}
        okText="Xác nhận đóng"
        cancelText="Huỷ"
      >
        <Paragraph type="secondary">
          Ghi rõ kết luận xử lý — sẽ được lưu lại vĩnh viễn kèm khiếu nại để đối chiếu nếu có mẫu
          hình lặp lại từ cùng một giáo viên.
        </Paragraph>
        <TextArea
          rows={4}
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder="VD: Đã xác nhận qua ghi hình buổi học, nhắc nhở giáo viên..."
        />
      </Modal>
    </div>
  );
};

export default ComplaintManagementPage;
