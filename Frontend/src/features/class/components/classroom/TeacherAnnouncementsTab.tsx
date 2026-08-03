import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Popconfirm,
  Empty,
  Skeleton,
  Avatar,
  Tooltip,
  Alert,
} from "antd";
import {
  NotificationOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  UserOutlined,
  PaperClipOutlined,
  ReloadOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import announcementApi from "../../../../api/announcementApi";
import type { IAnnouncement } from "../../../../api/announcementApi";
import { toast } from "../../../../utils/toast";
import { TeacherAnnouncementDetailDrawer } from "./TeacherAnnouncementDetailDrawer";
import { CreateAnnouncementModal } from "./CreateAnnouncementModal";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";

const { Title, Text, Paragraph } = Typography;

interface TeacherAnnouncementsTabProps {
  classId: string;
  className?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export const TeacherAnnouncementsTab: React.FC<TeacherAnnouncementsTabProps> = React.memo(
  ({ classId, className = "Lớp học", onRefresh, loading: externalLoading = false }) => {
    const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Toolbar states
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTime, setFilterTime] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Modal & Drawer states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<IAnnouncement | null>(null);
    const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);

    // Fetch announcements for this class
    const fetchAnnouncements = useCallback(async () => {
      if (!classId) return;
      setLoading(true);
      setError(null);
      try {
        const list = await announcementApi.getAnnouncementsByClass(classId, searchQuery);
        setAnnouncements(list || []);
      } catch (err: unknown) {
        console.error("[TeacherAnnouncementsTab] Fetch error:", err);
        setError(getApiErrorMessage(err, "Không thể tải danh sách thông báo của lớp!"));
      } finally {
        setLoading(false);
      }
    }, [classId, searchQuery]);

    useEffect(() => {
      fetchAnnouncements();
    }, [fetchAnnouncements]);

    // Statistics breakdown
    const stats = useMemo(() => {
      const total = announcements.length;
      const now = dayjs();

      const todayCount = announcements.filter(
        (a) => a.createdAt && dayjs(a.createdAt).isSame(now, "day")
      ).length;
      const thisWeekCount = announcements.filter(
        (a) => a.createdAt && dayjs(a.createdAt).isSame(now, "week")
      ).length;
      const thisMonthCount = announcements.filter(
        (a) => a.createdAt && dayjs(a.createdAt).isSame(now, "month")
      ).length;

      return { total, todayCount, thisWeekCount, thisMonthCount };
    }, [announcements]);

    // Filter & Sort announcements
    const filteredAnnouncements = useMemo(() => {
      let result = [...announcements];

      // Time filter
      const now = dayjs();
      if (filterTime === "today") {
        result = result.filter((a) => a.createdAt && dayjs(a.createdAt).isSame(now, "day"));
      } else if (filterTime === "this_week") {
        result = result.filter((a) => a.createdAt && dayjs(a.createdAt).isSame(now, "week"));
      } else if (filterTime === "this_month") {
        result = result.filter((a) => a.createdAt && dayjs(a.createdAt).isSame(now, "month"));
      }

      // Sort
      result.sort((a, b) => {
        if (sortBy === "oldest")
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        if (sortBy === "title") return a.title.localeCompare(b.title);
        // Default: newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      return result;
    }, [announcements, filterTime, sortBy]);

    // Handle delete announcement
    const handleDeleteAnnouncement = async (id: string) => {
      if (!id) return;
      try {
        await announcementApi.deleteAnnouncement(id);
        toast.success("Xóa thông báo thành công!");
        fetchAnnouncements();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi xóa thông báo!"));
      }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1. Header Banner & Quick Statistics */}
        <Card
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, var(--color-action-primary-bg) 0%, var(--color-action-primary-bg-active) 100%)",
            color: "var(--color-surface)",
            boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
          }}
          styles={{ body: { padding: "24px 32px" } }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <Space size={12} align="center">
                <NotificationOutlined style={{ fontSize: 28, color: "var(--color-surface)" }} />
                <Title level={4} style={{ color: "var(--color-surface)", margin: 0, fontWeight: 700 }}>
                  Thông báo Lớp học: {className}
                </Title>
              </Space>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  display: "block",
                  marginTop: 4,
                  fontSize: 13,
                }}
              >
                Đăng tin tức, thông báo đổi lịch học, dặn dò bài tập đến toàn bộ học sinh trong lớp.
              </Text>
            </div>

            <Button
              type="default"
              icon={<ReloadOutlined spin={loading} />}
              onClick={fetchAnnouncements}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.4)",
                color: "var(--color-surface)",
                fontWeight: 600,
              }}
            >
              Làm mới
            </Button>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={6}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      Tổng số thông báo
                    </Text>
                  }
                  value={stats.total}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      📢 Hôm nay
                    </Text>
                  }
                  value={stats.todayCount}
                  prefix={<CalendarOutlined style={{ color: "var(--color-border-default)", marginRight: 6 }} />}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      📅 Tuần này
                    </Text>
                  }
                  value={stats.thisWeekCount}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      🗓️ Tháng này
                    </Text>
                  }
                  value={stats.thisMonthCount}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Lỗi nạp thông báo"
            description={error}
            type="error"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={fetchAnnouncements}
              >
                Thử lại
              </Button>
            }
            style={{ borderRadius: 8 }}
          />
        )}

        {/* 2. Main Content: Toolbar & List */}
        <Card
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <Space size={12} wrap>
                <Input
                  placeholder="Tìm thông báo theo tiêu đề/nội dung..."
                  prefix={<SearchOutlined style={{ color: "var(--color-text-disabled)" }} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 260, borderRadius: 8 }}
                  allowClear
                />

                <Select
                  value={filterTime}
                  onChange={(val) => setFilterTime(val)}
                  style={{ width: 160 }}
                  suffixIcon={<FilterOutlined />}
                  options={[
                    { value: "all", label: "Tất cả mốc thời gian" },
                    { value: "today", label: "📢 Trong hôm nay" },
                    { value: "this_week", label: "📅 Trong tuần này" },
                    { value: "this_month", label: "🗓️ Trong tháng này" },
                  ]}
                />

                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  style={{ width: 140 }}
                  options={[
                    { value: "newest", label: "Mới nhất" },
                    { value: "oldest", label: "Cũ nhất" },
                    { value: "title", label: "Tiêu đề A -> Z" },
                  ]}
                />
              </Space>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setIsCreateModalOpen(true);
                }}
                style={{ fontWeight: 600, borderRadius: 8 }}
              >
                Tạo thông báo mới
              </Button>
            </div>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 20 } }}
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : filteredAnnouncements.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={filteredAnnouncements}
              renderItem={(item) => {
                const creatorObj = typeof item.createdBy === "object" ? item.createdBy : null;
                const creatorName = creatorObj?.fullName || "Giảng viên";

                return (
                  <Card
                    key={item._id}
                    hoverable
                    style={{ marginBottom: 16, borderRadius: 12, border: "1px solid var(--color-border-default)" }}
                    styles={{ body: { padding: 20 } }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div>
                        <Title level={5} style={{ margin: 0, fontSize: 16, color: "var(--color-text-title)" }}>
                          {item.title}
                        </Title>

                        <Space size={12} style={{ marginTop: 4, fontSize: 12, color: "var(--color-text-description)" }}>
                          <Space size={6}>
                            <Avatar
                              size="small"
                              src={creatorObj?.avatar || undefined}
                              icon={!creatorObj?.avatar ? <UserOutlined /> : undefined}
                              style={{ backgroundColor: "var(--color-action-primary-bg)" }}
                            />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {creatorName}
                            </Text>
                          </Space>

                          {item.createdAt && (
                            <Space size={4}>
                              <ClockCircleOutlined />
                              <span>{new Date(item.createdAt).toLocaleString("vi-VN")}</span>
                            </Space>
                          )}
                        </Space>
                      </div>

                      <Space size={8}>
                        <Tooltip title="Xem chi tiết">
                          <Button
                            type="default"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              setSelectedAnnouncement(item);
                              setIsDetailDrawerOpen(true);
                            }}
                            style={{ borderRadius: 6 }}
                          >
                            Xem
                          </Button>
                        </Tooltip>

                        <Popconfirm
                          title="Xóa thông báo này?"
                          description="Hành động này sẽ xóa hoàn toàn thông báo khỏi lớp học."
                          onConfirm={() => handleDeleteAnnouncement(item._id)}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <Tooltip title="Xóa thông báo">
                            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      </Space>
                    </div>

                    <Paragraph
                      ellipsis={{ rows: 3 }}
                      style={{ margin: "8px 0 0", color: "var(--color-text-title)", fontSize: 14 }}
                    >
                      {item.content}
                    </Paragraph>

                    {item.attachments && item.attachments.length > 0 && (
                      <Space size={8} style={{ marginTop: 10 }}>
                        {item.attachments.map((att, idx) => (
                          <a
                            key={att.publicId || idx}
                            href={att.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12 }}
                          >
                            <PaperClipOutlined /> {att.name || "File đính kèm"}
                          </a>
                        ))}
                      </Space>
                    )}
                  </Card>
                );
              }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary">
                    {searchQuery || filterTime !== "all"
                      ? "Không tìm thấy thông báo nào phù hợp."
                      : "Lớp học chưa có thông báo nào được đăng."}
                  </Text>
                }
              >
                {!searchQuery && filterTime === "all" && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setIsCreateModalOpen(true);
                    }}
                    style={{ borderRadius: 6 }}
                  >
                    Đăng thông báo đầu tiên
                  </Button>
                )}
              </Empty>
            </div>
          )}
        </Card>

        {/* Modal & Drawer */}
        <TeacherAnnouncementDetailDrawer
          open={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          announcement={selectedAnnouncement}
          className={className}
        />

        <CreateAnnouncementModal
          open={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          classId={classId}
          onSaved={fetchAnnouncements}
        />
      </div>
    );
  }
);

TeacherAnnouncementsTab.displayName = "TeacherAnnouncementsTab";
