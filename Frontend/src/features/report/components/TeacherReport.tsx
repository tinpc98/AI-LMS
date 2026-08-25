import React, { useEffect, useState } from "react";
import { Row, Col, Card, Table, Tag, Avatar, Statistic, Spin, Alert } from "antd";
import { TeamOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { accountService } from "../../../features/account/accountService";
import type { AccountRecord } from "../../../features/account/account.types";

export const TeacherReport: React.FC = () => {
  const [teachers, setTeachers] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        const res = await accountService.getAccounts({
          role: "Teacher",
          page: 1,
          limit: 100,
          search: "",
          status: "All",
        });
        if (res.success && res.data) {
          setTeachers(res.data);
        }
      } catch (err: any) {
        setError(err.message || "Lỗi tải dữ liệu giáo viên");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const activeTeachers = teachers.filter((u) => u.status === "Active").length;

  const columns = [
    {
      title: "Giáo viên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<TeamOutlined />} className="bg-purple-600" />
          <div>
            <div className="font-semibold text-gray-800">{text}</div>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Active" ? "success" : "default"}>
          {status === "Active" ? "Đang công tác" : "Nghỉ phép/Dừng"}
        </Tag>
      ),
    },
  ];

  if (loading) return <Spin className="block my-10 mx-auto" size="large" />;
  if (error) return <Alert type="error" message={error} />;

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Số Giảng Viên"
              value={teachers.length}
              prefix={<TeamOutlined className="text-purple-500 mr-2 p-2 bg-purple-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Đang Công Tác"
              value={activeTeachers}
              prefix={
                <CheckCircleOutlined className="text-green-500 mr-2 p-2 bg-green-50 rounded-lg" />
              }
            />
          </Card>
        </Col>
      </Row>
      {/*
        Đã bỏ card "Điểm Đánh Giá Giảng Dạy TB": hệ thống hiện chưa có cơ chế đánh giá/rating
        giáo viên nào (không model, không API), giá trị 4.85 cũ là số cố định không có nguồn
        dữ liệu thật. Chỉ thêm lại khi có model Rating/Feedback thật.
      */}

      {/* Table */}
      <Card title="Danh sách Giáo viên" className="rounded-xl shadow-sm border border-gray-100">
        <Table
          columns={columns}
          dataSource={teachers}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="overflow-x-auto"
        />
      </Card>
    </div>
  );
};

export default TeacherReport;
