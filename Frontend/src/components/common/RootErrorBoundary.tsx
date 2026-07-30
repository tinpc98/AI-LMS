import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Error Boundary gốc bọc toàn bộ <App /> (main.tsx). Trước PR-11, ứng dụng không có
// error boundary ở cấp cao nhất — bất kỳ lỗi render nào không được các boundary con
// (vd ExamErrorBoundary, DashboardErrorBoundary) bắt sẽ khiến React unmount toàn bộ
// cây component, để lại màn hình trắng không có cách khôi phục ngoài tải lại trang.
class RootErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("🚨 [RootErrorBoundary] Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Đã xảy ra lỗi không mong muốn</h2>
          <p className="text-gray-700 mb-8 max-w-md">
            Ứng dụng gặp sự cố khi hiển thị trang này. Vui lòng thử tải lại. Nếu lỗi tiếp diễn,
            hãy liên hệ quản trị viên hệ thống.
          </p>
          <button
            onClick={this.handleReload}
            className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RootErrorBoundary;
