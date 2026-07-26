import React from "react";
import { Card, Row, Col, Select, DatePicker, Statistic, Typography, Space, Button, Progress } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  HistoryOutlined,
  CalendarOutlined,
  BookOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import type { IAttendanceStats } from "../../../interface/attendanceInterface";

const { Title, Text } = Typography;

interface ClassOption {
  _id: string;
  className: string;
  classCode?: string;
  joinCode?: string;
}

interface TeacherAttendanceHeaderProps {
  classList: ClassOption[];
  selectedClassId?: string;
  onSelectClass: (classId: string) => void;
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
  stats?: IAttendanceStats;
  loading?: boolean;
  onOpenHistory: () => void;
}

export const TeacherAttendanceHeader: React.FC<TeacherAttendanceHeaderProps> = React.memo(
  ({
    classList = [],
    selectedClassId,
    onSelectClass,
    selectedDate,
    onSelectDate,
    stats,
    loading = false,
    onOpenHistory,
  }) => {
    const presentRate = typeof stats?.presentRate === "number" ? stats.presentRate : parseFloat(stats?.presentRate as string || "0");

    return (
      <Card
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          color: "#fff",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
        }}
        bodyStyle={{ padding: "24px 32px" }}
      >
        {/* Top Controls: Class Select & Date Picker */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
          <Space size={16} wrap align="center">
            <BookOutlined style={{ fontSize: 28, color: "#fff" }} />
            <div>
              <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                Điểm danh lớp học
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                Chọn lớp học và ngày điểm danh để cập nhật trạng thái chuyên cần.
              </Text>
            </div>
          </Space>

          <Space size={12} wrap align="center">
            <Select
              value={selectedClassId}
              onChange={onSelectClass}
              style={{ width: 240 }}
              placeholder="Chọn lớp học..."
              loading={loading}
              options={classList.map((c) => ({
                value: c._id,
                label: `${c.className} (${c.joinCode || c.classCode || "Lớp"})`,
              }))}
            />

            <DatePicker
              value={selectedDate ? dayjs(selectedDate) : dayjs()}
              onChange={(date) => {
                if (date) onSelectDate(date.format("YYYY-MM-DD"));
              }}
              format="DD/MM/YYYY"
              style={{ width: 160 }}
              allowClear={false}
            />

            <Button
              type="default"
              icon={<HistoryOutlined />}
              onClick={onOpenHistory}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderColor: "rgba(255,255,255,0.4)",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Lịch sử
            </Button>
          </Space>
        </div>

        {/* Stats Grid Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
              <Statistic
                title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Tổng số bài</Text>}
                value={stats?.total || 0}
                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 20 }}
              />
            </div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
              <Statistic
                title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🟢 Có mặt</Text>}
                value={stats?.present || 0}
                prefix={<CheckCircleOutlined style={{ color: "#b7eb8f", marginRight: 6 }} />}
                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 20 }}
              />
            </div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
              <Statistic
                title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🟡 Đi muộn</Text>}
                value={stats?.late || 0}
                prefix={<ClockCircleOutlined style={{ color: "#ffe58f", marginRight: 6 }} />}
                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 20 }}
              />
            </div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
              <Statistic
                title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🔵 Có phép</Text>}
                value={stats?.excused || 0}
                prefix={<InfoCircleOutlined style={{ color: "#91caff", marginRight: 6 }} />}
                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 20 }}
              />
            </div>
          </Col>

          <Col xs={12} sm={8} md={5}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
              <Statistic
                title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🔴 Vắng mặt</Text>}
                value={stats?.absent || 0}
                prefix={<CloseCircleOutlined style={{ color: "#ff2222", marginRight: 6 }} />}
                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 20 }}
              />
            </div>
          </Col>
        </Row>

        {/* Progress Bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.85)", marginBottom: 4 }}>
            <span>Tỷ lệ đi học thành công</span>
            <span><strong>{presentRate}%</strong></span>
          </div>
          <Progress percent={presentRate} showInfo={false} strokeColor="#52c41a" trailColor="rgba(255,255,255,0.3)" />
        </div>
      </Card>
    );
  }
);

TeacherAttendanceHeader.displayName = "TeacherAttendanceHeader";
