import React, { useState } from "react";
import {
  Typography,
  Card,
  Row,
  Col,
  Button,
  Input,
  Select,
  Space,
  Divider,
  Tabs,
  Badge,
  Alert,
  Table,
  Pagination,
  DatePicker,
  Segmented,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SearchOutlined,
  UserOutlined,
  BookOutlined,
  FireOutlined,
  ReloadOutlined,
  PlusOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { palette, tokens as staticTokens } from "../../shared/theme/tokens";
import { StatCard } from "../../shared/components/StatCard";
import { SectionHeader } from "../../shared/components/SectionHeader";
import { EmptyState } from "../../shared/components/EmptyState";
import { StatusBadge, type StatusTone } from "../../shared/components/StatusBadge";
import { ResponsiveTable } from "../../shared/components/table/ResponsiveTable";
import { ThemeToggle } from "../../shared/components/ThemeToggle";
import { useTheme } from "../../shared/context/ThemeContext";

const { Title, Text, Paragraph } = Typography;

export const DesignSystemDemoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("components");
  const [btnLoading, setBtnLoading] = useState(false);
  const { tokens, isDark, prefersReducedMotion } = useTheme();

  // Chặn trên môi trường Production
  if (import.meta.env.PROD) {
    return (
      <div style={{ padding: 48, textAlign: "center" }}>
        <Title level={3}>404 - Trang nội bộ không khả dụng trên môi trường Production</Title>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "32px 48px",
        maxWidth: 1400,
        margin: "0 auto",
        backgroundColor: tokens.color.bg.page,
        minHeight: "100vh",
      }}
    >
      {/* Header Showcase */}
      <div
        style={{
          background: tokens.color.gradient.primary,
          padding: "32px 40px",
          borderRadius: tokens.radius.xl,
          color: "var(--color-surface)",
          marginBottom: tokens.space[6],
          boxShadow: isDark ? "none" : "0 4px 16px rgba(0, 0, 0, 0.08)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Title level={2} style={{ color: "var(--color-surface)", margin: 0, fontWeight: 800 }}>
              🎨 EduSpace Design System Showcase
            </Title>
            <Paragraph style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 16, margin: "8px 0 0 0" }}>
              Single Source of Truth cho Toàn bộ Giao diện: Tokens, Dark Mode, Ant Design Theme & Shared Components
            </Paragraph>
          </div>
          <Space align="center" size={16}>
            <div style={{ background: "rgba(255, 255, 255, 0.2)", padding: "4px 12px", borderRadius: tokens.radius.full }}>
              <ThemeToggle variant="segmented" />
            </div>
            <StatusBadge tone="success" label="Giai đoạn 3B — Dark Mode Sẵn Sàng" />
          </Space>
        </div>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        size="large"
        items={[
          {
            key: "components",
            label: "📦 Component Layer & States",
            children: (
              <Space direction="vertical" size={32} style={{ width: "100%" }}>
                {/* 1. Buttons & Interaction States */}
                <Card
                  title={<Title level={4} style={{ margin: 0 }}>1. Buttons & 5 Trạng Thái Tương Tác</Title>}
                  style={{ borderRadius: tokens.radius.lg }}
                >
                  <Paragraph type="secondary">
                    Kiểm tra 5 trạng thái: <code>default</code>, <code>hover</code> (bậc 600), <code>active</code> (bậc 700),{" "}
                    <code>focus-visible</code> (focus ring rõ nét), <code>disabled</code> (không dùng opacity),{" "}
                    <code>loading</code>.
                  </Paragraph>

                  <Divider orientation={"left" as any}>Biến thể (Variants) & Sizes</Divider>
                  <Space wrap size={16} align="center">
                    <Button type="primary" size="large">Primary Large (48px)</Button>
                    <Button type="primary">Primary Middle (40px)</Button>
                    <Button type="primary" size="small">Primary Small (32px)</Button>
                    <Button type="default">Default Button</Button>
                    <Button type="dashed">Dashed Button</Button>
                    <Button type="primary" danger>Danger Primary</Button>
                    <Button danger>Danger Default</Button>
                    <Button type="link">Link Button</Button>
                    <Button type="text">Text Button</Button>
                  </Space>

                  <Divider orientation={"left" as any}>Trạng thái Tương tác (Interactive States)</Divider>
                  <Space wrap size={16} align="center">
                    <Tooltip title="Bấm Tab để test Focus-visible outline ring">
                      <Button type="primary" icon={<PlusOutlined />}>Bấm Tab để Focus</Button>
                    </Tooltip>
                    <Button
                      type="primary"
                      loading={btnLoading}
                      onClick={() => {
                        setBtnLoading(true);
                        setTimeout(() => setBtnLoading(false), 1500);
                      }}
                      icon={<ReloadOutlined />}
                    >
                      Bấm để thử Loading
                    </Button>
                    <Button type="primary" disabled>Primary Disabled</Button>
                    <Button type="default" disabled>Default Disabled</Button>
                    <Button type="primary" danger disabled>Danger Disabled</Button>
                  </Space>
                </Card>

                {/* 2. Form Inputs & Controls */}
                <Card
                  title={<Title level={4} style={{ margin: 0 }}>2. Form Inputs & Select Controls</Title>}
                  style={{ borderRadius: tokens.radius.lg }}
                >
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={8}>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>Input Chuẩn (40px)</Text>
                      <Input placeholder="Nhập họ và tên..." prefix={<UserOutlined />} allowClear />
                    </Col>
                    <Col xs={24} md={8}>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>Search Input</Text>
                      <Input.Search placeholder="Tìm kiếm tài liệu..." enterButton="Tìm kiếm" />
                    </Col>
                    <Col xs={24} md={8}>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>Select Dropdown</Text>
                      <Select
                        style={{ width: "100%" }}
                        defaultValue="option1"
                        options={[
                          { value: "option1", label: "Toán học nâng cao" },
                          { value: "option2", label: "Vật lý đại cương" },
                          { value: "option3", label: "Trí tuệ nhân tạo (AI)" },
                        ]}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>DatePicker</Text>
                      <DatePicker style={{ width: "100%" }} />
                    </Col>
                    <Col xs={24} md={8}>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>Segmented Control</Text>
                      <Segmented
                        block
                        options={["Tất cả", "Đang học", "Đã xong"]}
                      />
                    </Col>
                    <Col xs={24} md={8}>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>Input Disabled</Text>
                      <Input placeholder="Không thể chỉnh sửa" disabled />
                    </Col>
                  </Row>
                </Card>

                {/* 3. Standard & Shared Cards */}
                <Card
                  title={<Title level={4} style={{ margin: 0 }}>3. Cards: Standard & Accent-Bordered StatCard</Title>}
                  style={{ borderRadius: tokens.radius.lg }}
                >
                  <SectionHeader
                    emoji="📊"
                    title="Chỉ số Thống kê Tổng quan (StatCard Shared Component)"
                    subtitle="Chuẩn thị giác: viền trái 4px màu accent, border-radius 0px triệt tiêu mẩu thừa hai đầu"
                    action={<Button icon={<ReloadOutlined />}>Làm mới</Button>}
                  />

                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <StatCard
                        label="Lớp học phụ trách"
                        value={8}
                        suffix="lớp"
                        icon={<BookOutlined />}
                        accentColor={tokens.color.action.primaryBg}
                        description="2 lớp cần chấm bài"
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <StatCard
                        label="Học sinh hoạt động"
                        value={248}
                        suffix="học viên"
                        icon={<UserOutlined />}
                        accentColor={tokens.color.secondary.icon}
                        badge={<StatusBadge tone="success" label="Tăng 12%" />}
                        description="Trong 7 ngày qua"
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <StatCard
                        label="Bài tập cần duyệt"
                        value={19}
                        suffix="bài"
                        icon={<ClockCircleOutlined />}
                        accentColor={tokens.color.semantic.warning.base}
                        valueColor={tokens.color.semantic.warning.base}
                        description="5 bài nộp muộn"
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <StatCard
                        label="Buổi học Trực tuyến"
                        value="LIVE"
                        icon={<FireOutlined />}
                        accentColor={tokens.color.semantic.error.base}
                        valueColor={tokens.color.semantic.error.base}
                        badge={<StatusBadge tone="danger" label="Đang diễn ra" />}
                        description="Phòng học AI-101"
                      />
                    </Col>
                  </Row>
                </Card>

                {/* 4. StatusBadge & Tag System */}
                <Card
                  title={<Title level={4} style={{ margin: 0 }}>4. StatusBadge: 5 Semantic Tones & Domain Mapping</Title>}
                  style={{ borderRadius: tokens.radius.lg }}
                >
                  <Paragraph type="secondary">
                    Đảm bảo 100% tương phản WCAG AA (tối thiểu 4.5:1). Nghiêm cấm truyền hex tự do.
                  </Paragraph>

                  <Divider orientation={"left" as any}>5 Semantic Tones Chuẩn</Divider>
                  <Space wrap size={16}>
                    <StatusBadge tone="success" label="Success Tone (Hoàn thành)" />
                    <StatusBadge tone="warning" label="Warning Tone (Sắp đến hạn)" />
                    <StatusBadge tone="danger" label="Danger Tone (Quá hạn / LIVE)" />
                    <StatusBadge tone="info" label="Info Tone (Đang diễn ra / Lớp học)" />
                    <StatusBadge tone="neutral" label="Neutral Tone (Đã kết thúc / Lưu trữ)" />
                  </Space>

                  <Divider orientation={"left" as any}>Domain Status Mapping Tự Động</Divider>
                  <Space wrap size={12}>
                    <StatusBadge status="Đang học" />
                    <StatusBadge status="Đang hoạt động" />
                    <StatusBadge status="Đã nộp" />
                    <StatusBadge status="Sắp hết hạn" />
                    <StatusBadge status="Tạm dừng" />
                    <StatusBadge status="Quá hạn" />
                    <StatusBadge status="LIVE" />
                    <StatusBadge status="Đang diễn ra" />
                    <StatusBadge status="Đã kết thúc" />
                    <StatusBadge status="Lưu trữ" />
                  </Space>
                </Card>

                {/* 5. EmptyState Showroom */}
                <Card
                  title={<Title level={4} style={{ margin: 0 }}>5. EmptyState Dùng Chung</Title>}
                  style={{ borderRadius: tokens.radius.lg }}
                >
                  <Row gutter={[24, 24]}>
                    <Col xs={24} md={12}>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>EmptyState Mặc định</Text>
                      <EmptyState
                        title="Chưa có bài tập nào"
                        description="Hiện tại không có bài tập nào cần hoàn thành trong tuần này."
                      />
                    </Col>
                    <Col xs={24} md={12}>
                      <Text strong style={{ display: "block", marginBottom: 8 }}>EmptyState Kèm Action Button</Text>
                      <EmptyState
                        title="Không tìm thấy kết quả"
                        description="Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc."
                        actionText="Đặt lại bộ lọc"
                        onAction={() => alert("Action triggered")}
                      />
                    </Col>
                  </Row>
                </Card>

                {/* 6. Table & Feedback Elements */}
                <Card
                  title={<Title level={4} style={{ margin: 0 }}>6. Data Table, Alerts & Pagination</Title>}
                  style={{ borderRadius: tokens.radius.lg }}
                >
                  <Space direction="vertical" size={16} style={{ width: "100%" }}>
                    <Alert
                      message="Thông báo hệ thống"
                      description="Hệ thống đã đồng bộ toàn bộ bảng màu, components và 6-tier breakpoints theo Design System Giai đoạn 3A."
                      type="info"
                      showIcon
                    />

                    <ResponsiveTable
                      dataSource={[
                        { key: "1", name: "Nguyễn Văn A", class: "Toán 12A1", status: "Đang học", score: 9.5 },
                        { key: "2", name: "Trần Thị B", class: "Vật lý 12B2", status: "Sắp hết hạn", score: 8.0 },
                        { key: "3", name: "Lê Hoàng C", class: "Hóa học 11A3", status: "Quá hạn", score: 6.5 },
                        { key: "4", name: "Phạm Minh D", class: "Tin học 10C1", status: "Đã hoàn thành", score: 10.0 },
                      ]}
                      columns={[
                        { title: "Học viên", dataIndex: "name", key: "name" },
                        { title: "Lớp học", dataIndex: "class", key: "class" },
                        {
                          title: "Trạng thái",
                          dataIndex: "status",
                          key: "status",
                          render: (st) => <StatusBadge status={st} />,
                        },
                        { title: "Điểm số", dataIndex: "score", key: "score", render: (s) => <strong>{s}</strong> },
                        {
                          title: "Thao tác",
                          key: "action",
                          render: () => (
                            <Space size={8}>
                              <Button type="link" size="small" icon={<EyeOutlined />}>Chi tiết</Button>
                            </Space>
                          ),
                        },
                      ]}
                      pagination={false}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                      <Pagination total={50} defaultCurrent={1} showSizeChanger />
                    </div>
                  </Space>
                </Card>
              </Space>
            ),
          },
          {
            key: "tokens",
            label: "🎨 Tokens Reference (Color, Radius, Spacing)",
            children: (
              <Space direction="vertical" size={32} style={{ width: "100%" }}>
                {/* Color Swatches */}
                <Card title={<Title level={4} style={{ margin: 0 }}>Bảng Màu Brand & Palette Thô</Title>}>
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card style={{ backgroundColor: palette.blue[500], color: "var(--color-surface)", borderRadius: 8 }}>
                        <Title level={5} style={{ color: "var(--color-surface)", margin: 0 }}>Primary Blue</Title>
                        <Text style={{ color: "rgba(255,255,255,0.85)" }}>#2D8CDB (500 Base)</Text>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card style={{ backgroundColor: palette.purple[500], color: "var(--color-surface)", borderRadius: 8 }}>
                        <Title level={5} style={{ color: "var(--color-surface)", margin: 0 }}>Secondary Purple</Title>
                        <Text style={{ color: "rgba(255,255,255,0.85)" }}>#7A6FF0 (500 Base)</Text>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card style={{ backgroundColor: palette.pink[500], color: "var(--color-surface)", borderRadius: 8 }}>
                        <Title level={5} style={{ color: "var(--color-surface)", margin: 0 }}>Accent Pink</Title>
                        <Text style={{ color: "rgba(255,255,255,0.85)" }}>#E85BAA (500 Base)</Text>
                      </Card>
                    </Col>
                  </Row>
                </Card>

                {/* Radius Scale */}
                <Card title={<Title level={4} style={{ margin: 0 }}>Thang Bo Góc (Radius Scale — 6 Bậc)</Title>}>
                  <Row gutter={[16, 16]}>
                    {[
                      { name: "radius.none", val: "0px", r: tokens.radius.none },
                      { name: "radius.sm", val: "4px", r: tokens.radius.sm },
                      { name: "radius.md", val: "8px", r: tokens.radius.md },
                      { name: "radius.lg", val: "12px", r: tokens.radius.lg },
                      { name: "radius.xl", val: "16px", r: tokens.radius.xl },
                      { name: "radius.full", val: "9999px", r: tokens.radius.full },
                    ].map((item) => (
                      <Col xs={12} sm={8} md={4} key={item.name}>
                        <div
                          style={{
                            height: 80,
                            backgroundColor: palette.blue[100],
                            border: `2px solid ${palette.blue[500]}`,
                            borderRadius: item.r,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: 8,
                            textAlign: "center",
                          }}
                        >
                          <Text strong style={{ fontSize: 13, color: palette.blue[700] }}>{item.name}</Text>
                          <Text style={{ fontSize: 11, color: palette.blue[600] }}>{item.val}</Text>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>

                {/* Spacing Scale */}
                <Card title={<Title level={4} style={{ margin: 0 }}>Thang Khoảng Cách (Spacing Scale — 8 Bậc)</Title>}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[
                      { name: "space[1]", px: tokens.space[1] },
                      { name: "space[2]", px: tokens.space[2] },
                      { name: "space[3]", px: tokens.space[3] },
                      { name: "space[4]", px: tokens.space[4] },
                      { name: "space[5]", px: tokens.space[5] },
                      { name: "space[6]", px: tokens.space[6] },
                      { name: "space[7]", px: tokens.space[7] },
                      { name: "space[8]", px: tokens.space[8] },
                    ].map((s) => (
                      <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <Text strong style={{ width: 90 }}>{s.name} ({s.px}px):</Text>
                        <div
                          style={{
                            height: 20,
                            width: s.px * 4,
                            backgroundColor: palette.purple[500],
                            borderRadius: tokens.radius.sm,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </Card>
              </Space>
            ),
          },
          {
            key: "motion",
            label: "4. Chuyển động (Motion & Animation)",
            children: (
              <Space direction="vertical" size={24} style={{ width: "100%" }}>
                {/* Motion Status Banner */}
                <Alert
                  type={prefersReducedMotion ? "warning" : "info"}
                  showIcon
                  message={
                    <Text strong>
                      Trạng thái Prefers-Reduced-Motion Hệ Điều Hành:{" "}
                      <Badge
                        status={prefersReducedMotion ? "warning" : "processing"}
                        text={prefersReducedMotion ? "ĐANG BẬT (Tự động tắt chuyển động)" : "TẮT (Chuyển động mượt mà 60fps)"}
                      />
                    </Text>
                  }
                  description="Design System tự động đồng bộ cờ prefers-reduced-motion của OS để hỗ trợ tối đa người dùng nhạy cảm tiền đình theo chuẩn WCAG 2.2.3."
                />

                {/* Duration Token Matrix */}
                <Card
                  title={<Title level={4} style={{ margin: 0 }}>Thang Thời Lượng (Duration Scale — Trần 400ms)</Title>}
                  style={{ borderRadius: tokens.radius.lg }}
                >
                  <Paragraph type="secondary">
                    Quy tắc: Không chuyển động nào vượt quá 400ms. Chuyển động dài hơn khiến giao diện có cảm giác chậm chạp.
                  </Paragraph>
                  <Row gutter={[16, 16]}>
                    {[
                      { key: "instant", token: "duration.instant", ms: tokens.duration.instant, useCase: "Đổi màu hover, focus ring", fast: true },
                      { key: "fast", token: "duration.fast", ms: tokens.duration.fast, useCase: "Button, input, tag, card hover", fast: true },
                      { key: "normal", token: "duration.normal", ms: tokens.duration.normal, useCase: "Dropdown, tooltip, accordion", fast: false },
                      { key: "slow", token: "duration.slow", ms: tokens.duration.slow, useCase: "Modal zoom, drawer slide, sidebar", fast: false },
                      { key: "slower", token: "duration.slower", ms: tokens.duration.slower, useCase: "Page transition, data visualization", fast: false },
                    ].map((d) => (
                      <Col xs={24} sm={12} lg={4.8} key={d.key} style={{ flex: 1, minWidth: 200 }}>
                        <div
                          style={{
                            padding: 16,
                            borderRadius: tokens.radius.md,
                            border: `1px solid ${tokens.color.border.default}`,
                            backgroundColor: tokens.color.bg.surface,
                            cursor: "pointer",
                            transition: `all ${d.ms} var(--ease-out)`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 8px 20px rgba(45, 140, 219, 0.15)";
                            e.currentTarget.style.borderColor = tokens.color.action.primaryBg;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = tokens.color.border.default;
                          }}
                        >
                          <Text strong style={{ display: "block", fontSize: 14 }}>{d.token}</Text>
                          <Title level={3} style={{ margin: "4px 0", color: tokens.color.action.primaryBg }}>{d.ms}</Title>
                          <Text type="secondary" style={{ fontSize: 12 }}>{d.useCase}</Text>
                        </div>
                      </Col>
                    ))}
                  </Row>
                </Card>

                {/* Easing Token Matrix */}
                <Card
                  title={<Title level={4} style={{ margin: 0 }}>Thang Easing (Không dùng Bounce / Elastic)</Title>}
                  style={{ borderRadius: tokens.radius.lg }}
                >
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderRadius: tokens.radius.md }}>
                        <Text strong style={{ display: "block" }}>ease-out (Mặc định)</Text>
                        <Text code>cubic-bezier(0, 0, 0.2, 1)</Text>
                        <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                          Phần tử xuất hiện, hover, focus. Bắt đầu nhanh rồi hãm phanh mượt mà.
                        </Paragraph>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderRadius: tokens.radius.md }}>
                        <Text strong style={{ display: "block" }}>ease-in</Text>
                        <Text code>cubic-bezier(0.4, 0, 1, 1)</Text>
                        <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                          Phần tử biến mất, đóng modal, thoát khỏi viewport. Bắt đầu chậm và tăng tốc khi rời đi.
                        </Paragraph>
                      </Card>
                    </Col>
                    <Col xs={24} md={8}>
                      <Card size="small" style={{ borderRadius: tokens.radius.md }}>
                        <Text strong style={{ display: "block" }}>ease-in-out</Text>
                        <Text code>cubic-bezier(0.4, 0, 0.2, 1)</Text>
                        <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 12 }}>
                          Phần tử di chuyển tại chỗ, xoay icon, chuyển tab indicator.
                        </Paragraph>
                      </Card>
                    </Col>
                  </Row>
                </Card>
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
};

export default DesignSystemDemoPage;
