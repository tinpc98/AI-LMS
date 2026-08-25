import React, { useState } from "react";
import { Card, Table, Typography, Space, Button, Popconfirm, message, Select } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { teacherAttendanceApi } from "../../api/teacherAttendanceApi";
import type { ITeacherAttendance, TeacherAttendanceStatus } from "../../types/teacherAttendance";
import { CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import TeacherAttendanceStatusTag from "./components/TeacherAttendanceStatusTag";
import CountdownTimer from "./components/CountdownTimer";
import ContributionSummaryCard from "./components/ContributionSummaryCard";

export const TeacherAttendancePage: React.FC = () => {
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [statusFilter, setStatusFilter] = useState<TeacherAttendanceStatus | "ALL">("ALL");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["teacher-attendance", "my", pagination, statusFilter],
    queryFn: () =>
      teacherAttendanceApi.getMyAttendance({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => teacherAttendanceApi.confirmAttendance(id),
    onSuccess: () => {
      message.success("Xác nhận điểm danh thành công!");
      // Khớp tiền tố "teacher-attendance" nên cũng tự invalidate luôn
      // CONTRIBUTION_SUMMARY_QUERY_KEY ở dưới (cùng bắt đầu bằng "teacher-attendance").
      queryClient.invalidateQueries({ queryKey: ["teacher-attendance"] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Lỗi thao tác");
    },
  });

  const handleTableChange = (newPagination: any) => {
    setPagination({
      page: newPagination.current,
      limit: newPagination.pageSize,
    });
  };

  const columns = [
    {
      title: "Buổi học",
      dataIndex: ["sessionId", "title"],
      key: "title",
      render: (text: string, record: ITeacherAttendance) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>
            {text || `Buổi ${record.sessionId?.sessionNumber}`}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            ID: {record.sessionId?._id?.substring(0, 8)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_: any, record: ITeacherAttendance) => {
        const start = record.sessionId?.actualStartAt || record.sessionId?.scheduledStartAt;
        const end = record.sessionId?.actualEndAt || record.sessionId?.scheduledEndAt;
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text>
              {start ? dayjs(start).format("DD/MM/YYYY") : "Chưa xác định"}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {start ? dayjs(start).format("HH:mm") : ""} - {end ? dayjs(end).format("HH:mm") : ""}
            </Typography.Text>
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: TeacherAttendanceStatus) => <TeacherAttendanceStatusTag status={status} />,
    },
    {
      title: "Thời gian còn lại",
      key: "countdown",
      render: (_: any, record: ITeacherAttendance) => {
        const end = record.sessionId?.actualEndAt || record.sessionId?.scheduledEndAt;
        return (
          <CountdownTimer endAt={end || null} lockedAt={record.lockedAt} status={record.status} />
        );
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_: any, record: ITeacherAttendance) => {
        const end = record.sessionId?.actualEndAt || record.sessionId?.scheduledEndAt;
        let isLocked = false;
        if (record.status === "CONFIRMED" || record.status === "ABSENT") isLocked = true;
        else if (!end) isLocked = true;
        else {
          const endDate = dayjs(end);
          const lockedDate = record.lockedAt ? dayjs(record.lockedAt) : endDate.add(24, "hour");
          if (dayjs().isAfter(lockedDate)) isLocked = true;
        }

        return (
          <Popconfirm
            title="Xác nhận điểm danh?"
            description="Bạn có chắc chắn muốn xác nhận điểm danh buổi học này?"
            onConfirm={() => confirmMutation.mutate(record._id)}
            okText="Xác nhận"
            cancelText="Hủy"
            disabled={isLocked || confirmMutation.isPending}
          >
            <Button
              type="primary"
              disabled={isLocked}
              loading={confirmMutation.isPending}
              icon={<CheckCircleOutlined />}
            >
              Xác nhận
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Điểm danh của tôi
        </Typography.Title>
        <Typography.Paragraph style={{ margin: 0, color: "var(--color-text-description)" }}>
          Quản lý và xác nhận điểm danh các buổi dạy của bạn. Lưu ý: Bạn chỉ có 24 giờ để xác nhận
          kể từ khi buổi học kết thúc.
        </Typography.Paragraph>
      </div>

      <ContributionSummaryCard />

      <Card bordered={false}>
        <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
          <Space>
            <Typography.Text strong>Lọc trạng thái:</Typography.Text>
            <Select
              value={statusFilter}
              onChange={(v) => {
                setStatusFilter(v);
                setPagination({ ...pagination, page: 1 });
              }}
              style={{ width: 150 }}
              options={[
                { value: "ALL", label: "Tất cả" },
                { value: "PENDING", label: "Chờ xác nhận" },
                { value: "CONFIRMED", label: "Đã xác nhận" },
                { value: "ABSENT", label: "Vắng mặt" },
              ]}
            />
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data?.data || []}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: data?.pagination?.totalItems || 0,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default TeacherAttendancePage;
