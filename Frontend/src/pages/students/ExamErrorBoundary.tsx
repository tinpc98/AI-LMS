import React, { Component, ErrorInfo, ReactNode } from "react";
import { Link } from "react-router-dom";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ExamErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Exam Error Boundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-6 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Không thể hiển thị bài thi</h2>
          <p className="text-gray-700 mb-8 max-w-md">
            Đã xảy ra lỗi khi tải hoặc hiển thị bài thi. Tiến trình làm bài của bạn vẫn an toàn. Vui lòng thử lại.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
            >
              Thử lại
            </button>
            <Link
              to="/student/myclasses"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Quay lại danh sách lớp
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ExamErrorBoundary;
