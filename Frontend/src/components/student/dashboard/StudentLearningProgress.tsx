import React from "react";
import { Card, Progress, Row, Col, Typography, Space } from "antd";
import { FieldTimeOutlined, CheckCircleOutlined, FormOutlined, TrophyOutlined } from "@ant-design/icons";

const { Text, Title } = Typography;

interface StudentLearningProgressProps {
  attendanceRate: number; // e.g. 95
  assignmentCompletionRate: number; // e.g. 85
  examPerformanceRate: number; // e.g. 80
  overallProgress: number; // e.g. 87
}

export const StudentLearningProgress: React.FC<StudentLearningProgressProps> = React.memo(
  ({
    attendanceRate = 0,
    assignmentCompletionRate = 0,
    examPerformanceRate = 0,
    overallProgress = 0,
  }) => {
    return (
      <Card
        title={
          <Space align="center">
            <TrophyOutlined style={{ color: "#13c2c2", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Tiến độ học tập tổng quan</span>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: 24 } }}
      >
        <Row gutter={[24, 24]} align="middle">
          {/* Overall Progress Circular Badge */}
          <Col xs={24} sm={8} style={{ textAlign: "center" }}>
            <Progress
              type="circle"
              percent={overallProgress}
              width={120}
              strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
              format={(percent) => (
                <div>
                  <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>
                    {percent}%
                  </Title>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Tổng thể
                  </Text>
                </div>
              )}
            />
          </Col>

          {/* Line Progresses */}
          <Col xs={24} sm={16}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              {/* Attendance */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: 600 }}>
                    <FieldTimeOutlined style={{ color: "#52c41a", marginRight: 6 }} />
                    Điểm danh đầy đủ (Attendance)
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>
                    {attendanceRate}%
                  </Text>
                </div>
                <Progress percent={attendanceRate} strokeColor="#52c41a" showInfo={false} size="small" />
              </div>

              {/* Assignment Completion */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: 600 }}>
                    <CheckCircleOutlined style={{ color: "#1890ff", marginRight: 6 }} />
                    Hoàn thành bài tập (Assignments)
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>
                    {assignmentCompletionRate}%
                  </Text>
                </div>
                <Progress percent={assignmentCompletionRate} strokeColor="#1890ff" showInfo={false} size="small" />
              </div>

              {/* Exam Performance */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: 600 }}>
                    <FormOutlined style={{ color: "#fa8c16", marginRight: 6 }} />
                    Kết quả kiểm tra (Exam Performance)
                  </Text>
                  <Text strong style={{ fontSize: 13 }}>
                    {examPerformanceRate}%
                  </Text>
                </div>
                <Progress percent={examPerformanceRate} strokeColor="#fa8c16" showInfo={false} size="small" />
              </div>
            </Space>
          </Col>
        </Row>
      </Card>
    );
  }
);

StudentLearningProgress.displayName = "StudentLearningProgress";

export default StudentLearningProgress;
