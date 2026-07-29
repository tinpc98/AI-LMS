import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { Card, Button, Typography, Space } from "antd";
import { WarningOutlined, ReloadOutlined, CloseCircleOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

interface Props {
  children: ReactNode;
  onReset?: () => void;
  onClose?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LiveSessionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log an toàn, không chứa thông tin JWT
    console.error("🔴 [LiveSessionErrorBoundary] Caught UI error:", error.name, error.message, errorInfo.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleClose = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onClose) {
      this.props.onClose();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card
          style={{
            borderRadius: 16,
            borderColor: "#ffa39e",
            backgroundColor: "#fff1f0",
            boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
            margin: "16px 0",
          }}
          styles={{ body: { padding: 24, textAlign: "center" } }}
          role="alert"
          aria-live="assertive"
        >
          <Space direction="vertical" size={12} align="center" style={{ width: "100%" }}>
            <WarningOutlined style={{ fontSize: 42, color: "#ff4d4f" }} />
            <Title level={4} style={{ color: "#cf1322", margin: 0, fontWeight: 700 }}>
              Phòng học trực tuyến gặp lỗi
            </Title>
            <Paragraph style={{ color: "#595959", maxWidth: 500, margin: "0 auto", fontSize: 14 }}>
              Đã xảy ra sự cố không mong muốn trong giao diện gọi video. Lỗi này đã được ngắt kết nối an toàn để không ảnh hưởng đến toàn bộ hệ thống.
            </Paragraph>
            {this.state.error?.message && (
              <Text type="secondary" style={{ fontSize: 12, fontFamily: "monospace", display: "block" }}>
                Chi tiết: {this.state.error.message}
              </Text>
            )}
            <Space size={12} style={{ marginTop: 12 }}>
              <Button
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={this.handleRetry}
                style={{ fontWeight: 600, borderRadius: 8 }}
              >
                Thử lại
              </Button>
              {this.props.onClose && (
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={this.handleClose}
                  style={{ borderRadius: 8 }}
                >
                  Đóng
                </Button>
              )}
            </Space>
          </Space>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default LiveSessionErrorBoundary;
