// Thiết lập chung cho toàn bộ test Frontend.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

// jsdom không có matchMedia — Ant Design dùng nó cho responsive (Grid, Drawer, Modal).
// Thiếu cái này thì hầu như mọi component antd đều ném lỗi ngay khi mount.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// jsdom cũng thiếu ResizeObserver — Recharts và một số component antd cần.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Chặn mọi request thật thoát ra ngoài trong lúc test. Nếu một test vô tình gọi API
// mà không mock, nó sẽ FAIL rõ ràng thay vì âm thầm treo hoặc gọi vào server thật.
global.fetch = vi.fn(() => {
  throw new Error(
    "Test đã gọi fetch() thật. Hãy mock lớp API tương ứng thay vì để request thoát ra ngoài."
  );
}) as unknown as typeof fetch;
