import React, { useEffect, useState } from "react";
import {
  Card,
  Tag,
  Statistic,
  Row,
  Col,
  Typography,
  Skeleton,
  Alert,
  List,
  Select,
  Button,
  message,
} from "antd";
import {
  SafetyCertificateOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  TeamOutlined,
} from "@ant-design/icons";
import { verificationApi } from "../../../api/verificationApi";
import { unwrap, unwrapOrNull } from "../../../api/unwrap";
import {
  VERIFICATION_TIER_COLORS,
  VERIFICATION_TIER_LABELS,
  type CoTaughtColleague,
  type MyVerificationStatus,
} from "../verification.types";

const { Title, Text, Paragraph } = Typography;

// Trạng thái xác minh 3 tầng + bảo lãnh chéo của CHÍNH giáo viên đang đăng nhập — EduSpace
// mechanism design Phần C.1/C.2. L1 tự động khi đăng ký, L2 do Admin duyệt thủ công (không có
// hành động nào ở đây cho L2 — đó là việc của Admin), L3 tự động khi đủ điều kiện đo được.
export const VerificationStatusPage: React.FC = () => {
  const [status, setStatus] = useState<MyVerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [colleagues, setColleagues] = useState<CoTaughtColleague[]>([]);
  const [loadingColleagues, setLoadingColleagues] = useState(false);
  const [selectedColleague, setSelectedColleague] = useState<string | undefined>();
  const [vouching, setVouching] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await verificationApi.getMyStatus();
      setStatus(unwrapOrNull(res.data));
    } catch (error) {
      console.error("Không tải được trạng thái xác minh:", error);
      message.error("Không tải được trạng thái xác minh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  useEffect(() => {
    if (status?.verificationTier === "L3" && colleagues.length === 0) {
      (async () => {
        try {
          setLoadingColleagues(true);
          const res = await verificationApi.getMyCoTaughtColleagues();
          setColleagues(unwrap(res.data, []));
        } catch (error) {
          console.error("Không tải được danh sách đồng nghiệp:", error);
        } finally {
          setLoadingColleagues(false);
        }
      })();
    }
  }, [status?.verificationTier]);

  const handleVouch = async () => {
    if (!selectedColleague) {
      message.warning("Vui lòng chọn đồng nghiệp muốn bảo lãnh.");
      return;
    }
    try {
      setVouching(true);
      await verificationApi.vouchForTeacher(selectedColleague);
      message.success("Đã bảo lãnh thành công.");
      setSelectedColleague(undefined);
      loadStatus();
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Bảo lãnh thất bại.");
    } finally {
      setVouching(false);
    }
  };

  const isVouchSuspended =
    !!status?.vouchSuspendedUntil && new Date(status.vouchSuspendedUntil) > new Date();

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen space-y-6">
      <div>
        <Title level={3} className="!mb-1">
          <SafetyCertificateOutlined className="mr-2 text-blue-500" />
          Xác minh & Độ tin cậy
        </Title>
        <Text type="secondary">
          Tầng xác minh quyết định loại lớp bạn được nhận. Độ tin cậy chỉ đo việc giữ cam kết (có
          tới lớp đúng hẹn không), không đo chất lượng giảng dạy.
        </Text>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-sm max-w-3xl" variant="borderless">
        {loading || !status ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
          <>
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} sm={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Tầng xác minh
                </Text>
                <div className="mt-1">
                  <Tag
                    color={VERIFICATION_TIER_COLORS[status.verificationTier]}
                    style={{ fontSize: 13, padding: "4px 10px" }}
                  >
                    {VERIFICATION_TIER_LABELS[status.verificationTier]}
                  </Tag>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <Statistic title="Độ tin cậy" value={status.reliabilityScore} suffix="/ 100" />
              </Col>
              <Col xs={24} sm={8}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Trạng thái nhận cohort mới
                </Text>
                <div className="mt-1">
                  <Tag
                    color={
                      status.poolStatus === "ACTIVE"
                        ? "success"
                        : status.poolStatus === "LOCKED"
                          ? "warning"
                          : "error"
                    }
                  >
                    {status.poolStatus === "ACTIVE"
                      ? "Đang mở"
                      : status.poolStatus === "LOCKED"
                        ? `Tạm khoá${status.poolLockedUntil ? ` tới ${new Date(status.poolLockedUntil).toLocaleDateString("vi-VN")}` : ""}`
                        : "Đã gỡ khỏi hệ thống"}
                  </Tag>
                </div>
              </Col>
            </Row>

            {status.verificationTier !== "L3" && status.l3Eligibility && (
              <div className="mt-6">
                <Text strong>Điều kiện lên L3</Text>
                <List
                  className="mt-2"
                  size="small"
                  dataSource={[
                    {
                      ok:
                        status.l3Eligibility.completedCommunityCohorts >=
                        status.l3Eligibility.requiredCohorts,
                      label: `Hoàn thành ${status.l3Eligibility.completedCommunityCohorts}/${status.l3Eligibility.requiredCohorts} cohort COMMUNITY`,
                    },
                    {
                      ok: status.l3Eligibility.notRemovedFromPool,
                      label: "Chưa từng bị gỡ khỏi hệ thống (poolStatus ≠ REMOVED)",
                    },
                    {
                      ok: status.l3Eligibility.hasAtLeastOneVoucher,
                      label: "Đã được ít nhất 1 giáo viên L3 khác bảo lãnh",
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
              </div>
            )}

            {status.verificationTier === "L3" && (
              <div className="mt-6">
                <Text strong>Bảo lãnh đồng nghiệp lên L3</Text>
                <Paragraph type="secondary" style={{ fontSize: 13 }} className="!mt-1">
                  Chỉ có thể bảo lãnh đồng nghiệp đã từng đồng dạy/dự bị chung ít nhất 1 lớp với
                  bạn. Hạn mức còn lại: <Text strong>{status.vouchLimit}</Text>.
                </Paragraph>

                {isVouchSuspended && (
                  <Alert
                    type="warning"
                    showIcon
                    message={`Quyền bảo lãnh đang tạm khoá tới ${new Date(status.vouchSuspendedUntil as string).toLocaleDateString("vi-VN")}`}
                    className="mb-3"
                  />
                )}

                {!isVouchSuspended && status.vouchLimit <= 0 && (
                  <Alert
                    type="info"
                    showIcon
                    message="Đã dùng hết hạn mức bảo lãnh đồng thời."
                    className="mb-3"
                  />
                )}

                {!isVouchSuspended && status.vouchLimit > 0 && (
                  <div className="flex gap-2 max-w-lg">
                    <Select
                      style={{ width: "100%" }}
                      placeholder="Chọn đồng nghiệp đã từng đồng dạy chung..."
                      loading={loadingColleagues}
                      value={selectedColleague}
                      onChange={setSelectedColleague}
                      options={colleagues.map((c) => ({ value: c.id, label: c.fullName }))}
                      notFoundContent={
                        loadingColleagues ? "Đang tải..." : "Chưa từng đồng dạy/dự bị chung với ai"
                      }
                    />
                    <Button
                      type="primary"
                      icon={<TeamOutlined />}
                      loading={vouching}
                      onClick={handleVouch}
                    >
                      Bảo lãnh
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default VerificationStatusPage;
