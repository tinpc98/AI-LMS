import { Card, Col, Input, Row, Select, Switch, Tag, Typography } from "antd";
import { SearchOutlined, ThunderboltOutlined, FieldTimeOutlined } from "@ant-design/icons";
import type { AIFeature, AIModel } from "../types/aiManagement.types";

interface FeatureListProps {
  features: AIFeature[];
  models: AIModel[];
  search: string;
  onSearchChange: (val: string) => void;
  onToggleFeature: (id: string) => void;
  onUpdateFeatureModel: (featureId: string, modelId: string) => void;
}

const FeatureList = ({
  features,
  models,
  search,
  onSearchChange,
  onToggleFeature,
  onUpdateFeatureModel,
}: FeatureListProps) => {
  return (
    <div>
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 20 }}>
        <Col xs={24} md={10}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search AI feature name or description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {features.map((feature) => {
          return (
            <Col xs={24} sm={12} lg={8} key={feature.id}>
              <Card
                bordered
                style={{
                  height: "100%",
                  borderColor: feature.enabled ? "#e2e8f0" : "#f1f5f9",
                  opacity: feature.enabled ? 1 : 0.75,
                  display: "flex",
                  flexDirection: "column",
                  justify: "space-between",
                }}
                bodyStyle={{ padding: 20, display: "flex", flexDirection: "column", height: "100%" }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {feature.name}
                      </Typography.Title>
                      <Tag color="blue" style={{ marginTop: 4 }}>
                        {feature.category}
                      </Tag>
                    </div>
                    <Switch
                      checked={feature.enabled}
                      onChange={() => onToggleFeature(feature.id)}
                    />
                  </div>

                  <Typography.Paragraph type="secondary" style={{ fontSize: 13, minHeight: 40, marginBottom: 16 }}>
                    {feature.description}
                  </Typography.Paragraph>
                </div>

                <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 6 }}>
                    Assigned AI Model:
                  </Typography.Text>
                  <Select
                    style={{ width: "100%", marginBottom: 12 }}
                    size="small"
                    value={feature.assignedModelId}
                    onChange={(val) => onUpdateFeatureModel(feature.id, val)}
                    disabled={!feature.enabled}
                    options={models.map((m) => ({
                      label: `${m.provider} - ${m.name}`,
                      value: m.id,
                    }))}
                  />

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
                    <span>
                      <ThunderboltOutlined style={{ color: "#1890ff", marginRight: 4 }} />
                      {feature.dailyRequests.toLocaleString()} reqs/day
                    </span>
                    <span>
                      <FieldTimeOutlined style={{ color: "#eb2f96", marginRight: 4 }} />
                      {feature.avgLatencyMs > 0 ? `${feature.avgLatencyMs}ms` : "—"}
                    </span>
                  </div>
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default FeatureList;
