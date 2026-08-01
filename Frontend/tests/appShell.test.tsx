// Tầng lưới thứ hai: RENDER THẬT cây ứng dụng (Wave 5 / §7.1).
//
// lazyRoutes.test.tsx chỉ khẳng định các module nạp được. Test này đi xa hơn: mount App
// trong router thật và kiểm rằng cây provider + guard hoạt động.
//
// Đây là thứ mà `tsc` và `vite build` KHÔNG bắt được: thiếu một Provider, đổi thứ tự bọc
// component, guard trả về sai nhánh — tất cả đều biên dịch sạch và build thành công, chỉ
// hỏng lúc chạy.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "../src/App";

const renderAt = (route: string) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </MemoryRouter>
  );
};

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("Cây ứng dụng mount được", () => {
  it("route không tồn tại hiện màn hình 404, không làm sập app", async () => {
    renderAt("/duong-dan-khong-he-ton-tai");
    await waitFor(() => expect(screen.getByText(/Trang không tồn tại/i)).toBeInTheDocument());
  });

  it("khách chưa đăng nhập vào /login thì thấy màn hình đăng nhập", async () => {
    renderAt("/login");
    // LoginPage được lazy nạp -> chờ Suspense giải quyết xong.
    await waitFor(
      () => {
        const hasPasswordField = document.querySelector('input[type="password"]');
        expect(hasPasswordField).toBeTruthy();
      },
      { timeout: 5000 }
    );
  });

  it("khách chưa đăng nhập vào route cần quyền thì KHÔNG lọt vào trong", async () => {
    renderAt("/admin/accounts");
    // Guard phải chuyển hướng — nội dung quản trị tài khoản không được xuất hiện.
    await waitFor(
      () => {
        expect(screen.queryByText(/Quản lý tài khoản/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
