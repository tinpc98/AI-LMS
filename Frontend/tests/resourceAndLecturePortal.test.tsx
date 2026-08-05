import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ResourceViewPage } from "../src/features/lesson/pages/ResourceViewPage";
import { LectureViewPage } from "../src/features/lesson/pages/LectureViewPage";
import { classApi } from "../src/api/classApi";
import { lessonApi } from "../src/api/lessonApi";

// Mock API
vi.mock("../src/api/classApi", () => ({
  classApi: {
    getClassById: vi.fn(),
    removeResource: vi.fn(),
  },
}));

vi.mock("../src/api/lessonApi", () => ({
  lessonApi: {
    getLessonsByClass: vi.fn(),
  },
}));

vi.mock("../src/api/learningApi", () => ({
  default: {
    getStudentProgress: vi.fn().mockResolvedValue([]),
    updateLessonProgress: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../src/api/aiApi", () => ({
  default: {
    getLessonSummary: vi.fn().mockResolvedValue({ content: "Tóm tắt mẫu" }),
    generateLessonSummary: vi.fn().mockResolvedValue({ content: "Tóm tắt mẫu" }),
  },
}));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe("Thống nhất trình xem Resource & Lecture cho Teacher và Student", () => {
  it("ResourceViewPage hiển thị nút Xóa và Xem như học sinh khi ở route Teacher", async () => {
    (classApi.getClassById as any).mockResolvedValue({
      data: {
        _id: "class123",
        className: "Lớp Toán 12",
        resources: [
          {
            _id: "res456",
            title: "Tài liệu Đại số",
            type: "pdf",
            url: "https://example.com/math.pdf",
          },
        ],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/teacher/classroom-detail/class123/resource/res456"]}>
          <Routes>
            <Route
              path="/teacher/classroom-detail/:classId/resource/:resourceId"
              element={<ResourceViewPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    // Chờ tải dữ liệu
    const titles = await screen.findAllByText("Tài liệu Đại số");
    expect(titles.length).toBeGreaterThan(0);
    // Teacher portal hiển thị nút "Xem như học viên" và "Xóa tài liệu"
    expect(screen.getByText("Xem như học viên")).toBeDefined();
    expect(screen.getByText("Xóa tài liệu")).toBeDefined();
  });

  it("ResourceViewPage KHÔNG hiển thị nút Xóa/Xem thử khi ở route Student", async () => {
    (classApi.getClassById as any).mockResolvedValue({
      data: {
        _id: "class123",
        className: "Lớp Toán 12",
        resources: [
          {
            _id: "res456",
            title: "Tài liệu Đại số",
            type: "pdf",
            url: "https://example.com/math.pdf",
          },
        ],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/student/classdetail/class123/resource/res456"]}>
          <Routes>
            <Route
              path="/student/classdetail/:classId/resource/:resourceId"
              element={<ResourceViewPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const titles = await screen.findAllByText("Tài liệu Đại số");
    expect(titles.length).toBeGreaterThan(0);
    // Student portal không có nút Xem như học viên hay Xóa
    expect(screen.queryByText("Xem như học viên")).toBeNull();
    expect(screen.queryByText("Xóa tài liệu")).toBeNull();
  });

  it("LectureViewPage nhận diện Teacher portal và render thông tin bài giảng", async () => {
    (lessonApi.getLessonsByClass as any).mockResolvedValue({
      data: {
        lessons: [
          {
            _id: "lec789",
            title: "Bài 1: Khảo sát hàm số",
            content: "Nội dung bài học",
            videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          },
        ],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/teacher/classroom-detail/class123/lecture/lec789"]}>
          <Routes>
            <Route
              path="/teacher/classroom-detail/:classId/lecture/:lectureId"
              element={<LectureViewPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const titles = await screen.findAllByText(/Khảo sát hàm số/);
    expect(titles.length).toBeGreaterThan(0);
    // Ở Teacher portal, nút 'Đánh dấu đã học' bị ẩn
    expect(screen.queryByText("Đánh dấu đã học")).toBeNull();
  });

  it("ResourceViewPage bóc đúng dữ liệu khi backend trả về cấu trúc lồng { success: true, data: { resources: [...] } }", async () => {
    (classApi.getClassById as any).mockResolvedValue({
      data: {
        success: true,
        message: "Lấy chi tiết lớp học thành công",
        data: {
          _id: "class999",
          className: "Lớp Hóa Học 10",
          resources: [
            {
              _id: "res999",
              title: "Tài liệu Phản ứng Oxi hóa",
              type: "Document",
              url: "https://example.com/hoa10.docx",
            },
          ],
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/student/classdetail/class999/resource/res999"]}>
          <Routes>
            <Route
              path="/student/classdetail/:classId/resource/:resourceId"
              element={<ResourceViewPage />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const titles = await screen.findAllByText("Tài liệu Phản ứng Oxi hóa");
    expect(titles.length).toBeGreaterThan(0);
    expect(screen.queryByText("Không tìm thấy tài liệu học tập này")).toBeNull();
  });
});
