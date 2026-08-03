import { Card, Col, Row, Statistic } from "antd";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { TeacherAssignmentStats } from "./teacherAssignment.types";

interface TeacherAssignmentStatisticProps {
  stats: TeacherAssignmentStats;
}

const TeacherAssignmentStatistic = ({ stats }: TeacherAssignmentStatisticProps) => {
  return (
    <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} styles={{ body: { padding: "16px 20px" } }}>
          <Statistic
            title="Total Classes"
            value={stats.totalClasses}
            prefix={<AppstoreOutlined style={{ color: "var(--color-info-base)", marginRight: 8 }} />}
            valueStyle={{ fontSize: 24, fontWeight: 600 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} styles={{ body: { padding: "16px 20px" } }}>
          <Statistic
            title="Assigned"
            value={stats.assignedCount}
            prefix={<CheckCircleOutlined style={{ color: "var(--color-success-base)", marginRight: 8 }} />}
            valueStyle={{ fontSize: 24, fontWeight: 600, color: "var(--color-success-base)" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} styles={{ body: { padding: "16px 20px" } }}>
          <Statistic
            title="Unassigned"
            value={stats.unassignedCount}
            prefix={<ExclamationCircleOutlined style={{ color: "var(--color-warning-base)", marginRight: 8 }} />}
            valueStyle={{ fontSize: 24, fontWeight: 600, color: "var(--color-warning-base)" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} styles={{ body: { padding: "16px 20px" } }}>
          <Statistic
            title="Teaching Teachers"
            value={stats.activeTeachersCount}
            prefix={<UserOutlined style={{ color: "var(--color-secondary-icon)", marginRight: 8 }} />}
            valueStyle={{ fontSize: 24, fontWeight: 600 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default TeacherAssignmentStatistic;
