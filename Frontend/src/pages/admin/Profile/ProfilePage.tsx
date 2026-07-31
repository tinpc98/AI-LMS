import React, { useState } from "react";
import {
  Card,
  Avatar,
  Typography,
  Descriptions,
  Form,
  Input,
  Button,
  Tabs,
  Tag,
  Table,
  Row,
  Col,
  Space,
  message,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  LockOutlined,
  CheckCircleOutlined,
  GlobalOutlined,
  DesktopOutlined,
} from "@ant-design/icons";
import { mockAccounts } from "../../../features/account/mockAccounts";
import type { AccountRecord } from "../../../features/account/account.types";
import { ChangePasswordModal } from "./ChangePasswordModal";

const { Title, Text, Paragraph } = Typography;

export interface EditProfileFormValues {
  fullName: string;
  phone: string;
  avatar?: string;
}

export interface LoginActivityRecord {
  id: string;
  time: string;
  device: string;
  browser: string;
  ipAddress: string;
  status: "Success" | "Failed";
}

const mockLoginActivity: LoginActivityRecord[] = [
  {
    id: "log-01",
    time: "26/07/2026 10:30:15",
    device: "Windows 11 PC",
    browser: "Chrome 127.0",
    ipAddress: "192.168.1.45",
    status: "Success",
  },
  {
    id: "log-02",
    time: "25/07/2026 14:15:40",
    device: "macOS Sonoma",
    browser: "Safari 17.5",
    ipAddress: "113.161.42.12",
    status: "Success",
  },
  {
    id: "log-03",
    time: "24/07/2026 09:05:22",
    device: "iPhone 15 Pro",
    browser: "Mobile Safari",
    ipAddress: "113.161.42.12",
    status: "Success",
  },
  {
    id: "log-04",
    time: "22/07/2026 18:20:05",
    device: "Windows 11 PC",
    browser: "Chrome 126.0",
    ipAddress: "192.168.1.45",
    status: "Success",
  },
  {
    id: "log-05",
    time: "20/07/2026 08:00:11",
    device: "Ubuntu Workstation",
    browser: "Firefox 128.0",
    ipAddress: "14.226.12.89",
    status: "Success",
  },
];

export const ProfilePage: React.FC = () => {
  // Use existing mock user or fallback
  const initialUser: AccountRecord = mockAccounts[0] || {
    id: "1",
    fullName: "Nguyen Van A",
    email: "admin@ailms.vn",
    phone: "0901234567",
    role: "Admin",
    status: "Active",
    avatar: "",
    createdAt: "2025-01-10T08:30:00.000Z",
    updatedAt: "2025-01-10T08:30:00.000Z",
  };

  const [adminUser, setAdminUser] = useState<AccountRecord>(initialUser);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [form] = Form.useForm<EditProfileFormValues>();

  const lastLoginTime = "26/07/2026 10:30";

  const handleUpdateProfile = async (values: EditProfileFormValues) => {
    try {
      setIsSaving(true);
      // Simulated future API call readiness
      setAdminUser((prev) => ({
        ...prev,
        fullName: values.fullName,
        phone: values.phone,
        avatar: values.avatar || "",
        updatedAt: new Date().toISOString(),
      }));

      message.success("Cập nhật thông tin cá nhân thành công!");
    } catch (error) {
      console.error("Update profile failed:", error);
      message.error("Có lỗi xảy ra khi cập nhật thông tin cá nhân!");
    } finally {
      setIsSaving(false);
    }
  };

  const loginTableColumns = [
    {
      title: "Thời gian",
      dataIndex: "time",
      key: "time",
      render: (text: string) => (
        <span className="flex items-center gap-2 text-gray-700 font-medium">
          <ClockCircleOutlined className="text-gray-400" />
          {text}
        </span>
      ),
    },
    {
      title: "Thiết bị",
      dataIndex: "device",
      key: "device",
      render: (text: string) => (
        <span className="flex items-center gap-2 text-gray-700">
          <DesktopOutlined className="text-indigo-500" />
          {text}
        </span>
      ),
    },
    {
      title: "Trình duyệt",
      dataIndex: "browser",
      key: "browser",
    },
    {
      title: "Địa chỉ IP",
      dataIndex: "ipAddress",
      key: "ipAddress",
      render: (text: string) => (
        <span className="flex items-center gap-1 text-gray-600 font-mono text-xs">
          <GlobalOutlined className="text-blue-400" />
          {text}
        </span>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: LoginActivityRecord["status"]) => (
        <Tag color={status === "Success" ? "success" : "error"} className="rounded-full px-3">
          {status === "Success" ? "Thành công" : "Thất bại"}
        </Tag>
      ),
    },
  ];

  const firstLetter = adminUser.fullName ? adminUser.fullName.trim()[0].toUpperCase() : "A";

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar
            size={72}
            src={adminUser.avatar || undefined}
            className="bg-indigo-600 font-bold text-2xl shadow-md border-2 border-indigo-100"
          >
            {!adminUser.avatar && firstLetter}
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <Title level={3} className="!mb-0 font-bold text-gray-800">
                {adminUser.fullName}
              </Title>
              <Tag color="purple" className="rounded-full px-3 font-medium">
                {adminUser.role === "Admin" ? "Super Admin" : adminUser.role}
              </Tag>
              <Tag color="success" className="rounded-full px-3">
                <CheckCircleOutlined /> {adminUser.status}
              </Tag>
            </div>
            <Paragraph className="text-gray-500 !mb-0 mt-1 flex items-center gap-4 text-xs">
              <span>
                <MailOutlined className="mr-1" /> {adminUser.email}
              </span>
              <span>
                <PhoneOutlined className="mr-1" /> {adminUser.phone}
              </span>
            </Paragraph>
          </div>
        </div>

        <Space>
          <Button
            icon={<LockOutlined />}
            onClick={() => setIsPasswordModalOpen(true)}
            className="rounded-xl border-gray-200"
          >
            Đổi mật khẩu
          </Button>
        </Space>
      </div>

      {/* Main Content Grid */}
      <Row gutter={[24, 24]}>
        {/* Left Column: Profile Info Card */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <UserOutlined className="text-indigo-600" />
                <span>Thông tin quản trị viên</span>
              </div>
            }
            className="rounded-2xl border border-gray-100 shadow-sm h-full"
            variant="borderless"
          >
            <Descriptions column={1} size="middle" className="mt-2">
              <Descriptions.Item label={<span className="text-gray-500">Họ và tên</span>}>
                <span className="font-semibold text-gray-800">{adminUser.fullName}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-500">Email</span>}>
                <span className="text-gray-800 font-mono text-xs">{adminUser.email}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-500">Số điện thoại</span>}>
                <span className="text-gray-800">{adminUser.phone}</span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-500">Vai trò</span>}>
                <Tag color="blue" className="rounded-full px-3">
                  <SafetyCertificateOutlined className="mr-1" />
                  {adminUser.role === "Admin" ? "Super Admin" : adminUser.role}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-500">Trạng thái</span>}>
                <Tag color="success" className="rounded-full px-3">
                  {adminUser.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-500">Ngày tạo tài khoản</span>}>
                <span className="text-gray-700">
                  <CalendarOutlined className="mr-1 text-gray-400" />
                  {new Date(adminUser.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label={<span className="text-gray-500">Đăng nhập gần nhất</span>}>
                <span className="text-gray-700 font-medium">
                  <ClockCircleOutlined className="mr-1 text-indigo-500" />
                  {lastLoginTime}
                </span>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Right Column: Edit Profile Form */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <div className="flex items-center gap-2 font-semibold text-gray-800">
                <EditOutlined className="text-indigo-600" />
                <span>Chỉnh sửa thông tin cá nhân</span>
              </div>
            }
            className="rounded-2xl border border-gray-100 shadow-sm"
            variant="borderless"
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                fullName: adminUser.fullName,
                phone: adminUser.phone,
                avatar: adminUser.avatar,
              }}
              onFinish={handleUpdateProfile}
              requiredMark="optional"
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="fullName"
                    label="Họ và tên"
                    rules={[{ required: true, message: "Vui lòng nhập họ và tên" }]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="Nhập họ và tên"
                      size="large"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item
                    name="phone"
                    label="Số điện thoại"
                    rules={[
                      { required: true, message: "Vui lòng nhập số điện thoại" },
                      { pattern: /^[0-9+ ]{9,15}$/, message: "Số điện thoại không hợp lệ" },
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined className="text-gray-400" />}
                      placeholder="Nhập số điện thoại"
                      size="large"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label="Email (Chỉ đọc)">
                    <Input
                      prefix={<MailOutlined className="text-gray-400" />}
                      value={adminUser.email}
                      disabled
                      size="large"
                      className="rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item label="Vai trò (Chỉ đọc)">
                    <Input
                      prefix={<SafetyCertificateOutlined className="text-gray-400" />}
                      value={adminUser.role === "Admin" ? "Super Admin" : adminUser.role}
                      disabled
                      size="large"
                      className="rounded-lg bg-gray-50 cursor-not-allowed"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="avatar"
                label="Đường dẫn Avatar (URL)"
                extra="Nhập URL hình ảnh avatar cá nhân của bạn"
              >
                <Input
                  placeholder="https://example.com/avatar.jpg"
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              <div className="flex justify-end mt-4">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSaving}
                  icon={<CheckCircleOutlined />}
                  size="large"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-6"
                >
                  Lưu thay đổi
                </Button>
              </div>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Login Activity Section */}
      <Card
        title={
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-800 text-base">Recent Login Activity</span>
            <Text className="text-xs text-gray-400 font-normal">
              Lịch sử 5 lần truy cập hệ thống gần nhất
            </Text>
          </div>
        }
        className="rounded-2xl border border-gray-100 shadow-sm"
        variant="borderless"
      >
        <Table
          columns={loginTableColumns}
          dataSource={mockLoginActivity}
          rowKey="id"
          pagination={false}
          className="border-t border-gray-100"
        />
      </Card>

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
