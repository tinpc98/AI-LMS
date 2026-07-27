import { Card, Col, Row, Statistic } from "antd";
import { AppstoreOutlined, CheckCircleOutlined, ExclamationCircleOutlined, UserOutlined } from "@ant-design/icons";
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
            prefix={<AppstoreOutlined style={{ color: "#3b82f6", marginRight: 8 }} />}
            valueStyle={{ fontSize: 24, fontWeight: 600 }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} styles={{ body: { padding: "16px 20px" } }}>
          <Statistic
            title="Assigned"
            value={stats.assignedCount}
            prefix={<CheckCircleOutlined style={{ color: "#10b981", marginRight: 8 }} />}
            valueStyle={{ fontSize: 24, fontWeight: 600, color: "#10b981" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} styles={{ body: { padding: "16px 20px" } }}>
          <Statistic
            title="Unassigned"
            value={stats.unassignedCount}
            prefix={<ExclamationCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} />}
            valueStyle={{ fontSize: 24, fontWeight: 600, color: "#f59e0b" }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} styles={{ body: { padding: "16px 20px" } }}>
          <Statistic
            title="Teaching Teachers"
            value={stats.activeTeachersCount}
            prefix={<UserOutlined style={{ color: "#6366f1", marginRight: 8 }} />}
            valueStyle={{ fontSize: 24, fontWeight: 600 }}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default TeacherAssignmentStatistic;
