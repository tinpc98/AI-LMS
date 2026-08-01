// Chốt hook dùng chung cho ba trang quản trị (tài khoản / khoá học / lớp học).
//
// Gộp ba đoạn giống nhau thành một hook thì cái được là sửa một chỗ; cái mất là hỏng một chỗ
// cũng gãy cả ba trang. Nên phần này cần test kỹ hơn mức bình thường.
//
// Không dùng mockReset() ở đây — xem ghi chú trong tests/useStudentClasses.test.tsx.
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useAdminListQuery } from "../src/shared/hooks/useAdminListQuery";

const messageError = vi.fn();
vi.mock("antd", () => ({ message: { error: (...a: unknown[]) => messageError(...a) } }));

interface Ban {
  id: string;
}
interface Loc {
  page: number;
  search?: string;
}

const makeWrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const ok = (data: Ban[], total = data.length) => ({
  success: true,
  data,
  pagination: { page: 1, limit: 10, total, totalPages: 1 },
});

const setup = (over: Partial<Parameters<typeof useAdminListQuery<Ban, Loc>>[0]> = {}) => {
  const fetchActive = vi.fn().mockResolvedValue(ok([{ id: "a1" }]));
  const fetchTrash = vi.fn().mockResolvedValue(ok([{ id: "t1" }]));
  const wrapper = makeWrapper();

  const render = (filters: Loc = { page: 1 }, isTrash = false) =>
    renderHook(
      ({ f, t }: { f: Loc; t: boolean }) =>
        useAdminListQuery<Ban, Loc>({
          resource: "test",
          filters: f,
          isTrash: t,
          fetchActive,
          fetchTrash,
          errorMessage: "Tải danh sách thất bại",
          ...over,
        }),
      { wrapper, initialProps: { f: filters, t: isTrash } }
    );

  return { fetchActive, fetchTrash, render };
};

describe("useAdminListQuery — tải dữ liệu", () => {
  it("trả về bản ghi và phân trang", async () => {
    const { render } = setup();
    const { result } = render();

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.records).toEqual([{ id: "a1" }]);
    expect(result.current.pagination.total).toBe(1);
  });

  it("chưa có dữ liệu thì records là mảng rỗng, phân trang có giá trị mặc định", () => {
    const { render } = setup();
    const { result } = render();

    // Quan trọng: trang đọc pagination.page/limit/total để dựng bảng antd. Trả undefined ở
    // đây sẽ làm sập bảng ngay lần render đầu.
    expect(result.current.records).toEqual([]);
    expect(result.current.pagination).toEqual({ page: 1, limit: 10, total: 0, totalPages: 0 });
  });

  it("gọi đúng nguồn theo tab: thùng rác dùng fetchTrash", async () => {
    const { fetchActive, fetchTrash, render } = setup();
    const { result } = render({ page: 1 }, true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchTrash).toHaveBeenCalledTimes(1);
    expect(fetchActive).not.toHaveBeenCalled();
    expect(result.current.records).toEqual([{ id: "t1" }]);
  });
});

describe("useAdminListQuery — bộ lọc nằm trong khoá cache", () => {
  it("đổi bộ lọc thì gọi API lại với bộ lọc mới", async () => {
    const { fetchActive, render } = setup();
    const { result, rerender } = render({ page: 1 });

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ f: { page: 2 }, t: false });
    await waitFor(() => expect(fetchActive).toHaveBeenCalledTimes(2));

    expect(fetchActive.mock.calls.map(([f]) => f.page)).toEqual([1, 2]);
  });

  it("quay lại bộ lọc cũ thì thấy dữ liệu NGAY, không qua trạng thái trống", async () => {
    // TÔI ĐÃ VIẾT TEST NÀY SAI Ở BẢN ĐẦU: khẳng định "không gọi mạng lần nữa", và nó đỏ với
    // 3 lời gọi thay vì 2. React Query mặc định coi dữ liệu là cũ ngay lập tức (staleTime 0),
    // nên quay lại khoá cũ thì nó VẪN gọi nền để làm mới.
    //
    // Với danh sách quản trị thì làm mới nền là đúng — admin khác có thể vừa thêm bản ghi.
    // Cái được thật sự không phải là bớt request, mà là KHÔNG CÒN MÀN HÌNH TRỐNG: bản cũ
    // xoá sạch danh sách rồi chờ mạng; bản này hiện ngay dữ liệu đã có.
    const { fetchActive, render } = setup();
    const { result, rerender } = render({ page: 1 });

    await waitFor(() => expect(result.current.loading).toBe(false));
    rerender({ f: { page: 2 }, t: false });
    await waitFor(() => expect(fetchActive).toHaveBeenCalledTimes(2));

    rerender({ f: { page: 1 }, t: false });

    // Ngay lập tức, không await: dữ liệu cũ đã có sẵn trong cache.
    expect(result.current.records).toEqual([{ id: "a1" }]);
  });

  it("hai tab có cache riêng, không lẫn dữ liệu vào nhau", async () => {
    const { render } = setup();
    const { result, rerender } = render({ page: 1 }, false);

    await waitFor(() => expect(result.current.records).toEqual([{ id: "a1" }]));
    rerender({ f: { page: 1 }, t: true });
    await waitFor(() => expect(result.current.records).toEqual([{ id: "t1" }]));
    rerender({ f: { page: 1 }, t: false });
    await waitFor(() => expect(result.current.records).toEqual([{ id: "a1" }]));
  });
});

describe("useAdminListQuery — lỗi", () => {
  it("mạng hỏng thì hiện thông báo của trang", async () => {
    const fetchActive = vi.fn().mockRejectedValue(new Error("mất mạng"));
    const wrapper = makeWrapper();

    const { result } = renderHook(
      () =>
        useAdminListQuery<Ban, Loc>({
          resource: "test",
          filters: { page: 1 },
          isTrash: false,
          fetchActive,
          fetchTrash: vi.fn(),
          errorMessage: "Tải danh sách thất bại",
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(messageError).toHaveBeenCalledWith("Tải danh sách thất bại");
    expect(result.current.records).toEqual([]);
  });

  it("success=false được coi là LỖI, không im lặng giữ dữ liệu cũ", async () => {
    // Bản cũ viết `if (response.success) { ...set state... }` và không có nhánh else, nên
    // trường hợp này danh sách cũ đứng yên và người dùng không biết gì. Đổi có chủ đích.
    const fetchActive = vi
      .fn()
      .mockResolvedValue({ success: false, message: "Hết quyền", data: [] });
    const wrapper = makeWrapper();

    const { result } = renderHook(
      () =>
        useAdminListQuery<Ban, Loc>({
          resource: "test",
          filters: { page: 1 },
          isTrash: false,
          fetchActive,
          fetchTrash: vi.fn(),
          errorMessage: "Tải danh sách thất bại",
        }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect((result.current.error as Error).message).toBe("Hết quyền");
  });
});

describe("useAdminListQuery — refetch sau thao tác ghi", () => {
  it("refetch gọi lại API và các trang có thể await nó", async () => {
    // Ba trang đều viết `await loadAccounts()` sau khi thêm/sửa/xoá. Nếu refetch không trả về
    // promise thì thứ tự sẽ sai mà không ai nhận ra ngay.
    const { fetchActive, render } = setup();
    const { result } = render();

    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.refetch();
    });

    expect(fetchActive).toHaveBeenCalledTimes(2);
  });
});
