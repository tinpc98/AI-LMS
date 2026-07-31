import { Component, type ErrorInfo, type ReactNode } from "react";
import { Alert, Button, Card } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class DashboardErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 [DashboardErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <Card style={{ borderRadius: 16, margin: "24px 0" }}>
          <Alert
            type="error"
            message="Đã xảy ra lỗi khi hiển thị Learning Dashboard"
            description={
              this.state.error?.message ||
              "Vui lòng thử bấm nút Tải lại bên dưới để khôi phục dữ liệu."
            }
            showIcon
            action={
              <Button
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={this.handleReset}
                style={{ borderRadius: 8 }}
              >
                Thử lại (Retry)
              </Button>
            }
          />
        </Card>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
