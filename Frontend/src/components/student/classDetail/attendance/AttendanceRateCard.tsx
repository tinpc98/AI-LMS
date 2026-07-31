import React from "react";
import { Card, Progress, Alert, Row, Col, Typography, Space, Tag } from "antd";
import { TrophyOutlined, SafetyCertificateOutlined, WarningOutlined } from "@ant-design/icons";
import type { StudentAttendanceStats } from "../../../../types/studentAttendance";

const { Text, Title } = Typography;

interface AttendanceRateCardProps {
  stats: StudentAttendanceStats;
}

export const AttendanceRateCard: React.FC<AttendanceRateCardProps> = React.memo(({ stats }) => {
  const rate = stats.presentRate;

  // Determine stroke color based on rate
  let strokeColor = "#52c41a"; // Green >= 95%
  let statusTag = (
    <Tag color="success" icon={<SafetyCertificateOutlined />}>
      Đạt chuẩn chuyên cần
    </Tag>
  );

  if (rate < 80) {
    strokeColor = "#ff4d4f"; // Red < 80%
    statusTag = (
      <Tag color="error" icon={<WarningOutlined />}>
        Cảnh báo nguy cơ bị cấm thi
      </Tag>
    );
  } else if (rate < 95) {
    strokeColor = "#faad14"; // Orange 80-94%
    statusTag = (
      <Tag color="warning" icon={<WarningOutlined />}>
        Cần cải thiện chuyên cần
      </Tag>
    );
  }

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
        border: "1px solid #f0f0f0",
        marginBottom: 24,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Row gutter={[24, 16]} align="middle">
        {/* Left Column: Progress Circle */}
        <Col
          xs={24}
          sm={8}
          md={6}
          style={{ textAlign: "center", borderRight: "1px dashed #f0f0f0" }}
        >
          <Progress
            type="circle"
            percent={rate}
            width={110}
            strokeColor={strokeColor}
            strokeWidth={10}
            format={(percent) => (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span style={{ fontSize: 22, fontWeight: 700, color: strokeColor }}>
                  {percent}%
                </span>
                <span style={{ fontSize: 10, color: "#8c8c8c" }}>Chuyên cần</span>
              </div>
            )}
          />
        </Col>

        {/* Right Column: Information & Warning Alert */}
        <Col xs={24} sm={16} md={18}>
          <div style={{ marginBottom: 8 }}>
            <Space size={8} align="center">
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                Tỷ lệ chuyên cần tích lũy môn học
              </Title>
              {statusTag}
            </Space>
          </div>

          <Text type="secondary" style={{ fontSize: 13, display: "block", marginBottom: 12 }}>
            Tỷ lệ chuyên cần được tính dựa trên số buổi có mặt, đi muộn và nghỉ học có phép so với
            tổng số buổi học.
          </Text>

          {/* Warning Banners */}
          {stats.warningLevel === "critical" ? (
            <Alert
              message="❌ Cảnh báo nghiêm trọng: Tỷ lệ chuyên cần rất thấp (< 50%)"
              description="Tỷ lệ tham gia lớp học của bạn cực kỳ thấp. Vui lòng liên hệ ngay với Giáo viên hoặc Cố vấn học tập để được tư vấn hỗ trợ."
              type="error"
              showIcon
              style={{ borderRadius: 10 }}
            />
          ) : stats.warningLevel === "low" ? (
            <Alert
              message="⚠ Cảnh báo: Tỷ lệ chuyên cần đang ở mức thấp (< 80%)"
              description="Hãy tham gia đầy đủ các buổi học tiếp theo để đảm bảo đủ điều kiện điểm danh dự thi cuối kỳ môn học."
              type="warning"
              showIcon
              style={{ borderRadius: 10 }}
            />
          ) : (
            <Alert
              message="🎉 Tỷ lệ chuyên cần tốt"
              description="Bạn đang duy trì tỷ lệ tham gia lớp học rất tích cực. Hãy tiếp tục phát huy!"
              type="success"
              showIcon
              style={{ borderRadius: 10 }}
            />
          )}
        </Col>
      </Row>
    </Card>
  );
});

AttendanceRateCard.displayName = "AttendanceRateCard";

export default AttendanceRateCard;
