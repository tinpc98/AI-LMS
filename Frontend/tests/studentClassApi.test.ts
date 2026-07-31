// Chốt việc sửa lỗi P1 ở Wave 1.1: bỏ Math.random khỏi tiến độ học tập.
//
// Trước Wave 1, hàm này sinh số ngẫu nhiên 50-89% làm "tiến độ" cho MỌI học sinh, vì
// Backend chưa từng trả field progress nên nhánh fallback luôn chạy. Nay Backend trả số
// thật, và khi không tính được thì trả null để UI hiện "—".
//
// Test này chốt lại điều quan trọng nhất: null KHÁC 0. null nghĩa là "chưa xác định
// được", 0 nghĩa là "chưa học gì". Gộp hai cái làm một là báo sai cho học sinh.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { studentClassApi } from "../src/api/studentClassApi";
import { classApi } from "../src/api/classApi";

const mockClasses = (items: unknown[]) =>
  vi.spyOn(classApi, "getMyClasses").mockResolvedValue({ data: { data: items } } as never);

beforeEach(() => vi.restoreAllMocks());

describe("studentClassApi.fetchMyClasses — tiến độ học tập", () => {
  it("giữ nguyên số tiến độ do Backend trả về", async () => {
    mockClasses([{ _id: "c1", className: "Toán", progress: 42 }]);
    const [item] = await studentClassApi.fetchMyClasses();
    expect(item.progress).toBe(42);
  });

  it("giữ nguyên 0 — 'chưa học gì' là thông tin thật, không phải thiếu dữ liệu", async () => {
    mockClasses([{ _id: "c1", className: "Toán", progress: 0 }]);
    const [item] = await studentClassApi.fetchMyClasses();
    expect(item.progress).toBe(0);
    expect(item.progress).not.toBeNull();
  });

  it("Backend không trả progress thì ra null, TUYỆT ĐỐI không sinh số ngẫu nhiên", async () => {
    mockClasses([{ _id: "c1", className: "Toán" }]);
    const [item] = await studentClassApi.fetchMyClasses();
    expect(item.progress).toBeNull();
  });

  it("gọi hai lần trên cùng dữ liệu cho kết quả GIỐNG HỆT nhau", async () => {
    mockClasses([{ _id: "c1", className: "Toán" }]);
    const lan1 = await studentClassApi.fetchMyClasses();
    mockClasses([{ _id: "c1", className: "Toán" }]);
    const lan2 = await studentClassApi.fetchMyClasses();
    // Trước Wave 1, hai lần gọi cho hai con số khác nhau — dấu hiệu rõ nhất của việc bịa số.
    expect(lan1[0].progress).toBe(lan2[0].progress);
  });

  it("progress không phải số (null/chuỗi) đều quy về null", async () => {
    mockClasses([
      { _id: "c1", className: "A", progress: null },
      { _id: "c2", className: "B", progress: "80" },
    ]);
    const items = await studentClassApi.fetchMyClasses();
    expect(items[0].progress).toBeNull();
    expect(items[1].progress).toBeNull();
  });
});

describe("studentClassApi.fetchMyClasses — ánh xạ trạng thái lớp", () => {
  it("quy đổi đúng trạng thái từ Backend sang trạng thái hiển thị", async () => {
    mockClasses([
      { _id: "1", status: "completed" },
      { _id: "2", status: "closed" },
      { _id: "3", status: "draft" },
      { _id: "4", status: "active" },
    ]);
    const items = await studentClassApi.fetchMyClasses();
    expect(items.map((i) => i.status)).toEqual(["Completed", "Paused", "Ready", "Active"]);
  });

  it("phản hồi rỗng hoặc sai định dạng trả mảng rỗng, không ném lỗi", async () => {
    vi.spyOn(classApi, "getMyClasses").mockResolvedValue({ data: null } as never);
    await expect(studentClassApi.fetchMyClasses()).resolves.toEqual([]);
  });

  it("đếm sĩ số ưu tiên mảng students, không có thì lấy currentStudents", async () => {
    mockClasses([
      { _id: "1", students: [{}, {}, {}] },
      { _id: "2", currentStudents: 7 },
    ]);
    const items = await studentClassApi.fetchMyClasses();
    expect(items[0].totalStudents).toBe(3);
    expect(items[1].totalStudents).toBe(7);
  });
});
