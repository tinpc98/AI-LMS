import React, { useRef, useState } from "react";
import {
  Card,
  Select,
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Empty,
  message,
  List,
  Alert,
  Table,
  Modal,
} from "antd";
import { SafetyCertificateOutlined, CheckCircleFilled, CloseCircleFilled } from "@ant-design/icons";
import { classService } from "../../class/classService";
import { accountService } from "../../account/accountService";
import { verificationApi } from "../../../api/verificationApi";
import { cohortFeedbackApi } from "../../../api/cohortFeedbackApi";
import { unwrap, unwrapOrNull } from "../../../api/unwrap";
import type { AccountRecord } from "../../account/account.types";
import {
  VERIFICATION_TIER_COLORS,
  VERIFICATION_TIER_LABELS,
  type L3Eligibility,
} from "../../verification/verification.types";
import type { CohortFeedbackRecord } from "../../cohort-feedback/cohortFeedback.types";

const { Text, Paragraph } = Typography;

// Hồ sơ tin cậy của MỘT giáo viên bất kỳ — gộp lại 4 khả năng Admin đã có ở backend nhưng chưa
// có giao diện: kiểm tra/nâng tầng L3 thủ công, tạm khoá quyền bảo lãnh (BR-24), và xem chi tiết
// đánh giá học viên (khác với trang "Đánh giá của tôi" ẩn danh của giáo viên — ở đây Admin được
// xem đầy đủ để xử lý khiếu nại/theo dõi mẫu hình lặp lại, Phần C.4).
export const TeacherTrustPage: React.FC = () => {
  const [teacherOptions, setTeacherOptions] = useState<{ id: string; label: string }[]>([]);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [profile, setProfile] = useState<AccountRecord | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [eligibility, setEligibility] = useState<L3Eligibility | null>(null);
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const [suspending, setSuspending] = useState(false);
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false);

  const [feedbacks, setFeedbacks] = useState<CohortFeedbackRecord[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // BUG ĐÃ SỬA: chọn nhanh giáo viên A rồi B trước khi response của A về — nếu response A đến
  // SAU response B (thứ tự mạng không đảm bảo), state sẽ hiện hồ sơ của A dưới Select đang chọn
  // B, Admin có thể thao tác (nâng L3, tạm khoá bảo lãnh) nhầm người. requestIdRef đánh dấu lượt
  // chọn mới nhất — mọi response chỉ được áp dụng nếu vẫn đúng lượt đó khi resolve xong.
  const requestIdRef = useRef(0);

  const ensureTeacherOptions = async () => {
    if (teacherOptions.length) return;
    const teachers = await classService.getTeacherOptions();
    setTeacherOptions(teachers);
  };

  const loadTeacher = async (teacherId: string) => {
    const requestId = ++requestIdRef.current;
    setSelectedId(teacherId);
    setEligibility(null);
    try {
      setLoadingProfile(true);
      const res = await accountService.getAccountById(teacherId);
      if (requestIdRef.current !== requestId) return; // đã có lượt chọn mới hơn, bỏ qua
      setProfile(res.data);
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      console.error("Không tải được hồ sơ giáo viên:", error);
      message.error("Không tải được hồ sơ giáo viên.");
    } finally {
      if (requestIdRef.current === requestId) setLoadingProfile(false);
    }

    try {
      setLoadingFeedbacks(true);
      const res = await cohortFeedbackApi.getTeacherDetailsForAdmin(teacherId);
      if (requestIdRef.current !== requestId) return;
      setFeedbacks(unwrap(res.data, []));
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      console.error("Không tải được đánh giá:", error);
    } finally {
      if (requestIdRef.current === requestId) setLoadingFeedbacks(false);
    }
  };

  const handleCheckEligibility = async () => {
    if (!selectedId) return;
    try {
      setCheckingEligibility(true);
      const res = await verificationApi.getL3EligibilityFor(selectedId);
      setEligibility(unwrapOrNull(res.data));
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không kiểm tra được điều kiện L3.");
    } finally {
      setCheckingEligibility(false);
    }
  };

  const handlePromote = async () => {
    if (!selectedId) return;
    try {
      setPromoting(true);
      const res = await verificationApi.promoteTeacherToL3(selectedId);
      if (unwrapOrNull(res.data)?.promoted) {
        message.success("Đã nâng tầng lên L3.");
        loadTeacher(selectedId);
      } else {
        message.warning("Chưa đủ điều kiện lên L3.");
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Nâng tầng thất bại.");
    } finally {
      setPromoting(false);
    }
  };

  const handleSuspendVouchers = async () => {
    if (!selectedId) return;
    try {
      setSuspending(true);
      const res = await verificationApi.suspendTeacherVouchers(selectedId);
      const count = unwrapOrNull(res.data)?.suspendedVoucherIds.length || 0;
      message.success(
        count > 0
          ? `Đã tạm khoá quyền bảo lãnh của ${count} người từng bảo lãnh cho giáo viên này.`
          : "Giáo viên này chưa từng được ai bảo lãnh."
      );
      setSuspendConfirmOpen(false);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setSuspending(false);
    }
  };

  const feedbackColumns = [
    { title: "Rõ ràng", dataIndex: "ratingClarity", key: "ratingClarity", width: 90 },
    { title: "Hữu ích", dataIndex: "ratingHelpfulness", key: "ratingHelpfulness", width: 90 },
    { title: "Nhận xét", dataIndex: "comment", key: "comment", render: (c: string) => c || "—" },
    {
      title: "Ngày",
      dataIndex: "submittedAt",
      key: "submittedAt",
      width: 140,
      render: (v: string) => new Date(v).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <Text className="block text-2xl font-bold">
          <SafetyCertificateOutlined className="mr-2 text-blue-500" />
          Hồ sơ tin cậy giáo viên
        </Text>
        <Text type="secondary">
          Kiểm tra/nâng tầng xác minh, tạm khoá quyền bảo lãnh, và xem chi tiết đánh giá học viên
          của một giáo viên bất kỳ.
        </Text>
      </div>

      <Select
        showSearch
        style={{ width: "100%", maxWidth: 480 }}
        placeholder="Chọn giáo viên..."
        value={selectedId}
        onFocus={ensureTeacherOptions}
        onChange={loadTeacher}
        filterOption={(input, option) =>
          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }
        options={teacherOptions.map((t) => ({ value: t.id, label: t.label }))}
      />

      {!profile && !loadingProfile && (
        <Empty description="Chọn một giáo viên để xem hồ sơ tin cậy." />
      )}

      {profile && (
        <Card loading={loadingProfile} className="rounded-2xl border border-gray-100 shadow-sm">
          <Descriptions
            title={profile.fullName}
            column={2}
            size="small"
            items={[
              { key: "email", label: "Email", children: profile.email },
              {
                key: "tier",
                label: "Tầng xác minh",
                children: (
                  <Tag color={VERIFICATION_TIER_COLORS[profile.verificationTier || "L1"]}>
                    {VERIFICATION_TIER_LABELS[profile.verificationTier || "L1"]}
                  </Tag>
                ),
              },
              {
                key: "reliability",
                label: "Độ tin cậy",
                children: `${profile.reliabilityScore ?? 100}/100`,
              },
              {
                key: "pool",
                label: "Trạng thái pool",
                children: (
                  <Tag
                    color={
                      (profile.poolStatus || "ACTIVE") === "ACTIVE"
                        ? "success"
                        : profile.poolStatus === "LOCKED"
                          ? "warning"
                          : "error"
                    }
                  >
                    {profile.poolStatus || "ACTIVE"}
                  </Tag>
                ),
              },
              { key: "vouchLimit", label: "Hạn mức bảo lãnh", children: profile.vouchLimit ?? 2 },
              {
                key: "vouchedByCount",
                label: "Đã được bảo lãnh bởi",
                children: `${profile.vouchedBy?.length ?? 0} người`,
              },
            ]}
          />

          <div className="mt-6">
            <Text strong>Xác minh L3</Text>
            <div className="mt-2">
              <Space>
                <Button loading={checkingEligibility} onClick={handleCheckEligibility}>
                  Kiểm tra điều kiện L3
                </Button>
                {eligibility?.eligible && profile.verificationTier !== "L3" && (
                  <Button type="primary" loading={promoting} onClick={handlePromote}>
                    Nâng lên L3
                  </Button>
                )}
              </Space>
              {eligibility && (
                <List
                  className="mt-3 max-w-lg"
                  size="small"
                  dataSource={[
                    {
                      ok: eligibility.completedCommunityCohorts >= eligibility.requiredCohorts,
                      label: `Hoàn thành ${eligibility.completedCommunityCohorts}/${eligibility.requiredCohorts} cohort COMMUNITY`,
                    },
                    { ok: eligibility.notRemovedFromPool, label: "Chưa từng bị gỡ khỏi hệ thống" },
                    {
                      ok: eligibility.hasAtLeastOneVoucher,
                      label: "Đã được ít nhất 1 người bảo lãnh",
                    },
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      {item.ok ? (
                        <CheckCircleFilled style={{ color: "#52c41a", marginRight: 8 }} />
                      ) : (
                        <CloseCircleFilled style={{ color: "#bfbfbf", marginRight: 8 }} />
                      )}
                      <Text type={item.ok ? undefined : "secondary"}>{item.label}</Text>
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>

          <div className="mt-6">
            <Text strong>Bảo lãnh (BR-24)</Text>
            <Paragraph type="secondary" style={{ fontSize: 13 }} className="!mt-1">
              Nếu giáo viên này vừa gây sự cố nghiêm trọng, tạm khoá quyền bảo lãnh THÊM AI của
              những người đã từng bảo lãnh cho họ trong 3 tháng (không ảnh hưởng độ tin cậy hay hạn
              mức hiện có của người bảo lãnh).
            </Paragraph>
            <Button danger onClick={() => setSuspendConfirmOpen(true)}>
              Tạm khoá quyền bảo lãnh của người liên quan
            </Button>
          </div>

          <div className="mt-6">
            <Text strong>Đánh giá từ học viên (đầy đủ, chỉ Admin xem)</Text>
            {feedbacks.length === 0 && !loadingFeedbacks ? (
              <Alert
                className="mt-2"
                type="info"
                showIcon
                message="Chưa có đánh giá nào cho giáo viên này."
              />
            ) : (
              <Table
                className="mt-2"
                size="small"
                rowKey="_id"
                columns={feedbackColumns}
                dataSource={feedbacks}
                loading={loadingFeedbacks}
                pagination={{ pageSize: 5 }}
              />
            )}
          </div>
        </Card>
      )}

      <Modal
        title="Xác nhận tạm khoá quyền bảo lãnh"
        open={suspendConfirmOpen}
        onCancel={() => setSuspendConfirmOpen(false)}
        onOk={handleSuspendVouchers}
        confirmLoading={suspending}
        okText="Xác nhận tạm khoá"
        okButtonProps={{ danger: true }}
        cancelText="Huỷ"
      >
        <Paragraph>
          Mọi người đã từng bảo lãnh cho <Text strong>{profile?.fullName}</Text> sẽ tạm mất quyền
          bảo lãnh thêm ai trong 3 tháng. Hành động này không thể hoàn tác thủ công.
        </Paragraph>
      </Modal>
    </div>
  );
};

export default TeacherTrustPage;
