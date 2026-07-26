import { Avatar, Card, Col, List, Progress, Row, Statistic, Tag, Typography } from "antd";
import {
  RobotOutlined,
  FileTextOutlined,
  BookOutlined,
  ThunderboltOutlined,
  FieldTimeOutlined,
  ApiOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import type { AIDashboardStats, AIFeature } from "../types/aiManagement.types";

interface AIDashboardProps {
  stats: AIDashboardStats;
  features: AIFeature[];
}

const statCardStyle = {
  height: 150,
};

const AIDashboard = ({ stats, features }: AIDashboardProps) => {
  const topFeatures = [...features]
    .sort((a, b) => b.dailyRequests - a.dailyRequests)
    .slice(0, 5);

  const usageBreakdown = [
    { label: "AI Chatbot (Gemini 2.5 Flash)", requests: 6840, percent: 36, color: "#1890ff" },
    { label: "AI Homework Assistant (Gemini Pro)", requests: 4300, percent: 23, color: "#52c41a" },
    { label: "AI Quiz Generator (GPT-4.5)", requests: 3120, percent: 17, color: "#722ed1" },
    { label: "AI Summary (Gemini 2.5 Pro)", requests: 2150, percent: 11, color: "#fa8c16" },
    { label: "AI Exam Generator (GPT-4.5)", requests: 1420, percent: 8, color: "#eb2f96" },
    { label: "AI Essay Evaluation (Claude 3.5)", requests: 980, percent: 5, color: "#13c2c2" },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={statCardStyle}
            styles={{
              body: {
                padding: "16px",
                height: "100%",
              },
            }}
          >
            <Statistic
              title="Active AI Models"
              value={`${stats.activeModelsCount}/${stats.totalModelsCount}`}
              prefix={<RobotOutlined style={{ color: "#1890ff", marginRight: 6 }} />}
              valueStyle={{ fontSize: 22, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={statCardStyle}
            styles={{
              body: {
                padding: "16px",
                height: "100%",
              },
            }}
          >
            <Statistic
              title="Prompt Templates"
              value={stats.promptTemplatesCount}
              prefix={<FileTextOutlined style={{ color: "#722ed1", marginRight: 6 }} />}
              valueStyle={{ fontSize: 22, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={statCardStyle}
            styles={{
              body: {
                padding: "16px",
                height: "100%",
              },
            }}
          >
            <Statistic
              title="Knowledge Base"
              value={stats.knowledgeDocsCount}
              prefix={<BookOutlined style={{ color: "#52c41a", marginRight: 6 }} />}
              suffix="Docs"
              valueStyle={{ fontSize: 22, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={statCardStyle}
            styles={{
              body: {
                padding: "16px",
                height: "100%",
              },
            }}
          >
            <Statistic
              title="Features Enabled"
              value={`${stats.enabledFeaturesCount}/${stats.totalFeaturesCount}`}
              prefix={<CheckCircleOutlined style={{ color: "#fa8c16", marginRight: 6 }} />}
              valueStyle={{ fontSize: 22, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={statCardStyle}
            styles={{
              body: {
                padding: "16px",
                height: "100%",
              },
            }}
          >
            <Statistic
              title="Requests Today"
              value={stats.todayRequestsCount}
              prefix={<ThunderboltOutlined style={{ color: "#13c2c2", marginRight: 6 }} />}
              valueStyle={{ fontSize: 22, fontWeight: 600, color: "#13c2c2" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card
            bordered={false}
            style={statCardStyle}
            styles={{
              body: {
                padding: "16px",
                height: "100%",
              },
            }}
          >
            <Statistic
              title="Avg Response Time"
              value={stats.avgResponseTimeMs}
              suffix="ms"
              prefix={<FieldTimeOutlined style={{ color: "#eb2f96", marginRight: 6 }} />}
              valueStyle={{ fontSize: 22, fontWeight: 600, color: "#eb2f96" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            title={
              <span>
                <ApiOutlined style={{ marginRight: 8, color: "#1890ff" }} /> AI Request Volume & Distribution
              </span>
            }
          >
            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Daily requests broken down by feature & active AI Provider model
              </Typography.Text>
            </div>

            {usageBreakdown.map((item, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <Typography.Text strong style={{ fontSize: 13 }}>
                    {item.label}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {item.requests.toLocaleString()} reqs ({item.percent}%)
                  </Typography.Text>
                </div>
                <Progress percent={item.percent} strokeColor={item.color} showInfo={false} />
              </div>
            ))}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            title={
              <span>
                <TrophyOutlined style={{ marginRight: 8, color: "#fa8c16" }} /> Top AI Features Ranking
              </span>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={topFeatures}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: index === 0 ? "#fadb14" : index === 1 ? "#d9d9d9" : "#d3ad69",
                          color: index < 3 ? "#000" : "#fff",
                          fontWeight: 600,
                        }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography.Text strong>{item.name}</Typography.Text>
                        <Tag color={item.enabled ? "green" : "default"}>
                          {item.enabled ? "Enabled" : "Disabled"}
                        </Tag>
                      </div>
                    }
                    description={
                      <div style={{ fontSize: 12 }}>
                        <span>Requests: {item.dailyRequests.toLocaleString()} / day</span>
                        <span style={{ marginLeft: 12 }}>Avg latency: {item.avgLatencyMs}ms</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AIDashboard;
