// Chốt việc ghép dữ liệu cho màn hình chi tiết lớp học.
//
// Đây là chỗ rối nhất trong nhóm A: bốn nhóm API, ba hình dạng phản hồi khác nhau, và một
// vòng lặp N+1 hỏi trạng thái nộp bài. Trước Wave 5 nó nằm trong useEffect nên không kiểm
// được nếu không dựng React và mock mạng — và chưa từng có test nào.
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchClassDetail,
  selectPublishedLessons,
} from "../src/features/class/classDetail.service";
import type { ILesson } from "../src/interface/lessonInterface";

vi.mock("../src/api/classApi", () => ({ classApi: { getClassById: vi.fn() } }));
vi.mock("../src/api/lessonApi", () => ({ lessonApi: { getLessonsByClass: vi.fn() } }));
vi.mock("../src/api/assignmentApi", () => ({
  default: { getAssignmentsByClass: vi.fn(), getMySubmission: vi.fn() },
}));

import { classApi } from "../src/api/classApi";
import { lessonApi } from "../src/api/lessonApi";
import assignmentApi from "../src/api/assignmentApi";

const bai = (over: Partial<ILesson>): ILesson =>
  ({ _id: "l", title: "Bài", isPublished: true, ...over }) as ILesson;

// JWT hợp lệ về định dạng, payload chứa _id — service cần nó để đi hỏi trạng thái nộp bài.
const tokenHocSinh = (() => {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${b64({ alg: "HS256" })}.${b64({ _id: "hs-1" })}.x`;
})();

beforeEach(() => {
  localStorage.clear();
  vi.mocked(classApi.getClassById).mockResolvedValue({ data: { data: { _id: "c1" } } } as never);
  vi.mocked(lessonApi.getLessonsByClass).mockResolvedValue({ data: { lessons: [] } } as never);
  vi.mocked(assignmentApi.getAssignmentsByClass).mockResolvedValue([] as never);
});

describe("selectPublishedLessons", () => {
  it("chỉ giữ bài đã xuất bản", () => {
    const kq = selectPublishedLessons([
      bai({ _id: "1", isPublished: true }),
      bai({ _id: "2", isPublished: false }),
    ]);
    expect(kq.map((l) => l._id)).toEqual(["1"]);
  });

  it("xếp theo thứ tự giáo viên đặt; thiếu order thì coi như 0", () => {
    const kq = selectPublishedLessons([
      bai({ _id: "c", order: 3 }),
      bai({ _id: "a" }),
      bai({ _id: "b", order: 1 }),
    ]);
    expect(kq.map((l) => l._id)).toEqual(["a", "b", "c"]);
  });

  it("không đụng vào mảng đầu vào — nó là dữ liệu trong cache dùng chung", () => {
    const goc = [bai({ _id: "z", order: 9 }), bai({ _id: "a", order: 1 })];
    const truoc = goc.map((l) => l._id);
    selectPublishedLessons(goc);
    expect(goc.map((l) => l._id)).toEqual(truoc);
  });
});

describe("fetchClassDetail — gỡ các hình dạng phản hồi khác nhau", () => {
  it("lớp học: nhận cả data.data lẫn data phẳng", async () => {
    vi.mocked(classApi.getClassById).mockResolvedValue({
      data: { data: { _id: "c1", className: "Toán 12A" } },
    } as never);
    expect((await fetchClassDetail("c1")).classInfo).toMatchObject({ className: "Toán 12A" });

    vi.mocked(classApi.getClassById).mockResolvedValue({
      data: { _id: "c1", className: "Lý 11B" },
    } as never);
    expect((await fetchClassDetail("c1")).classInfo).toMatchObject({ className: "Lý 11B" });
  });

  it("bài giảng: nhận cả data.lessons lẫn lessons", async () => {
    vi.mocked(lessonApi.getLessonsByClass).mockResolvedValue({
      data: { lessons: [bai({ _id: "x" })] },
    } as never);
    expect((await fetchClassDetail("c1")).lessons.map((l) => l._id)).toEqual(["x"]);

    vi.mocked(lessonApi.getLessonsByClass).mockResolvedValue({
      lessons: [bai({ _id: "y" })],
    } as never);
    expect((await fetchClassDetail("c1")).lessons.map((l) => l._id)).toEqual(["y"]);
  });

  it("bài tập: nhận cả mảng trần lẫn { data: [...] }", async () => {
    vi.mocked(assignmentApi.getAssignmentsByClass).mockResolvedValue([{ _id: "a1" }] as never);
    expect((await fetchClassDetail("c1")).assignments).toHaveLength(1);

    vi.mocked(assignmentApi.getAssignmentsByClass).mockResolvedValue({
      data: [{ _id: "a1" }, { _id: "a2" }],
    } as never);
    expect((await fetchClassDetail("c1")).assignments).toHaveLength(2);
  });
});

describe("fetchClassDetail — chịu lỗi từng phần", () => {
  it("bài giảng hỏng vẫn hiện được phần còn lại của trang", async () => {
    vi.mocked(lessonApi.getLessonsByClass).mockRejectedValue(new Error("500"));
    vi.mocked(assignmentApi.getAssignmentsByClass).mockResolvedValue([{ _id: "a1" }] as never);

    const kq = await fetchClassDetail("c1");

    expect(kq.lessons).toEqual([]);
    expect(kq.classInfo).not.toBeNull();
    expect(kq.assignments).toHaveLength(1);
  });

  it("THÔNG TIN LỚP hỏng thì phải ném lỗi — không còn gì để hiện", async () => {
    // Phân biệt có chủ đích: hỏng phần phụ thì hiện trang thiếu, hỏng phần lõi thì báo lỗi.
    // Nuốt luôn lỗi này sẽ cho ra một trang trắng trơn không kèm lời giải thích nào.
    vi.mocked(classApi.getClassById).mockRejectedValue(new Error("404"));
    await expect(fetchClassDetail("c1")).rejects.toThrow();
  });
});

describe("fetchClassDetail — trạng thái đã nộp bài", () => {
  const haiBaiTap = [{ _id: "a1" }, { _id: "a2" }];

  it("không đăng nhập thì không hỏi API nộp bài lần nào", async () => {
    vi.mocked(assignmentApi.getAssignmentsByClass).mockResolvedValue(haiBaiTap as never);

    const kq = await fetchClassDetail("c1");

    expect(kq.submittedAssignmentIds).toEqual([]);
    expect(assignmentApi.getMySubmission).not.toHaveBeenCalled();
  });

  it("chỉ tính bài đã nộp và CHƯA rút lại", async () => {
    localStorage.setItem("accessToken", tokenHocSinh);
    vi.mocked(assignmentApi.getAssignmentsByClass).mockResolvedValue([
      { _id: "a1" },
      { _id: "a2" },
      { _id: "a3" },
    ] as never);
    vi.mocked(assignmentApi.getMySubmission).mockImplementation(async (id: string) => {
      if (id === "a1") return { status: "submitted" } as never;
      if (id === "a2") return { status: "withdrawn" } as never; // đã rút -> không tính
      throw new Error("404"); // a3 chưa nộp
    });

    const kq = await fetchClassDetail("c1");

    expect(kq.submittedAssignmentIds).toEqual(["a1"]);
  });

  it("một bài tập hỏng không kéo sập cả trang", async () => {
    localStorage.setItem("accessToken", tokenHocSinh);
    vi.mocked(assignmentApi.getAssignmentsByClass).mockResolvedValue(haiBaiTap as never);
    vi.mocked(assignmentApi.getMySubmission).mockImplementation(async (id: string) => {
      if (id === "a1") throw new Error("lỗi máy chủ");
      return { status: "submitted" } as never;
    });

    await expect(fetchClassDetail("c1")).resolves.toMatchObject({
      submittedAssignmentIds: ["a2"],
    });
  });

  it("không có bài tập nào thì không gọi API nộp bài", async () => {
    localStorage.setItem("accessToken", tokenHocSinh);
    const kq = await fetchClassDetail("c1");

    expect(kq.submittedAssignmentIds).toEqual([]);
    expect(assignmentApi.getMySubmission).not.toHaveBeenCalled();
  });
});
