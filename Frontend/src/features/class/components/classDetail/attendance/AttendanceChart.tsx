import React from "react";
import { Card, Row, Col, Progress, Typography } from "antd";
import { PieChartOutlined } from "@ant-design/icons";
import type { StudentAttendanceStats } from "../../../../../types/studentAttendance";

const { Text } = Typography;

interface AttendanceChartProps {
  stats: StudentAttendanceStats;
}

export const AttendanceChart: React.FC<AttendanceChartProps> = React.memo(({ stats }) => {
  if (stats.total === 0) return null;

  const presentPercent = Math.round((stats.present / stats.total) * 100);
  const latePercent = Math.round((stats.late / stats.total) * 100);
  const absentPercent = Math.round((stats.absent / stats.total) * 100);
  const excusedPercent = Math.round((stats.excused / stats.total) * 100);

  return (
    <Card
      title={
        <span style={{ fontSize: 14, fontWeight: 700 }}>
          <PieChartOutlined style={{ color: "var(--color-action-primary-bg)", marginRight: 6 }} /> Biểu đồ tỷ lệ các trạng
          thái điểm danh
        </span>
      }
      size="small"
      style={{ borderRadius: 16, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
    >
      <Row gutter={[16, 12]}>
        <Col xs={12} sm={6}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Có mặt: {stats.present} buổi ({presentPercent}%)
            </Text>
            <Progress
              percent={presentPercent}
              showInfo={false}
              strokeColor="var(--color-success-base)"
              size="small"
            />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Đi muộn: {stats.late} buổi ({latePercent}%)
            </Text>
            <Progress percent={latePercent} showInfo={false} strokeColor="var(--color-warning-base)" size="small" />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Vắng mặt: {stats.absent} buổi ({absentPercent}%)
            </Text>
            <Progress percent={absentPercent} showInfo={false} strokeColor="var(--color-error-base)" size="small" />
          </div>
        </Col>

        <Col xs={12} sm={6}>
          <div>
            <Text type="secondary" style={{ fontSize: 11 }}>
              Có phép: {stats.excused} buổi ({excusedPercent}%)
            </Text>
            <Progress
              percent={excusedPercent}
              showInfo={false}
              strokeColor="var(--color-action-primary-bg)"
              size="small"
            />
          </div>
        </Col>
      </Row>
    </Card>
  );
});

AttendanceChart.displayName = "AttendanceChart";

export default AttendanceChart;
