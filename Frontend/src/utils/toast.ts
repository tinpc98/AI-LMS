export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration?: number;
}

type ToastListener = (toast: ToastMessage) => void;

class ToastManager {
  private listeners: ToastListener[] = [];

  subscribe(listener: ToastListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  show(message: string, type: ToastType = "info", title?: string, duration = 5000) {
    const toastMessage: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
      title,
      duration,
    };
    this.listeners.forEach((listener) => listener(toastMessage));
  }

  success(message: string, title?: string, duration = 5000) {
    this.show(message, "success", title || "Thành công", duration);
  }

  error(message: string, title?: string, duration = 5000) {
    this.show(message, "error", title || "Lỗi", duration);
  }

  warning(message: string, title?: string, duration = 5000) {
    this.show(message, "warning", title || "Cảnh báo", duration);
  }

  info(message: string, title?: string, duration = 5000) {
    this.show(message, "info", title || "Thông báo", duration);
  }
}

export const toast = new ToastManager();
