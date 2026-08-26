import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Select,
  Card,
  Tag,
  Descriptions,
  Button,
  Space,
  Input,
  message,
  Alert,
  List,
  Typography,
  Modal,
  Empty,
} from "antd";
import { cohortMechanismApi } from "../../../api/cohortMechanismApi";
import { classService } from "../../class/classService";
import { unwrap, unwrapOrNull } from "../../../api/unwrap";
import {
  ALLOWED_TRANSITIONS,
  COMMITMENT_REASON_LABELS,
  COMMITMENT_STATUS_COLORS,
  COMMITMENT_STATUS_LABELS,
  type ClassCommitmentInfo,
  type CommitmentStatus,
  type ReadinessResult,
} from "../cohortMechanism.types";

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

const populatedName = (v: ClassCommitmentInfo["teacherId"]) =>
  v && typeof v === "object" ? v.fullName : v ? "—" : "Chưa có";

// Bảng điều khiển cam kết + dạy đôi cho MỘT lớp — EduSpace mechanism design Phần A. Admin tìm
// lớp bằng tên/mã, sau đó xem trạng thái hiện tại và thực hiện các hành động Backend đã hỗ trợ.
export const CommitmentManagerTab: React.FC = () => {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<ClassCommitmentInfo | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // BUG ĐÃ SỬA: chọn nhanh lớp A rồi B trước khi response của A về có thể khiến response A
  // (đến sau do mạng không đảm bảo thứ tự) ghi đè state, hiện chi tiết lớp A dưới Select đang
  // chọn B — Admin có thể chuyển trạng thái cam kết/gán dự bị nhầm lớp. requestIdRef đánh dấu
  // lượt chọn mới nhất, mọi response chỉ áp dụng nếu vẫn đúng lượt khi resolve xong.
  const requestIdRef = useRef(0);

  const [toStatus, setToStatus] = useState<CommitmentStatus | undefined>();
  const [reason, setReason] = useState<string | undefined>();
  const [note, setNote] = useState("");
  const [transitioning, setTransitioning] = useState(false);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [checkingReadiness, setCheckingReadiness] = useState(false);

  const [teacherOptions, setTeacherOptions] = useState<{ id: string; label: string }[]>([]);
  const [backupTeacherId, setBackupTeacherId] = useState<string | undefined>();
  const [assigningBackup, setAssigningBackup] = useState(false);
  const [activateOpen, setActivateOpen] = useState(false);
  const [activateReason, setActivateReason] = useState<string | undefined>();
  const [activating, setActivating] = useState(false);

  // Huỷ debounce đang chờ khi component unmount — tránh setOptions() trên component đã gỡ
  // (không hỏng gì ở React 18 nhưng gây warning dev không cần thiết, dọn cho sạch).
  useEffect(() => {
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, []);

  const handleSearch = (value: string) => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setOptions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      try {
        setSearching(true);
        const res = await cohortMechanismApi.searchClasses(value.trim());
        const list = unwrap(res.data, []);
        setOptions(list.map((c) => ({ value: c._id, label: `${c.name} (${c.code || "—"})` })));
      } catch (error) {
        console.error("Tìm lớp thất bại:", error);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const loadClassDetail = async (classId: string) => {
    const requestId = ++requestIdRef.current;
    try {
      setLoadingDetail(true);
      setReadiness(null);
      setToStatus(undefined);
      setReason(undefined);
      setNote("");
      const res = await cohortMechanismApi.getClassById(classId);
      if (requestIdRef.current !== requestId) return; // đã có lượt chọn mới hơn, bỏ qua
      const detail = unwrapOrNull(res.data);
      setSelected(detail);
      if (!teacherOptions.length) {
        const teachers = await classService.getTeacherOptions();
        if (requestIdRef.current !== requestId) return;
        setTeacherOptions(teachers);
      }
    } catch (error) {
      if (requestIdRef.current !== requestId) return;
      console.error("Không tải được chi tiết lớp:", error);
      message.error("Không tải được chi tiết lớp học.");
    } finally {
      if (requestIdRef.current === requestId) setLoadingDetail(false);
    }
  };

  const allowedNext = useMemo(
    () => (selected ? ALLOWED_TRANSITIONS[selected.commitmentStatus] || [] : []),
    [selected]
  );

  const handleCheckReadiness = async () => {
    if (!selected) return;
    try {
      setCheckingReadiness(true);
      const res = await cohortMechanismApi.getReadiness(selected._id);
      setReadiness(unwrapOrNull(res.data));
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Không kiểm tra được học liệu.");
    } finally {
      setCheckingReadiness(false);
    }
  };

  const handleTransition = async () => {
    if (!selected || !toStatus) {
      message.warning("Vui lòng chọn trạng thái muốn chuyển tới.");
      return;
    }
    // BUG ĐÃ SỬA: label từng ghi "(tuỳ chọn)" nhưng backend luôn bắt buộc reason
    // (transitionCommitment ném ValidationError nếu thiếu) — Admin để trống sẽ luôn bị từ chối
    // mà không hiểu vì sao. Chặn sớm ở đây thay vì để round-trip API rồi mới báo lỗi chung chung.
    if (!reason) {
      message.warning("Vui lòng chọn lý do — bắt buộc cho mọi lần chuyển trạng thái cam kết.");
      return;
    }
    try {
      setTransitioning(true);
      const res = await cohortMechanismApi.transitionCommitment(selected._id, {
        toStatus,
        reason,
        note: note.trim() || undefined,
      });
      const updated = unwrapOrNull(res.data);
      if (updated) setSelected(updated);
      message.success(`Đã chuyển cam kết sang "${COMMITMENT_STATUS_LABELS[toStatus]}".`);
      setToStatus(undefined);
      setReason(undefined);
      setNote("");
      setReadiness(null);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Chuyển trạng thái thất bại.");
    } finally {
      setTransitioning(false);
    }
  };

  const handleAssignBackup = async () => {
    if (!selected || !backupTeacherId) {
      message.warning("Vui lòng chọn giáo viên dự bị.");
      return;
    }
    try {
      setAssigningBackup(true);
      const res = await cohortMechanismApi.assignBackupTeacher(selected._id, backupTeacherId);
      const updated = unwrapOrNull(res.data);
      if (updated) setSelected(updated);
      message.success("Đã gán giáo viên dự bị.");
      setBackupTeacherId(undefined);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Gán dự bị thất bại.");
    } finally {
      setAssigningBackup(false);
    }
  };

  const handleActivateBackup = async () => {
    if (!selected) return;
    try {
      setActivating(true);
      await cohortMechanismApi.activateBackupTeacher(selected._id, activateReason);
      message.success("Đã kích hoạt giáo viên dự bị lên vai chính.");
      setActivateOpen(false);
      setActivateReason(undefined);
      loadClassDetail(selected._id);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Kích hoạt dự bị thất bại.");
    } finally {
      setActivating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Select
        showSearch
        allowClear
        style={{ width: "100%", maxWidth: 480 }}
        placeholder="Tìm lớp học theo tên hoặc mã lớp..."
        filterOption={false}
        loading={searching}
        options={options}
        onSearch={handleSearch}
        onSelect={(value) => loadClassDetail(value as string)}
        onClear={() => setSelected(null)}
        notFoundContent={searching ? "Đang tìm..." : "Gõ để tìm lớp"}
      />

      {!selected && !loadingDetail && (
        <Empty description="Tìm và chọn một lớp để quản lý cam kết & dạy đôi." />
      )}

      {selected && (
        <Card loading={loadingDetail} className="rounded-2xl border border-gray-100 shadow-sm">
          <Descriptions
            title={selected.name}
            column={2}
            size="small"
            items={[
              {
                key: "status",
                label: "Trạng thái cam kết",
                children: (
                  <Tag color={COMMITMENT_STATUS_COLORS[selected.commitmentStatus]}>
                    {COMMITMENT_STATUS_LABELS[selected.commitmentStatus]}
                  </Tag>
                ),
              },
              {
                key: "sessionCount",
                label: "Số buổi cam kết",
                children: selected.cohortSessionCount ?? "—",
              },
              {
                key: "funding",
                label: "Loại tài trợ",
                children: selected.fundingType || "COMMUNITY",
              },
              {
                key: "teacher",
                label: "Giáo viên chính",
                children: populatedName(selected.teacherId),
              },
              {
                key: "backup",
                label: "Giáo viên dự bị",
                children: populatedName(selected.backupTeacherId),
              },
            ]}
          />

          <div className="mt-6">
            <Text strong>Chuyển trạng thái cam kết</Text>
            {allowedNext.length === 0 ? (
              <Alert
                className="mt-2"
                type="info"
                showIcon
                message="Đây là trạng thái cuối — không thể chuyển tiếp."
              />
            ) : (
              <div className="mt-2 flex flex-col gap-2 max-w-lg">
                <Select
                  placeholder="Chuyển tới trạng thái..."
                  value={toStatus}
                  onChange={(v) => {
                    setToStatus(v);
                    setReadiness(null);
                  }}
                  options={allowedNext.map((s) => ({
                    value: s,
                    label: COMMITMENT_STATUS_LABELS[s],
                  }))}
                />
                <Select
                  placeholder="Lý do (bắt buộc)"
                  status={!reason ? "warning" : undefined}
                  allowClear
                  value={reason}
                  onChange={setReason}
                  options={Object.entries(COMMITMENT_REASON_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
                <TextArea
                  rows={2}
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />

                {toStatus === "CONFIRMED" && (
                  <div>
                    <Button size="small" loading={checkingReadiness} onClick={handleCheckReadiness}>
                      Kiểm tra học liệu trước khi chốt
                    </Button>
                    {readiness && (
                      <Alert
                        className="mt-2"
                        type={readiness.ready ? "success" : "warning"}
                        showIcon
                        message={`Đủ điều kiện: ${readiness.ready ? "CÓ" : "CHƯA"} (${readiness.readyLessonCount}/${readiness.sessionCount} buổi sẵn sàng)`}
                        description={
                          readiness.ready ? undefined : (
                            <List
                              size="small"
                              dataSource={readiness.details.filter((d) => !d.ready)}
                              renderItem={(d) => (
                                <List.Item>
                                  <Space direction="vertical" size={0}>
                                    <Text strong>{d.title}</Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      Thiếu: {d.missingParts.join(", ")}
                                    </Text>
                                  </Space>
                                </List.Item>
                              )}
                            />
                          )
                        }
                      />
                    )}
                  </div>
                )}

                <Button type="primary" loading={transitioning} onClick={handleTransition}>
                  Xác nhận chuyển trạng thái
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Text strong>Giáo viên dự bị (dạy đôi)</Text>
            <div className="mt-2 flex flex-col gap-2 max-w-lg">
              {!selected.backupTeacherId ? (
                <Space.Compact style={{ width: "100%" }}>
                  <Select
                    showSearch
                    style={{ width: "100%" }}
                    placeholder="Chọn giáo viên làm dự bị..."
                    value={backupTeacherId}
                    onChange={setBackupTeacherId}
                    filterOption={(input, option) =>
                      (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                    }
                    options={teacherOptions
                      .filter((t) => {
                        const currentTeacherId =
                          typeof selected.teacherId === "object"
                            ? selected.teacherId?._id
                            : selected.teacherId;
                        return t.id !== currentTeacherId;
                      })
                      .map((t) => ({ value: t.id, label: t.label }))}
                  />
                  <Button loading={assigningBackup} onClick={handleAssignBackup}>
                    Gán dự bị
                  </Button>
                </Space.Compact>
              ) : (
                <Button danger onClick={() => setActivateOpen(true)}>
                  Kích hoạt dự bị lên vai chính
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      <Modal
        title="Kích hoạt giáo viên dự bị lên vai chính"
        open={activateOpen}
        onCancel={() => setActivateOpen(false)}
        onOk={handleActivateBackup}
        confirmLoading={activating}
        okText="Xác nhận kích hoạt"
        cancelText="Huỷ"
      >
        <Paragraph type="secondary">
          Giáo viên dự bị sẽ trở thành giáo viên chính của lớp này ngay lập tức.
        </Paragraph>
        <Select
          style={{ width: "100%" }}
          placeholder="Lý do kích hoạt"
          value={activateReason}
          onChange={setActivateReason}
          options={[
            {
              value: "CANCELLED_WITH_NOTICE",
              label: COMMITMENT_REASON_LABELS.CANCELLED_WITH_NOTICE,
            },
            {
              value: "ESCALATION_TERMINATED",
              label: COMMITMENT_REASON_LABELS.ESCALATION_TERMINATED,
            },
            { value: "NO_SHOW", label: COMMITMENT_REASON_LABELS.NO_SHOW },
          ]}
        />
      </Modal>
    </div>
  );
};

export default CommitmentManagerTab;
