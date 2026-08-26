import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Empty, message, Modal, DatePicker, Space, Typography } from "antd";
import { ThunderboltOutlined, StopOutlined } from "@ant-design/icons";
import dayjs, { Dayjs } from "dayjs";
import { cohortMechanismApi } from "../../../api/cohortMechanismApi";
import { unwrap } from "../../../api/unwrap";
import type { OverdueSession } from "../cohortMechanism.types";

const { Text } = Typography;

// Mức 1 (tự động kích hoạt dự bị) và Mức 3 (huỷ + tạo buổi bù) của quy trình leo thang — EduSpace
// mechanism design Phần B.1. Mức 2 chỉ là đánh dấu "cần Admin" (không có hành động riêng — Admin
// đọc bảng này và tự quyết định làm Mức 1 thủ công hay nhảy thẳng Mức 3).
export const EscalationQueueTab: React.FC = () => {
  const [sessions, setSessions] = useState<OverdueSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [escalatingId, setEscalatingId] = useState<string | null>(null);
  const [makeupTarget, setMakeupTarget] = useState<OverdueSession | null>(null);
  const [makeupRange, setMakeupRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await cohortMechanismApi.listOverdueSessions();
      setSessions(unwrap(res.data, []));
    } catch (error) {
      console.error("Không tải được danh sách buổi quá giờ:", error);
      message.error("Không tải được danh sách buổi học quá giờ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEscalateLevel1 = async (session: OverdueSession) => {
    try {
      setEscalatingId(session._id);
      const res = await cohortMechanismApi.escalateLevel1(session._id);
      const result = res.data.data;
      if (result?.resolved) {
        message.success("Đã kích hoạt giáo viên dự bị cho buổi học này.");
      } else {
        message.warning(
          "Không có dự bị khả dụng — cần Admin tự tìm giáo viên thay (Mức 2) hoặc huỷ + tạo buổi bù (Mức 3)."
        );
      }
      load();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Kích hoạt dự bị thất bại.");
    } finally {
      setEscalatingId(null);
    }
  };

  const handleCancelWithMakeup = async () => {
    if (!makeupTarget || !makeupRange) {
      message.warning("Vui lòng chọn thời gian buổi học bù.");
      return;
    }
    try {
      setCancelling(true);
      await cohortMechanismApi.cancelWithMakeup(makeupTarget._id, {
        makeupScheduledStartAt: makeupRange[0].toISOString(),
        makeupScheduledEndAt: makeupRange[1].toISOString(),
      });
      message.success("Đã huỷ buổi học và tạo buổi bù.");
      setMakeupTarget(null);
      setMakeupRange(null);
      load();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Huỷ buổi học thất bại.");
    } finally {
      setCancelling(false);
    }
  };

  const columns = [
    {
      title: "Buổi học",
      dataIndex: "title",
      key: "title",
      render: (title: string, record: OverdueSession) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Buổi số {record.sessionNumber}
          </Text>
        </div>
      ),
    },
    {
      title: "Giờ bắt đầu dự kiến",
      dataIndex: "scheduledStartAt",
      key: "scheduledStartAt",
      render: (value: string) => <Tag color="error">{dayjs(value).format("HH:mm DD/MM/YYYY")}</Tag>,
    },
    {
      title: "",
      key: "actions",
      render: (_: unknown, record: OverdueSession) => (
        <Space>
          <Button
            size="small"
            icon={<ThunderboltOutlined />}
            loading={escalatingId === record._id}
            onClick={() => handleEscalateLevel1(record)}
          >
            Kích hoạt dự bị (Mức 1)
          </Button>
          <Button
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => setMakeupTarget(record)}
          >
            Huỷ + tạo buổi bù (Mức 3)
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <>
      {sessions.length === 0 && !loading ? (
        <Empty description="Không có buổi học nào quá giờ — làm tốt lắm!" />
      ) : (
        <Table
          columns={columns}
          dataSource={sessions}
          rowKey="_id"
          loading={loading}
          scroll={{ x: "max-content" }}
          pagination={{ pageSize: 10 }}
        />
      )}

      <Modal
        title="Huỷ buổi học và tạo buổi bù"
        open={!!makeupTarget}
        onCancel={() => {
          setMakeupTarget(null);
          setMakeupRange(null);
        }}
        onOk={handleCancelWithMakeup}
        confirmLoading={cancelling}
        okText="Xác nhận huỷ + tạo buổi bù"
        cancelText="Huỷ thao tác"
      >
        <Text type="secondary">
          Buổi gốc sẽ được đánh dấu CANCELLED. Chọn thời gian cho buổi học bù (Mức 3, BR-13).
        </Text>
        <div style={{ marginTop: 16 }}>
          <DatePicker.RangePicker
            showTime={{ format: "HH:mm" }}
            format="HH:mm DD/MM/YYYY"
            style={{ width: "100%" }}
            onChange={(range) => {
              if (range && range[0] && range[1]) {
                setMakeupRange([range[0], range[1]]);
              } else {
                setMakeupRange(null);
              }
            }}
          />
        </div>
      </Modal>
    </>
  );
};

export default EscalationQueueTab;
