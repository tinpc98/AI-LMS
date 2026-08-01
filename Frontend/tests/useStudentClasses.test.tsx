// Chốt hợp đồng trả về của useStudentClasses sau khi chuyển sang React Query.
//
// StudentMyClassesPage không được sửa một dòng nào trong lần chuyển đổi này, nên hook phải
// trả về ĐÚNG hình dạng cũ. Hai chỗ dễ trượt nhất:
//   - `loading` là boolean (React Query đưa ra isLoading, không phải loading)
//   - `error` là CHUỖI tiếng Việt hoặc null, không phải object Error. Trang đang đổ thẳng
//     giá trị này vào <Alert description={error}>; nếu lọt object thì React ném lỗi render.
import { describe, it, expect, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useStudentClasses } from "../src/features/class/hooks/useStudentClasses";
import type { IStudentClass } from "../src/types/studentClass";

vi.mock("../src/api/studentClassApi", () => ({
  default: { fetchMyClasses: vi.fn() },
}));

import studentClassApi from "../src/api/studentClassApi";

const lop = (over: Partial<IStudentClass>): IStudentClass =>
  ({ _id: "c1", className: "Lớp A", status: "Active", ...over }) as IStudentClass;

// retry: false — mặc định React Query thử lại 3 lần, test lỗi sẽ treo cho tới khi hết giờ.
const makeWrapper = () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

// ĐỪNG dùng mockReset() ở beforeEach cho mock này.
//
// Tôi viết `beforeEach(() => ...mockReset())` trước, và hai test lỗi mạng đỏ với chính giá
// trị bị reject — không phải assertion nào sai, mà promise bị coi là "unhandled rejection".
// Thu hẹp bằng probe từng biến một: bỏ mockReset đi thì xanh, thêm lại thì đỏ, lặp lại được.
//
// mockReset() xoá luôn phần vitest ghi nhận các promise do mockRejectedValue tạo ra, nên khi
// promise đó reject thì không còn ai nhận là đã xử lý. mockClear() không có vấn đề này —
// và tests/setup.ts đã gọi vi.clearAllMocks() sau mỗi test, nên ở đây không cần gì thêm.
//
// Mỗi test tự đặt giá trị trả về của mình, không dựa vào trạng thái còn sót lại.

describe("useStudentClasses — tải dữ liệu", () => {
  it("bắt đầu ở trạng thái đang tải, rồi trả về danh sách", async () => {
    vi.mocked(studentClassApi.fetchMyClasses).mockResolvedValue([
      lop({ className: "Toán 12A", subject: "Toán" }),
    ]);

    const { result } = renderHook(() => useStudentClasses(), { wrapper: makeWrapper() });

    expect(result.current.loading).toBe(true);
    expect(result.current.classes).toEqual([]); // mảng rỗng, KHÔNG phải undefined

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.classes).toHaveLength(1);
    expect(result.current.availableSubjects).toEqual(["Toán"]);
  });

  it("lỗi mạng: error là CHUỖI tiếng Việt, không phải object Error", async () => {
    vi.mocked(studentClassApi.fetchMyClasses).mockRejectedValue(new Error("Network down"));

    const { result } = renderHook(() => useStudentClasses(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(typeof result.current.error).toBe("string");
    expect(result.current.error).toBe("Không thể tải danh sách lớp học!");
    expect(result.current.classes).toEqual([]);
  });

  it("ưu tiên thông điệp lỗi do máy chủ gửi kèm", async () => {
    vi.mocked(studentClassApi.fetchMyClasses).mockRejectedValue({
      response: { data: { message: "Bạn chưa tham gia lớp nào." } },
    });

    const { result } = renderHook(() => useStudentClasses(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error).toBe("Bạn chưa tham gia lớp nào.");
  });

  it("thành công thì error là null", async () => {
    vi.mocked(studentClassApi.fetchMyClasses).mockResolvedValue([]);

    const { result } = renderHook(() => useStudentClasses(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });
});

describe("useStudentClasses — cache dùng chung", () => {
  it("hai component cùng dùng hook chỉ gọi API MỘT lần", async () => {
    // Đây là cái được thật sự của lần chuyển đổi. Bản cũ mỗi hook một useEffect riêng, nên
    // mở hai chỗ là hai lần gọi mạng cho cùng một dữ liệu.
    vi.mocked(studentClassApi.fetchMyClasses).mockResolvedValue([lop({})]);
    const wrapper = makeWrapper();

    const a = renderHook(() => useStudentClasses(), { wrapper });
    const b = renderHook(() => useStudentClasses(), { wrapper });

    await waitFor(() => expect(a.result.current.loading).toBe(false));
    await waitFor(() => expect(b.result.current.loading).toBe(false));

    expect(studentClassApi.fetchMyClasses).toHaveBeenCalledTimes(1);
  });
});

describe("useStudentClasses — bộ lọc", () => {
  const duLieu = [
    lop({ _id: "1", className: "Toán 12A", subject: "Toán", status: "Active" }),
    lop({ _id: "2", className: "Vật lý 11B", subject: "Lý", status: "Completed" }),
  ];

  it("đổi bộ lọc KHÔNG gọi lại API — chỉ lọc trên dữ liệu đã có", async () => {
    vi.mocked(studentClassApi.fetchMyClasses).mockResolvedValue(duLieu);

    const { result } = renderHook(() => useStudentClasses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSubjectFilter("Lý"));

    expect(result.current.filteredClasses.map((c) => c.className)).toEqual(["Vật lý 11B"]);
    expect(result.current.classes).toHaveLength(2); // danh sách gốc còn nguyên
    expect(studentClassApi.fetchMyClasses).toHaveBeenCalledTimes(1);
  });

  it("resetFilters đưa về mặc định và hiện lại toàn bộ", async () => {
    vi.mocked(studentClassApi.fetchMyClasses).mockResolvedValue(duLieu);

    const { result } = renderHook(() => useStudentClasses(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setSearch("Toán"));
    act(() => result.current.setStatusFilter("Active"));
    expect(result.current.filteredClasses).toHaveLength(1);

    act(() => result.current.resetFilters());

    expect(result.current.filters).toEqual({
      search: "",
      status: "ALL",
      semester: "ALL",
      subject: "ALL",
      sortBy: "name_asc",
    });
    expect(result.current.filteredClasses).toHaveLength(2);
  });
});
