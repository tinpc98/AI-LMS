import { useEffect } from "react";
import {
  Button,
  Card,
  Col,
  Form,
  InputNumber,
  Row,
  Select,
  Slider,
  Switch,
  Typography,
} from "antd";
import { SaveOutlined, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import type { AIConfiguration, AIModel } from "../types/aiManagement.types";

interface ConfigurationFormProps {
  config: AIConfiguration;
  models: AIModel[];
  saving: boolean;
  onSave: (config: AIConfiguration) => void;
  onReset: () => void;
}

const ConfigurationForm = ({ config, models, saving, onSave, onReset }: ConfigurationFormProps) => {
  const [form] = Form.useForm<AIConfiguration>();

  useEffect(() => {
    form.setFieldsValue(config);
  }, [config, form]);

  const handleFinish = (values: AIConfiguration) => {
    onSave(values);
  };

  return (
    <Card
      bordered={false}
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8, color: "var(--color-action-primary-bg)" }} /> System AI Global
          Configuration & Limits
        </span>
      }
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={config}>
        <Row gutter={[24, 0]}>
          <Col xs={24} md={12}>
            <Typography.Title level={5} style={{ marginBottom: 16 }}>
              Model & Hyperparameters
            </Typography.Title>

            <Form.Item
              name="defaultModelId"
              label="Primary Default AI Model"
              rules={[{ required: true }]}
              tooltip="Used as fallback model for unassigned features"
            >
              <Select
                options={models.map((m) => ({
                  label: `${m.provider} - ${m.name} (${m.version})`,
                  value: m.id,
                }))}
              />
            </Form.Item>

            <Form.Item name="temperature" label="Temperature (Creativity vs Determinism)">
              <Row gutter={16} align="middle">
                <Col span={18}>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(val) => form.setFieldValue("temperature", val)}
                    value={Form.useWatch("temperature", form)}
                  />
                </Col>
                <Col span={6}>
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.05}
                    style={{ width: "100%" }}
                    value={Form.useWatch("temperature", form)}
                    onChange={(val) => form.setFieldValue("temperature", val ?? 0.7)}
                  />
                </Col>
              </Row>
            </Form.Item>

            <Form.Item name="topP" label="Top P (Nucleus Sampling)">
              <Row gutter={16} align="middle">
                <Col span={18}>
                  <Slider
                    min={0}
                    max={1}
                    step={0.05}
                    onChange={(val) => form.setFieldValue("topP", val)}
                    value={Form.useWatch("topP", form)}
                  />
                </Col>
                <Col span={6}>
                  <InputNumber
                    min={0}
                    max={1}
                    step={0.05}
                    style={{ width: "100%" }}
                    value={Form.useWatch("topP", form)}
                    onChange={(val) => form.setFieldValue("topP", val ?? 0.9)}
                  />
                </Col>
              </Row>
            </Form.Item>

            <Form.Item name="maxTokens" label="Max Response Tokens" rules={[{ required: true }]}>
              <InputNumber min={512} max={32000} step={512} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="requestTimeoutSec"
              label="Request Timeout (Seconds)"
              rules={[{ required: true }]}
            >
              <InputNumber min={5} max={120} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="retryCount"
              label="Automatic Retry Count on Error"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} max={5} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Typography.Title level={5} style={{ marginBottom: 16 }}>
              Rate Limits & Security Policies
            </Typography.Title>

            <Form.Item
              name="dailyRequestLimit"
              label="System Total Daily Limit (Requests/day)"
              rules={[{ required: true }]}
            >
              <InputNumber min={1000} max={1000000} step={1000} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="teacherRequestLimit"
              label="Teacher Account Limit (Requests/day)"
              rules={[{ required: true }]}
            >
              <InputNumber min={50} max={10000} step={50} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="studentRequestLimit"
              label="Student Account Limit (Requests/day)"
              rules={[{ required: true }]}
            >
              <InputNumber min={10} max={2000} step={10} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="enableSafetyFilter"
              label="Enable Content Safety & Toxic Filter"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>

            <Form.Item
              name="enableUsageLogging"
              label="Enable Detailed Token & Audit Trail Logging"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>
        </Row>

        <div style={{ marginTop: 24, display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            Reset Default
          </Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} htmlType="submit">
            Save Configuration
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default ConfigurationForm;
