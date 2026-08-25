import React, { useEffect, useState } from "react";
import { Card, Table, Tag, Typography, Input, Select, Space, Avatar, message, Button } from "antd";
import { UserOutlined, SearchOutlined, AimOutlined } from "@ant-design/icons";
import { learnerNeedApi } from "../../../api/learnerNeedApi";
import { unwrap } from "../../../api/unwrap";
import { formatAvailabilitySummary } from "../../teacher-assignment/teacherAssignmentUtils";
import type { LearnerNeedRecord, LearnerNeedStudentInfo } from "../learnerNeed.types";

const { Title, Text, Paragraph } = Typography;

const STATUS_LABEL: Record<LearnerNeedRecord["status"], { text: string; color: string }> = {
  OPEN: { text: "Đang chờ ghép lớp", color: "processing" },
  MATCHED: { text: "Đã xếp lớp", color: "success" },
  CLOSED: { text: "Đã đóng", color: "default" },
};

const isPopulatedStudent = (
  studentId: LearnerNeedRecord["studentId"]
): studentId is LearnerNeedStudentInfo => typeof studentId === "object" && studentId !== null;

// Nơi admin/giáo viên nhìn thấy nhu cầu học tập học viên đã khai báo (LearnerNeedPage) để
// xếp lớp thủ công — MVP chưa có matching tự động (xem gap analysis EduSpace, mục R04).
export const LearnerNeedBrowsePage: React.FC = () => {
  const [needs, setNeeds] = useState<LearnerNeedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("OPEN");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadNeeds = async (filters: { subject?: string; status?: string }) => {
    try {
      setLoading(true);
      const res = await learnerNeedApi.list(filters);
      setNeeds(unwrap(res.data, []));
    } catch (error) {
      console.error("Không tải được danh sách nhu cầu học tập:", error);
      message.error("Không tải được danh sách nhu cầu học tập.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNeeds({ status: statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleSearch = () => {
    loadNeeds({ status: statusFilter, subject: subjectFilter || undefined });
  };

  const handleMarkMatched = async (id: string) => {
    try {
      setUpdatingId(id);
      await learnerNeedApi.updateStatus(id, "MATCHED");
      message.success("Đã đánh dấu là đã xếp lớp.");
      loadNeeds({ status: statusFilter, subject: subjectFilter || undefined });
    } catch (error) {
      console.error("Cập nhật trạng thái thất bại:", error);
      message.error("Không cập nhật được trạng thái.");
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    {
      title: "Học viên",
      dataIndex: "studentId",
      key: "student",
      render: (studentId: LearnerNeedRecord["studentId"]) =>
        isPopulatedStudent(studentId) ? (
          <div className="flex items-center gap-2">
            <Avatar size="small" src={studentId.avatar} icon={<UserOutlined />}>
              {studentId.fullName?.charAt(0)}
            </Avatar>
            <div>
              <div className="text-sm font-medium">{studentId.fullName}</div>
              <div className="text-xs text-gray-400">{studentId.email}</div>
            </div>
          </div>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: "Môn / Mục tiêu",
      key: "goal",
      render: (_: unknown, record: LearnerNeedRecord) => (
        <div>
          <Text strong>{record.subject}</Text>
          {record.currentLevel && (
            <div className="text-xs text-gray-400">Trình độ: {record.currentLevel}</div>
          )}
          <Paragraph className="!mb-0 !mt-1 text-xs" ellipsis={{ rows: 2 }}>
            {record.goal}
          </Paragraph>
        </div>
      ),
    },
    {
      title: "Hình thức",
      dataIndex: "preferredFormat",
      key: "preferredFormat",
      render: (format: LearnerNeedRecord["preferredFormat"]) => (
        <Tag>
          {format === "ONLINE"
            ? "Trực tuyến"
            : format === "OFFLINE"
              ? "Trực tiếp"
              : "Không yêu cầu"}
        </Tag>
      ),
    },
    {
      title: "Thời gian rảnh",
      dataIndex: "preferredTimes",
      key: "preferredTimes",
      render: (preferredTimes: LearnerNeedRecord["preferredTimes"]) =>
        formatAvailabilitySummary(preferredTimes),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: LearnerNeedRecord["status"]) => (
        <Tag color={STATUS_LABEL[status].color}>{STATUS_LABEL[status].text}</Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: LearnerNeedRecord) =>
        record.status === "OPEN" ? (
          <Button
            size="small"
            type="link"
            loading={updatingId === record._id}
            onClick={() => handleMarkMatched(record._id)}
          >
            Đánh dấu đã xếp lớp
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          <AimOutlined className="mr-2 text-indigo-600" />
          Nhu cầu học tập
        </Title>
        <Text type="secondary">
          Danh sách nhu cầu học viên tự khai báo — dùng để xếp lớp phù hợp thủ công (MVP, chưa có
          matching tự động).
        </Text>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-sm" variant="borderless">
        <Space className="mb-4" wrap>
          <Input
            placeholder="Tìm theo môn học..."
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            onPressEnter={handleSearch}
            prefix={<SearchOutlined />}
            style={{ width: 220 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { value: "OPEN", label: "Đang chờ ghép lớp" },
              { value: "MATCHED", label: "Đã xếp lớp" },
              { value: "CLOSED", label: "Đã đóng" },
            ]}
          />
          <Button onClick={handleSearch}>Lọc</Button>
        </Space>

        <Table
          columns={columns}
          dataSource={needs}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default LearnerNeedBrowsePage;
